import { NextResponse } from 'next/server';

import { adjustCurrentPeriodLimits } from '@/lib/domains/billing/metering';
import { BILLING_FLAGS } from '@/lib/shared/constants';
import { apiErrors } from '@/lib/shared/forms';
import { getPrisma } from '@/lib/shared/prisma';
import { requireUserCompany } from '@/lib/shared/utils/auth';

const STRIPE_API = 'https://api.stripe.com/v1';

export async function POST() {
  const { company, error, status } = await requireUserCompany();
  if (error || !company)
    return NextResponse.json(error ?? apiErrors.forbidden(), {
      status: status ?? 403,
    });

  // 購入はフラグで遮断しても、解約は常時許可する（フラグ無効でもDB上はFREE化）

  const secret = process.env.STRIPE_SECRET_KEY;
  const subId = company.stripeSubscriptionId;
  if (!BILLING_FLAGS.STRIPE_ENABLED || !secret || !subId) {
    await getPrisma().company.updateMany({
      where: { id: company.id },
      data: {
        plan: 'FREE',
        subscriptionStatus: 'canceled',
        stripeSubscriptionId: null,
      },
    });
    await adjustCurrentPeriodLimits(company.id);
    return NextResponse.json({ ok: true, localOnly: true });
  }

  try {
    // 即時キャンセル（今すぐFreeへ切替）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    const res = await fetch(`${STRIPE_API}/subscriptions/${subId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${secret}` },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const json = await res.json();
    if (!res.ok) {
      console.error('Stripe immediate cancel error:', json);
      // ローカル即時FREE化（Stripe失敗時もユーザーをブロックしない）
      await getPrisma().company.updateMany({
        where: { id: company.id },
        data: {
          plan: 'FREE',
          subscriptionStatus: 'canceled',
          stripeSubscriptionId: null,
        },
      });
      await adjustCurrentPeriodLimits(company.id);
      return NextResponse.json({ ok: true, stripeError: true });
    }

    // 即時反映（Webhookも流れるが、UX向上のため反映）。冪等に更新。
    await getPrisma().company.updateMany({
      where: { id: company.id, stripeSubscriptionId: subId },
      data: {
        plan: 'FREE',
        subscriptionStatus: 'canceled',
        stripeSubscriptionId: null,
      },
    });
    await adjustCurrentPeriodLimits(company.id);

    return NextResponse.json({ ok: true });
  } catch (e) {
    // タイムアウトやネットワーク障害時もローカル即時FREE化（冪等）
    if (e instanceof Error && e.name === 'AbortError') {
      await getPrisma().company.updateMany({
        where: { id: company.id },
        data: {
          plan: 'FREE',
          subscriptionStatus: 'canceled',
          stripeSubscriptionId: null,
        },
      });
      await adjustCurrentPeriodLimits(company.id);
      return NextResponse.json({ ok: true, stripeTimeout: true });
    }
    console.error('Cancel error:', e);
    await getPrisma().company.updateMany({
      where: { id: company.id },
      data: {
        plan: 'FREE',
        subscriptionStatus: 'canceled',
        stripeSubscriptionId: null,
      },
    });
    await adjustCurrentPeriodLimits(company.id);
    return NextResponse.json({ ok: true, stripeError: true });
  }
}
