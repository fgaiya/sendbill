import { Prisma } from '@prisma/client/edge';

import { getPrisma } from '@/lib/shared/prisma';

import {
  getLimitFor,
  getPeriodForMetric,
  getPeriodKey,
  getGraceFor,
  getWarnThreshold,
} from './limits';

import type {
  GuardResult,
  Metric,
  Period,
  Plan,
  UsageInfo,
  UsageSummary,
} from './types';

async function getCompanyPlan(companyId: string): Promise<Plan> {
  const company = await getPrisma().company.findUnique({
    where: { id: companyId },
    select: { plan: true },
  });
  const raw = company?.plan;
  const plan: Plan = raw === 'PRO' ? 'PRO' : 'FREE';
  return plan;
}

async function getOrInitCounter(
  companyId: string,
  metric: Metric,
  period: Period,
  now = new Date()
): Promise<unknown> {
  const prisma = getPrisma();
  const periodKey = getPeriodKey(period, now);

  let counter = await prisma.usageCounter.findUnique({
    where: {
      companyId_period_periodKey_metric: {
        companyId,
        period,
        periodKey,
        metric,
      },
    },
  });

  const currentPlan = await getCompanyPlan(companyId);
  const desiredLimit = getLimitFor(currentPlan, metric);
  const desiredGrace = getGraceFor(metric);

  if (!counter) {
    try {
      counter = await prisma.usageCounter.create({
        data: {
          companyId,
          metric,
          period,
          periodKey,
          used: 0,
          limit: desiredLimit,
          planAtThatTime: currentPlan,
          graceLimit: desiredGrace,
          graceUsed: 0,
        },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        counter = await prisma.usageCounter.findUnique({
          where: {
            companyId_period_periodKey_metric: {
              companyId,
              period,
              periodKey,
              metric,
            },
          },
        });
        if (!counter) {
          throw new Error(
            `Failed to create or find usage counter for companyId: ${companyId}, metric: ${metric}`
          );
        }
      } else {
        throw e;
      }
    }
  } else {
    // プランが変わっていたら上限を追随（自己修復）
    const rec = coerceCounterRecord(counter);
    if (rec.planAtThatTime !== currentPlan || rec.limit !== desiredLimit) {
      await prisma.usageCounter.update({
        where: {
          companyId_period_periodKey_metric: {
            companyId,
            period,
            periodKey,
            metric,
          },
        },
        data: { limit: desiredLimit, planAtThatTime: currentPlan },
      });
      counter = await prisma.usageCounter.findUnique({
        where: {
          companyId_period_periodKey_metric: {
            companyId,
            period,
            periodKey,
            metric,
          },
        },
      });
    }
  }

  return counter!;
}

type CounterRecord = {
  used: number;
  limit: number;
  graceLimit: number;
  graceUsed: number;
  period: Period;
  periodKey: string;
  metric: Metric;
  planAtThatTime: Plan;
};

function coerceCounterRecord(raw: unknown): CounterRecord {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid counter record');
  }
  const r = raw as Record<string, unknown>;
  const num = (v: unknown): number =>
    typeof v === 'number' ? v : Number(v ?? 0);
  const str = (v: unknown): string =>
    typeof v === 'string' ? v : String(v ?? '');
  const asPeriod = (v: unknown): Period =>
    v === 'DAILY' ? 'DAILY' : 'MONTHLY';
  const asMetric = (v: unknown): Metric =>
    v === 'PDF_GENERATE' ? 'PDF_GENERATE' : 'DOCUMENT_CREATE';
  const asPlan = (v: unknown): Plan => (v === 'PRO' ? 'PRO' : 'FREE');
  return {
    used: num(r.used),
    limit: num(r.limit),
    graceLimit: num(r.graceLimit),
    graceUsed: num(r.graceUsed),
    period: asPeriod(r.period),
    periodKey: str(r.periodKey),
    metric: asMetric(r.metric),
    planAtThatTime: asPlan(r.planAtThatTime),
  };
}

function toUsageInfo(counter: CounterRecord): UsageInfo {
  const hardRemaining = Math.max(0, counter.limit - counter.used);
  const graceRemaining = Math.max(0, counter.graceLimit - counter.graceUsed);
  const remaining = hardRemaining + graceRemaining;
  const warn =
    counter.limit > 0 &&
    counter.used >= Math.floor(counter.limit * getWarnThreshold());
  return {
    period: counter.period,
    periodKey: counter.periodKey,
    metric: counter.metric,
    used: counter.used,
    limit: counter.limit,
    remaining,
    graceLimit: counter.graceLimit,
    graceUsed: counter.graceUsed,
    planAtThatTime: counter.planAtThatTime,
    warn,
  };
}

export async function checkAndConsume(
  companyId: string,
  metric: Metric,
  inc = 1
): Promise<GuardResult> {
  const period = getPeriodForMetric(metric);
  const counter = await getOrInitCounter(companyId, metric, period);
  const usage = toUsageInfo(coerceCounterRecord(counter));
  const allowedHard = usage.used + inc <= usage.limit;
  const needGrace = !allowedHard && usage.used >= usage.limit;
  const allowedGrace = !allowedHard && usage.remaining >= inc;

  if (!allowedHard && !allowedGrace) {
    return {
      allowed: false,
      warn: false,
      blockedReason: 'LIMIT_REACHED',
      usage,
    };
  }

  // consume
  const prisma = getPrisma();
  if (allowedHard) {
    await prisma.usageCounter.update({
      where: {
        companyId_period_periodKey_metric: {
          companyId,
          period,
          periodKey: usage.periodKey,
          metric,
        },
      },
      data: { used: { increment: inc } },
    });
  } else {
    // consume grace
    await prisma.usageCounter.update({
      where: {
        companyId_period_periodKey_metric: {
          companyId,
          period,
          periodKey: usage.periodKey,
          metric,
        },
      },
      data: { graceUsed: { increment: inc } },
    });
  }

  const warn = usage.warn || needGrace;
  return { allowed: true, warn, usage };
}

export async function peekUsage(
  companyId: string,
  metric: Metric
): Promise<GuardResult> {
  const period = getPeriodForMetric(metric);
  const counter = await getOrInitCounter(companyId, metric, period);
  const usage = toUsageInfo(coerceCounterRecord(counter));
  return { allowed: usage.remaining > 0, warn: usage.warn, usage };
}

export async function getUsageSummary(
  companyId: string
): Promise<UsageSummary> {
  const plan = await getCompanyPlan(companyId);
  const monthlyDoc = await getOrInitCounter(
    companyId,
    'DOCUMENT_CREATE',
    'MONTHLY'
  );
  const toItem = (c: unknown) => {
    const info = toUsageInfo(coerceCounterRecord(c));
    return {
      used: info.used,
      limit: info.limit, // 表示は上限そのもの（猶予はremainingに含まれる）
      remaining: info.remaining,
      warn: info.warn,
    };
  };
  return {
    monthlyDocuments: toItem(monthlyDoc),
    plan,
  };
}

/**
 * 現在の期間（当月/当日）のカウンタ上限を、会社の現行プランに合わせて調整する
 * プラン変更（Upgrade/Downgrade）時に呼び出す
 */
export async function adjustCurrentPeriodLimits(
  companyId: string,
  metrics: Metric[] = ['DOCUMENT_CREATE']
): Promise<void> {
  const prisma = getPrisma();
  const plan = await getCompanyPlan(companyId);
  const now = new Date();
  for (const metric of metrics) {
    const period = getPeriodForMetric(metric);
    const periodKey = getPeriodKey(period, now);
    const limit = getLimitFor(plan, metric);
    const existing = await prisma.usageCounter.findUnique({
      where: {
        companyId_period_periodKey_metric: {
          companyId,
          period,
          periodKey,
          metric,
        },
      },
    });
    if (existing) {
      await prisma.usageCounter.update({
        where: {
          companyId_period_periodKey_metric: {
            companyId,
            period,
            periodKey,
            metric,
          },
        },
        data: { limit, planAtThatTime: plan },
      });
    } else {
      await prisma.usageCounter.create({
        data: {
          companyId,
          metric,
          period,
          periodKey,
          used: 0,
          limit,
          planAtThatTime: plan,
          graceLimit: getGraceFor(metric),
          graceUsed: 0,
        },
      });
    }
  }
}
