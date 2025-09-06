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
): Promise<CounterRecord> {
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
    if (
      rec.planAtThatTime !== currentPlan ||
      rec.limit !== desiredLimit ||
      rec.graceLimit !== desiredGrace
    ) {
      await prisma.usageCounter.update({
        where: {
          companyId_period_periodKey_metric: {
            companyId,
            period,
            periodKey,
            metric,
          },
        },
        data: {
          limit: desiredLimit,
          graceLimit: desiredGrace,
          planAtThatTime: currentPlan,
        },
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

  return coerceCounterRecord(counter!);
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
  // inc を正の整数に正規化
  const step = Math.max(1, Math.floor(Number(inc)) || 1);
  const period = getPeriodForMetric(metric);
  const periodKey = getPeriodKey(period);
  // カウンタが無ければ初期化（自己修復を含む）
  await getOrInitCounter(companyId, metric, period);

  const prisma = getPrisma();
  // 競合時の再試行（最大3回）
  for (let attempt = 0; attempt < 3; attempt++) {
    const current = await prisma.usageCounter.findUnique({
      where: {
        companyId_period_periodKey_metric: {
          companyId,
          period,
          periodKey,
          metric,
        },
      },
    });
    if (!current) {
      await getOrInitCounter(companyId, metric, period);
      continue;
    }

    const snap = coerceCounterRecord(current);
    const usageBefore = toUsageInfo(snap);

    const allowedHard = snap.used + step <= snap.limit;
    const needGrace = !allowedHard && snap.limit <= snap.used; // ハード到達後にグレース消費
    const allowedGrace = !allowedHard && usageBefore.remaining >= step;

    if (!allowedHard && !allowedGrace) {
      // ブロック時は最新スナップショット（消費前）の使用量を返す
      return {
        allowed: false,
        warn: false,
        blockedReason: 'LIMIT_REACHED',
        usage: usageBefore,
      };
    }

    if (allowedHard) {
      const res = await prisma.usageCounter.updateMany({
        where: {
          companyId,
          metric,
          period,
          periodKey,
          used: snap.used, // CAS 条件
        },
        data: { used: { increment: step } },
      });
      if (res.count === 1) {
        // 消費後のスナップショットに補正して返す
        const after: CounterRecord = { ...snap, used: snap.used + step };
        const usageAfter = toUsageInfo(after);
        const warn = usageAfter.warn || needGrace;
        return { allowed: true, warn, usage: usageAfter };
      }
      // 競合 → 再試行
      continue;
    } else {
      const res = await prisma.usageCounter.updateMany({
        where: {
          companyId,
          metric,
          period,
          periodKey,
          graceUsed: snap.graceUsed, // CAS 条件
        },
        data: { graceUsed: { increment: step } },
      });
      if (res.count === 1) {
        // グレース消費後のスナップショットに補正して返す
        const after: CounterRecord = {
          ...snap,
          graceUsed: snap.graceUsed + step,
        };
        const usageAfter = toUsageInfo(after);
        const warn = usageAfter.warn || needGrace;
        return { allowed: true, warn, usage: usageAfter };
      }
      // 競合 → 再試行
      continue;
    }
  }

  // 再試行上限：最新状態を返してブロック（安全側）
  const latest = await prisma.usageCounter.findUnique({
    where: {
      companyId_period_periodKey_metric: {
        companyId,
        period,
        periodKey,
        metric,
      },
    },
  });
  const latestUsage = latest
    ? toUsageInfo(coerceCounterRecord(latest))
    : undefined;
  return {
    allowed: false,
    warn: false,
    blockedReason: 'INTERNAL_ERROR',
    usage: latestUsage,
  };
}

export async function peekUsage(
  companyId: string,
  metric: Metric
): Promise<GuardResult> {
  const period = getPeriodForMetric(metric);
  const counter = await getOrInitCounter(companyId, metric, period);
  const usage = toUsageInfo(counter);
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
  const toItem = (c: CounterRecord) => {
    const info = toUsageInfo(c);
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
        data: { limit, graceLimit: getGraceFor(metric), planAtThatTime: plan },
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
