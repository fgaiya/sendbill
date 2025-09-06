export type Plan = 'FREE' | 'PRO';
export type Metric = 'DOCUMENT_CREATE' | 'PDF_GENERATE';
export type Period = 'DAILY' | 'MONTHLY';

export type BlockReason =
  | 'NOT_AUTHENTICATED'
  | 'NOT_PROVISIONED'
  | 'FEATURE_DISABLED'
  | 'LIMIT_REACHED'
  | 'INTERNAL_ERROR';

export interface UsageInfo {
  period: Period;
  periodKey: string;
  metric: Metric;
  used: number;
  limit: number;
  remaining: number;
  graceLimit: number;
  graceUsed: number;
  planAtThatTime: Plan;
  warn: boolean;
}

export interface GuardResult {
  allowed: boolean;
  warn: boolean;
  blockedReason?: BlockReason;
  usage?: UsageInfo;
}

export interface UsageSummaryItem {
  used: number;
  limit: number;
  remaining: number;
  warn: boolean;
}

export interface UsageSummary {
  monthlyDocuments: UsageSummaryItem;
  plan: Plan;
}
