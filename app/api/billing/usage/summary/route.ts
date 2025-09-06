import { NextResponse } from 'next/server';

import { getUsageSummary } from '@/lib/domains/billing/metering';
import { apiErrors, handleApiError } from '@/lib/shared/forms';
import { requireUserCompany } from '@/lib/shared/utils/auth';

export async function GET() {
  try {
    const { company, error, status } = await requireUserCompany();
    if (error || !company)
      return NextResponse.json(error ?? apiErrors.forbidden(), {
        status: status ?? 403,
      });

    const summary = await getUsageSummary(company.id);
    return NextResponse.json({
      plan: summary.plan,
      monthlyDocuments: summary.monthlyDocuments,
    });
  } catch (error) {
    return handleApiError(error, 'Billing usage summary');
  }
}
