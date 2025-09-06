import { NextRequest, NextResponse } from 'next/server';

import { BILLING_FLAGS } from '@/lib/shared/constants';
import { apiErrors } from '@/lib/shared/forms';
import { getPrisma } from '@/lib/shared/prisma';
import { requireUserCompany } from '@/lib/shared/utils/auth';

const STRIPE_API = 'https://api.stripe.com/v1';

function formBody(
  params: Record<string, string | number | boolean | undefined>
) {
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue;
    body.append(k, String(v));
  }
  return body.toString();
}

export async function POST(request: NextRequest) {
  const { company, user, error, status } = await requireUserCompany();
  if (error || !company)
    return NextResponse.json(error ?? apiErrors.forbidden(), {
      status: status ?? 403,
    });

  if (!BILLING_FLAGS.STRIPE_ENABLED) {
    return NextResponse.json(
      {
        error:
          'Stripe未有効です。環境変数でBILLING_FEATURE_STRIPE=trueを設定してください。',
      },
      { status: 501 }
    );
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  const price = process.env.STRIPE_PRICE_PRO_MONTHLY;
  if (!secret || !price) {
    return NextResponse.json(
      { error: 'Stripe環境変数が未設定です' },
      { status: 500 }
    );
  }

  const url = new URL(request.url);
  const origin = process.env.APP_BASE_URL || url.origin;

  const prisma = getPrisma();
  let customerId = company.stripeCustomerId || undefined;
  try {
    // 1) Customer 作成（未作成の場合）
    if (!customerId) {
      const customerRes = await fetch(`${STRIPE_API}/customers`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secret}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formBody({
          email: user?.email || undefined,
          // 参照用メタデータ
          'metadata[companyId]': company.id,
        }),
      });
      const customerJson = await customerRes.json();
      if (!customerRes.ok || !customerJson?.id) {
        console.error('Stripe customer create error:', customerJson);
        return NextResponse.json(
          { error: 'Checkoutの作成に失敗しました（CUST）' },
          { status: 500 }
        );
      }
      customerId = customerJson.id as string;
      await prisma.company.update({
        where: { id: company.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // 2) Checkout Session 作成（サブスク）
    const idem =
      request.headers.get('x-idempotency-key') || `${company.id}:${user?.id}`;
    const sessionRes = await fetch(`${STRIPE_API}/checkout/sessions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Idempotency-Key': idem,
      },
      body: formBody({
        mode: 'subscription',
        success_url: `${origin}/dashboard?upgrade=success`,
        cancel_url: `${origin}/dashboard?upgrade=cancel`,
        customer: customerId,
        client_reference_id: company.id,
        'line_items[0][price]': price,
        'line_items[0][quantity]': 1,
        allow_promotion_codes: true,
      }),
    });
    const sessionJson = await sessionRes.json();
    if (!sessionRes.ok || !sessionJson?.url) {
      console.error('Stripe session create error:', sessionJson);
      return NextResponse.json(
        { error: 'Checkoutの作成に失敗しました（SESS）' },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: sessionJson.url as string });
  } catch (e) {
    console.error('Checkout error:', e);
    return NextResponse.json(
      { error: 'Checkoutの作成に失敗しました' },
      { status: 500 }
    );
  }
}
