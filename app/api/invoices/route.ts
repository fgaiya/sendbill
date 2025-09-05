import { NextRequest, NextResponse } from 'next/server';

import { logUsage } from '@/lib/domains/billing/logger';
import { checkAndConsume } from '@/lib/domains/billing/metering';
import {
  invoiceSchemas,
  paginationSchema,
  invoiceSearchSchema,
} from '@/lib/domains/invoices/schemas';
import {
  createInvoice,
  getInvoices,
  updateOverdueInvoices,
} from '@/lib/domains/invoices/service';
import { convertPrismaInvoiceToInvoice } from '@/lib/domains/invoices/types';
import {
  buildInvoiceSearchWhere,
  buildOrderBy,
  buildIncludeRelations,
} from '@/lib/domains/invoices/utils';
import { PAGINATION } from '@/lib/shared/constants';
import { apiErrors, handleApiError } from '@/lib/shared/forms';
import { requireUserCompany } from '@/lib/shared/utils/auth';

/**
 * 請求書作成API
 */
export async function POST(request: NextRequest) {
  try {
    const { company, error, status } = await requireUserCompany();
    if (error) {
      return NextResponse.json(error, { status });
    }

    const body = await request.json();
    const validatedData = invoiceSchemas.create.parse(body);

    // 使用量ガード: 請求書（帳票）作成 = 月次カウント（検証後に実行）
    const guard = await checkAndConsume(company.id, 'DOCUMENT_CREATE', 1);
    if (!guard.allowed) {
      const plan: 'FREE' | 'PRO' = company.plan === 'PRO' ? 'PRO' : 'FREE';
      logUsage(company.id, 'DOCUMENT_CREATE', plan, guard, 'block');
      const errHeaders: Record<string, string> = {};
      if (guard.usage) {
        errHeaders['X-Usage-Used'] = String(guard.usage.used);
        errHeaders['X-Usage-Remaining'] = String(guard.usage.remaining);
        errHeaders['X-Usage-Limit'] = String(guard.usage.limit);
        if (guard.warn) errHeaders['X-Usage-Warn'] = 'true';
      }
      return NextResponse.json(
        {
          error: 'usage_limit_exceeded',
          code: guard.blockedReason,
          usage: guard.usage,
          upgradeUrl: '/api/billing/checkout',
        },
        { status: 402, headers: errHeaders }
      );
    }

    const invoice = await createInvoice(company.id, validatedData);
    const publicInvoice = convertPrismaInvoiceToInvoice(invoice);

    const headers: Record<string, string> = {};
    if (guard.usage) {
      headers['X-Usage-Used'] = String(guard.usage.used);
      headers['X-Usage-Remaining'] = String(guard.usage.remaining);
      headers['X-Usage-Limit'] = String(guard.usage.limit);
      if (guard.warn) headers['X-Usage-Warn'] = 'true';
    }
    {
      const plan: 'FREE' | 'PRO' = company.plan === 'PRO' ? 'PRO' : 'FREE';
      logUsage(company.id, 'DOCUMENT_CREATE', plan, guard, 'consume');
    }

    return NextResponse.json(
      {
        data: publicInvoice,
        message: '請求書を作成しました',
      },
      {
        status: 201,
        headers: { Location: `/api/invoices/${publicInvoice.id}`, ...headers },
      }
    );
  } catch (error) {
    return handleApiError(error, 'Invoice creation');
  }
}

/**
 * 請求書一覧取得API
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

    // パラメータのバリデーション
    const paginationResult = paginationSchema.safeParse({
      page: getParam('page'),
      limit: getParam('limit'),
    });

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

    if (!paginationResult.success || !searchResult.success) {
      return NextResponse.json(
        apiErrors.validation([
          ...(paginationResult.error?.issues || []),
          ...(searchResult.error?.issues || []),
        ]),
        { status: 400 }
      );
    }

    const { page, limit } = paginationResult.data;
    const take = Math.min(limit, PAGINATION.MAX_LIMIT);
    const skip = Math.max(0, (page - 1) * take);
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

    // データ取得とカウント（並列実行）
    const { invoices, total } = await getInvoices(
      company.id,
      where,
      orderBy,
      includeRelations,
      {
        skip,
        take,
      }
    );

    const totalPages = take > 0 ? Math.ceil(total / take) : 0;

    return NextResponse.json({
      data: invoices.map(convertPrismaInvoiceToInvoice),
      pagination: {
        total,
        page,
        limit: take, // 実際に使用されたlimit値
        totalPages,
      },
    });
  } catch (error) {
    return handleApiError(error, 'Invoices fetch');
  }
}
