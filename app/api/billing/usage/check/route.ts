import { NextRequest, NextResponse } from 'next/server';

import { peekUsage } from '@/lib/domains/billing/metering';
import type { Metric } from '@/lib/domains/billing/types';
import { apiErrors, handleApiError } from '@/lib/shared/forms';
import { requireUserCompany } from '@/lib/shared/utils/auth';

function parseAction(action: string | null): Metric | null {
  if (action === 'document_create') return 'DOCUMENT_CREATE';
  return null; // PDFメトリクスは廃止
}

export async function GET(request: NextRequest) {
  try {
    const { company, error, status } = await requireUserCompany();
    if (error || !company)
      return NextResponse.json(error ?? apiErrors.forbidden(), {
        status: status ?? 403,
      });

    const { searchParams } = new URL(request.url);
    const action = parseAction(searchParams.get('action'));
    if (!action) {
      return NextResponse.json(apiErrors.badRequest('Invalid action'), {
        status: 400,
      });
    }
    const result = await peekUsage(company.id, action);
    const headers: Record<string, string> = {};
    if (result.warn && result.usage) {
      headers['X-Usage-Warn'] = 'true';
      headers['X-Usage-Remaining'] = String(result.usage.remaining);
    }
    return NextResponse.json(result, { headers });
  } catch (error) {
    return handleApiError(error, 'Billing usage check');
  }
}
