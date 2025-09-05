import { BILLING_LIMITS } from '@/lib/shared/constants';

import type { Plan, Metric, Period } from './types';

export function getPeriodForMetric(metric: Metric): Period {
  switch (metric) {
    case 'DOCUMENT_CREATE':
      return 'MONTHLY';
    default:
      throw new Error(`Unsupported metric: ${String(metric)}`);
  }
}

export function getLimitFor(plan: Plan, metric: Metric): number {
  if (metric !== 'DOCUMENT_CREATE') {
    throw new Error(`No limit configured for metric: ${String(metric)}`);
  }
  return plan === 'PRO'
    ? BILLING_LIMITS.PRO.MONTHLY_DOCUMENT_CREATE
    : BILLING_LIMITS.FREE.MONTHLY_DOCUMENT_CREATE;
}

export function getGraceFor(metric: Metric): number {
  if (metric !== 'DOCUMENT_CREATE') {
    throw new Error(`No grace configured for metric: ${String(metric)}`);
  }
  return BILLING_LIMITS.GRACE.DOCUMENT_CREATE;
}

export function getWarnThreshold(): number {
  return BILLING_LIMITS.WARN_PERCENT;
}

export function getPeriodKey(period: Period, now = new Date()): string {
  const y = now.getFullYear();
  const m = `${now.getMonth() + 1}`.padStart(2, '0');
  const d = `${now.getDate()}`.padStart(2, '0');
  return period === 'MONTHLY' ? `${y}-${m}` : `${y}-${m}-${d}`;
}
