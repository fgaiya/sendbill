import { NextRequest, NextResponse } from 'next/server';

import { invoiceSearchSchema } from '@/lib/domains/invoices/schemas';
import {
  getInvoices,
  updateOverdueInvoices,
} from '@/lib/domains/invoices/service';
import { convertPrismaInvoiceToInvoice } from '@/lib/domains/invoices/types';
import {
  buildInvoiceSearchWhere,
  buildOrderBy,
  buildIncludeRelations,
} from '@/lib/domains/invoices/utils';
import { apiErrors, handleApiError } from '@/lib/shared/forms';
import { requireUserCompany } from '@/lib/shared/utils/auth';

/**
 * 請求書検索API
 * クエリパラメータに基づく柔軟な検索機能を提供
 */
export async function GET(request: NextRequest) {
  try {
    const { company, error, status } = await requireUserCompany();
    if (error) {
      return NextResponse.json(error, { status });
    }

    // 期限超過請求書の自動ステータス更新
    await updateOverdueInvoices(company.id);

    const { searchParams } = new URL(request.url);

    // パラメータの解析（nullを適切に処理）
    const getParam = (key: string) => {
      const value = searchParams.get(key);
      return value === null || value.trim() === '' ? undefined : value;
    };

    // 検索パラメータのバリデーション
    const searchResult = invoiceSearchSchema.safeParse({
      q: getParam('q'),
      status: getParam('status'),
      clientId: getParam('clientId'),
      quoteId: getParam('quoteId'),
      dateFrom: getParam('dateFrom'),
      dateTo: getParam('dateTo'),
      dueDateFrom: getParam('dueDateFrom'),
      dueDateTo: getParam('dueDateTo'),
      sort: getParam('sort'),
      include: getParam('include'),
    });

    if (!searchResult.success) {
      return NextResponse.json(
        apiErrors.validation(searchResult.error.issues),
        { status: 400 }
      );
    }

    const {
      q,
      status: invoiceStatus,
      clientId,
      quoteId,
      dateFrom,
      dateTo,
      dueDateFrom,
      dueDateTo,
      sort,
      include,
    } = searchResult.data;

    // 検索条件とソート条件、関連データ取得設定の構築
    const where = buildInvoiceSearchWhere(company.id, {
      query: q,
      status: invoiceStatus,
      clientId,
      quoteId,
      dateFrom,
      dateTo,
      dueDateFrom,
      dueDateTo,
    });
    const orderBy = buildOrderBy(sort);
    const includeRelations = buildIncludeRelations(include);

    // limitパラメータの処理（検索APIではページネーションなしまたは制限付き）
    const limitParam = getParam('limit');
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 100) : 50; // デフォルト50件、最大100件

    // データ取得
    const { invoices, total } = await getInvoices(
      company.id,
      where,
      orderBy,
      includeRelations,
      {
        skip: 0,
        take: limit,
      }
    );

    return NextResponse.json({
      data: invoices.map(convertPrismaInvoiceToInvoice),
      total,
      limit,
      hasMore: total > limit,
    });
  } catch (error) {
    return handleApiError(error, 'Invoice search');
  }
}
