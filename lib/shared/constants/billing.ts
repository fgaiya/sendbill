// 課金・使用量計測関連の設定

function num(key: string, fallback: number): number {
  const raw = process.env[key];
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) ? (n as number) : fallback;
}

function bool(key: string, fallback: boolean): boolean {
  const raw = process.env[key];
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return fallback;
}

export const BILLING_FLAGS = {
  STRIPE_ENABLED: bool('BILLING_FEATURE_STRIPE', false),
  WATERMARK_ENABLED: bool('BILLING_FEATURE_WATERMARK', true),
} as const;

export const BILLING_LIMITS = {
  FREE: {
    MONTHLY_DOCUMENT_CREATE: num('BILLING_FREE_MONTHLY_DOC_LIMIT', 10),
  },
  PRO: {
    MONTHLY_DOCUMENT_CREATE: num('BILLING_PRO_MONTHLY_DOC_LIMIT', 1000),
  },
  WARN_PERCENT: Math.min(Math.max(num('BILLING_WARN_PERCENT', 0.8), 0), 0.99),
  GRACE: {
    DOCUMENT_CREATE: Math.max(0, num('BILLING_GRACE_UNITS_DOCUMENT', 3)),
  },
} as const;

export type BillingPlan = 'FREE' | 'PRO';
