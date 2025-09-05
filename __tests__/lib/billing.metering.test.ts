import { describe, expect, it, beforeAll, afterAll } from '@jest/globals';

// NOTE: limits は beforeAll 内で動的 import します

describe('billing limits', () => {
  const savedEnv = {
    BILLING_FREE_MONTHLY_DOC_LIMIT: process.env.BILLING_FREE_MONTHLY_DOC_LIMIT,
    BILLING_PRO_MONTHLY_DOC_LIMIT: process.env.BILLING_PRO_MONTHLY_DOC_LIMIT,
    BILLING_FREE_DAILY_PDF_LIMIT: process.env.BILLING_FREE_DAILY_PDF_LIMIT,
    BILLING_PRO_DAILY_PDF_LIMIT: process.env.BILLING_PRO_DAILY_PDF_LIMIT,
    BILLING_WARN_PERCENT: process.env.BILLING_WARN_PERCENT,
  };

  beforeAll(() => {
    process.env.BILLING_FREE_MONTHLY_DOC_LIMIT = '10';
    process.env.BILLING_PRO_MONTHLY_DOC_LIMIT = '1000';
    process.env.BILLING_FREE_DAILY_PDF_LIMIT = '5';
    process.env.BILLING_PRO_DAILY_PDF_LIMIT = '500';
    process.env.BILLING_WARN_PERCENT = '0.8';

    // モジュールキャッシュをクリアして環境変数を確実に反映
    jest.resetModules();
  });

  afterAll(() => {
    process.env.BILLING_FREE_MONTHLY_DOC_LIMIT =
      savedEnv.BILLING_FREE_MONTHLY_DOC_LIMIT;
    process.env.BILLING_PRO_MONTHLY_DOC_LIMIT =
      savedEnv.BILLING_PRO_MONTHLY_DOC_LIMIT;
    process.env.BILLING_FREE_DAILY_PDF_LIMIT =
      savedEnv.BILLING_FREE_DAILY_PDF_LIMIT;
    process.env.BILLING_PRO_DAILY_PDF_LIMIT =
      savedEnv.BILLING_PRO_DAILY_PDF_LIMIT;
    process.env.BILLING_WARN_PERCENT = savedEnv.BILLING_WARN_PERCENT;
  });

  it('getPeriodKey monthly', async () => {
    const { getPeriodKey } = await import('@/lib/domains/billing/limits');
    const d = new Date('2025-09-01T12:34:56Z');
    expect(getPeriodKey('MONTHLY', d)).toBe('2025-09');
  });

  it('getPeriodKey daily', async () => {
    const { getPeriodKey } = await import('@/lib/domains/billing/limits');
    // 暫定: 正午に寄せてタイムゾーン差による日付ずれの確率を下げる
    const d = new Date('2025-09-02T12:00:00Z');
    expect(getPeriodKey('DAILY', d)).toBe('2025-09-02');
  });

  it('getLimitFor by plan', async () => {
    const { getLimitFor } = await import('@/lib/domains/billing/limits');
    expect(getLimitFor('FREE', 'DOCUMENT_CREATE')).toBe(10);
    expect(getLimitFor('PRO', 'DOCUMENT_CREATE')).toBe(1000);
  });
});
