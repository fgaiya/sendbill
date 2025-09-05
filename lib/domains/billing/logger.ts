import type { GuardResult, Metric, Plan } from './types';

export function logUsage(
  companyId: string,
  metric: Metric,
  plan: Plan,
  result: GuardResult,
  context: 'check' | 'consume' | 'block' = 'consume'
) {
  try {
    const payload = {
      ts: new Date().toISOString(),
      companyId,
      action: metric,
      plan,
      context,
      allowed: result.allowed,
      warn: result.warn,
      reason: result.blockedReason,
      usage: result.usage && {
        used: result.usage.used,
        limit: result.usage.limit,
        remaining: result.usage.remaining,
        graceLimit: result.usage.graceLimit,
        graceUsed: result.usage.graceUsed,
        period: result.usage.period,
        periodKey: result.usage.periodKey,
      },
    };

    console.log('[usage]', JSON.stringify(payload));
  } catch {
    // ignore logging errors
  }
}
