import crypto from 'crypto';

import { NextRequest, NextResponse } from 'next/server';

import { adjustCurrentPeriodLimits } from '@/lib/domains/billing/metering';
import { BILLING_FLAGS } from '@/lib/shared/constants';
import { getPrisma } from '@/lib/shared/prisma';

// Web CryptoでStripe Webhookの署名を検証（HMAC-SHA256）
async function hmacSHA256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function parseStripeSigHeader(
  header: string | null
): { t: string; v1: string } | null {
  if (!header) return null;
  const parts = header.split(',').map((p) => p.trim());
  let t = '';
  let v1 = '';
  for (const p of parts) {
    const [k, v] = p.split('=');
    if (k === 't') t = v;
    if (k === 'v1') v1 = v;
  }
  return t && v1 ? { t, v1 } : null;
}

export async function POST(req: NextRequest) {
  if (!BILLING_FLAGS.STRIPE_ENABLED) {
    return NextResponse.json(
      {
        error:
          'Stripe未有効です。BILLING_FEATURE_STRIPE=true を設定してください。',
      },
      { status: 501 }
    );
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret)
    return NextResponse.json(
      { error: '未設定: STRIPE_WEBHOOK_SECRET' },
      { status: 500 }
    );

  const raw = await req.text();
  const sigHeader = req.headers.get('stripe-signature');
  const parsed = parseStripeSigHeader(sigHeader);
  if (!parsed)
    return NextResponse.json(
      { error: 'シグネチャヘッダ不正' },
      { status: 400 }
    );

  const expected = await hmacSHA256Hex(secret, `${parsed.t}.${raw}`);
  const expectedBuffer = Buffer.from(expected, 'hex');
  const receivedBuffer = Buffer.from(parsed.v1, 'hex');

  if (
    expectedBuffer.length !== receivedBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  ) {
    return NextResponse.json({ error: '署名検証失敗' }, { status: 400 });
  }

  let evt: unknown;
  try {
    evt = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'JSONパース失敗' }, { status: 400 });
  }

  const type: string = (evt as { type?: string })?.type || '';
  const prisma = getPrisma();

  try {
    switch (type) {
      case 'checkout.session.completed': {
        const obj =
          (evt as { data?: { object?: Record<string, unknown> } }).data
            ?.object || {};
        const companyId = (obj['client_reference_id'] ||
          obj['client_referenceId']) as string | undefined;
        const customer = (obj['customer'] || obj['customer_id']) as
          | string
          | undefined;
        const subscription = (obj['subscription'] || obj['subscription_id']) as
          | string
          | undefined;
        if (!companyId) {
          console.error(
            'checkout.session.completed: missing companyId in session'
          );
          break;
        }
        {
          const res = await prisma.company.updateMany({
            where: { id: companyId },
            data: {
              plan: 'PRO',
              stripeCustomerId: customer ?? undefined,
              stripeSubscriptionId: subscription ?? undefined,
              subscriptionStatus: 'active',
            },
          });
          if (res.count > 0) {
            await adjustCurrentPeriodLimits(companyId);
          } else {
            console.error(
              'checkout.session.completed: company not found for id',
              companyId
            );
          }
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub =
          (evt as { data?: { object?: Record<string, unknown> } }).data
            ?.object || {};
        const subId = sub['id'] as string | undefined;
        const customer = sub['customer'] as string | undefined;
        // subscriptionId を優先してFREEへ。見つからない場合は customer で冪等更新
        if (subId) {
          const res = await prisma.company.updateMany({
            where: { stripeSubscriptionId: subId },
            data: {
              plan: 'FREE',
              subscriptionStatus: 'canceled',
              stripeSubscriptionId: null,
            },
          });
          if (res.count > 0) {
            const c = await prisma.company.findFirst({
              where: {
                stripeSubscriptionId: null,
                stripeCustomerId: customer ?? undefined,
              },
            });
            if (c) await adjustCurrentPeriodLimits(c.id);
          }
        }
        if (customer) {
          const res = await prisma.company.updateMany({
            where: { stripeCustomerId: customer },
            data: {
              plan: 'FREE',
              subscriptionStatus: 'canceled',
              stripeSubscriptionId: null,
            },
          });
          if (res.count > 0) {
            const c = await prisma.company.findFirst({
              where: { stripeCustomerId: customer },
            });
            if (c) await adjustCurrentPeriodLimits(c.id);
          }
        }
        break;
      }
      case 'customer.subscription.updated': {
        const sub =
          (evt as { data?: { object?: Record<string, unknown> } }).data
            ?.object || {};
        const subId = sub['id'] as string | undefined;
        const status = sub['status'] as string | undefined;
        if (subId && status) {
          const res = await prisma.company.updateMany({
            where: { stripeSubscriptionId: subId },
            data: {
              subscriptionStatus: status,
              // active の場合のみ plan を PRO にする（それ以外は変更しない）
              plan: status === 'active' ? 'PRO' : undefined,
            },
          });
          if (res.count > 0 && status === 'active') {
            const c = await prisma.company.findFirst({
              where: { stripeSubscriptionId: subId },
            });
            if (c) await adjustCurrentPeriodLimits(c.id);
          }
        }
        break;
      }
      default: {
        // 他イベントはログのみ
        console.log('Unhandled Stripe event:', type);
      }
    }
  } catch (e) {
    console.error('Stripe webhook handling error', e);
    return NextResponse.json({ error: 'Webhook処理失敗' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
