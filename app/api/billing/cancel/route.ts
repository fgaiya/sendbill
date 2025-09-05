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

  if (!BILLING_FLAGS.STRIPE_ENABLED) {
    return NextResponse.json(
      {
        error:
          'Stripe未有効です。BILLING_FEATURE_STRIPE=true を設定してください。',
      },
      { status: 501 }
    );
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret)
    return NextResponse.json(
      { error: '未設定: STRIPE_SECRET_KEY' },
      { status: 500 }
    );
  const subId = company.stripeSubscriptionId;
  if (!subId)
    return NextResponse.json(
      { error: 'アクティブなサブスクが見つかりません' },
      { status: 400 }
    );

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
      return NextResponse.json(
        { error: 'サブスクのキャンセルに失敗しました' },
        { status: 500 }
      );
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
    if (e instanceof Error && e.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Stripeへのリクエストがタイムアウトしました' },
        { status: 504 }
      );
    }
    console.error('Cancel error:', e);
    return NextResponse.json(
      { error: 'サブスクのキャンセルに失敗しました' },
      { status: 500 }
    );
  }
}
