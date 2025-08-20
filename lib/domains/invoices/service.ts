import {
  Prisma,
  InvoiceStatus,
  type InvoiceItem as PrismaInvoiceItem,
} from '@prisma/client';

import { httpError } from '@/lib/shared/forms';
import { prisma } from '@/lib/shared/prisma';
import { ConflictError, NotFoundError } from '@/lib/shared/utils/errors';

import {
  generateInvoiceNumber,
  calculateTax,
  normalizeSortOrder,
  isValidStatusTransition,
  requiresItemsForTransition,
  requiresNumberGenerationForTransition,
} from './utils';

import type { ReorderInvoiceItemsData, BulkInvoiceItemsData } from './schemas';
import type {
  InvoiceWithRelations,
  InvoiceData,
  InvoiceUpdateData,
  InvoiceItemData,
  InvoiceItemUpdateData,
  TaxCalculationResult,
  InvoiceIncludeConfig,
  InvoiceFilterConditions,
  CreateInvoiceFromQuoteData,
  CreateInvoiceFromQuoteResult,
  UpdatePaymentData,
} from './types';

/**
 * 請求書サービス層
 * データベース操作とビジネスロジックを抽象化
 */

/**
 * 請求書を作成
 */
export async function createInvoice(
  companyId: string,
  data: InvoiceData
): Promise<InvoiceWithRelations> {
  // クライアントの存在確認
  const client = await prisma.client.findFirst({
    where: {
      id: data.clientId,
      companyId,
      deletedAt: null,
    },
  });

  if (!client) {
    throw new NotFoundError('指定されたクライアントが見つかりません');
  }

  // 見積書からの作成時は見積書の存在確認
  if (data.quoteId) {
    const quote = await prisma.quote.findFirst({
      where: {
        id: data.quoteId,
        companyId,
        deletedAt: null,
      },
    });

    if (!quote) {
      throw new NotFoundError('指定された見積書が見つかりません');
    }
  }

  // 請求書を作成（DRAFT状態、仮番号を一意に採番）
  const draftNumber = `DRAFT-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const invoice = await prisma.invoice.create({
    data: {
      companyId,
      clientId: data.clientId,
      quoteId: data.quoteId,
      invoiceNumber: draftNumber,
      issueDate: data.issueDate,
      dueDate: data.dueDate,
      notes: data.notes,
      status: 'DRAFT',
    },
    include: {
      client: true,
      items: {
        orderBy: { sortOrder: 'asc' },
      },
      quote: {
        select: {
          id: true,
          quoteNumber: true,
          issueDate: true,
          status: true,
        },
      },
    },
  });

  return invoice as InvoiceWithRelations;
}

/**
 * 見積書から請求書を作成
 */
export async function createInvoiceFromQuote(
  companyId: string,
  quoteId: string,
  data: CreateInvoiceFromQuoteData
): Promise<CreateInvoiceFromQuoteResult> {
  return await prisma.$transaction(async (tx) => {
    // 見積書の存在確認と品目取得
    const quote = await tx.quote.findFirst({
      where: {
        id: quoteId,
        companyId,
        deletedAt: null,
      },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!quote) {
      throw new NotFoundError('指定された見積書が見つかりません');
    }

    if (quote.items.length === 0) {
      throw httpError(400, '見積書に品目が登録されていません');
    }

    // 複製対象品目の決定
    const sourceItems = data.selectedItemIds
      ? quote.items.filter((item) => data.selectedItemIds!.includes(item.id))
      : quote.items;

    if (sourceItems.length === 0) {
      throw httpError(400, '複製する品目が選択されていません');
    }

    // 請求書番号の仮採番
    const draftNumber = `DRAFT-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    // 請求書を作成
    const invoice = await tx.invoice.create({
      data: {
        companyId,
        clientId: quote.clientId,
        quoteId: quote.id,
        invoiceNumber: draftNumber,
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        notes: data.notes,
        status: 'DRAFT',
      },
      include: {
        client: true,
        items: {
          orderBy: { sortOrder: 'asc' },
        },
        quote: {
          select: {
            id: true,
            quoteNumber: true,
            issueDate: true,
            status: true,
          },
        },
      },
    });

    // 品目を複製
    for (let i = 0; i < sourceItems.length; i++) {
      const sourceItem = sourceItems[i];
      await tx.invoiceItem.create({
        data: {
          invoiceId: invoice.id,
          description: sourceItem.description,
          quantity: sourceItem.quantity,
          unitPrice: sourceItem.unitPrice,
          taxCategory: sourceItem.taxCategory,
          taxRate: sourceItem.taxRate,
          discountAmount: sourceItem.discountAmount,
          unit: sourceItem.unit,
          sku: sourceItem.sku,
          sortOrder: i,
        },
      });
    }

    // 最新の請求書情報を取得（品目含む）
    const createdInvoice = await tx.invoice.findUnique({
      where: { id: invoice.id },
      include: {
        client: true,
        items: {
          orderBy: { sortOrder: 'asc' },
        },
        quote: {
          select: {
            id: true,
            quoteNumber: true,
            issueDate: true,
            status: true,
          },
        },
      },
    });

    if (!createdInvoice) {
      throw new NotFoundError('作成した請求書が見つかりません');
    }

    return {
      invoice: createdInvoice as InvoiceWithRelations,
      duplicatedItemsCount: sourceItems.length,
      selectedItemsCount: quote.items.length,
    };
  });
}

/**
 * 請求書を更新
 */
export async function updateInvoice(
  invoiceId: string,
  companyId: string,
  data: InvoiceUpdateData
): Promise<InvoiceWithRelations> {
  // 請求書の存在確認
  const existingInvoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      companyId,
      deletedAt: null,
    },
  });

  if (!existingInvoice) {
    throw new NotFoundError('請求書が見つかりません');
  }

  // クライアントが変更される場合は存在確認
  if (data.clientId && data.clientId !== existingInvoice.clientId) {
    const client = await prisma.client.findFirst({
      where: {
        id: data.clientId,
        companyId,
        deletedAt: null,
      },
    });

    if (!client) {
      throw new NotFoundError('指定されたクライアントが見つかりません');
    }
  }

  // 楽観ロック: updatedAt 一致条件
  const { updatedAt, ...updateData } = data;
  const result = await prisma.invoice.updateMany({
    where: {
      id: invoiceId,
      companyId,
      deletedAt: null,
      updatedAt,
    },
    data: updateData,
  });

  if (result.count === 0) {
    throw new ConflictError(
      '更新競合が発生しました。最新の状態を取得してから再試行してください。'
    );
  }

  const updatedInvoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      client: true,
      items: {
        orderBy: { sortOrder: 'asc' },
      },
      quote: {
        select: {
          id: true,
          quoteNumber: true,
          issueDate: true,
          status: true,
        },
      },
    },
  });

  if (!updatedInvoice) {
    throw new NotFoundError('請求書が見つかりません');
  }

  return updatedInvoice as InvoiceWithRelations;
}

/**
 * 請求書のステータスを更新
 */
export async function updateInvoiceStatus(
  invoiceId: string,
  companyId: string,
  newStatus: InvoiceStatus,
  paymentDate?: Date
): Promise<InvoiceWithRelations> {
  return await prisma.$transaction(async (tx) => {
    // 請求書の存在確認
    const existingInvoice = await tx.invoice.findFirst({
      where: {
        id: invoiceId,
        companyId,
        deletedAt: null,
      },
      include: {
        items: true,
      },
    });

    if (!existingInvoice) {
      throw new NotFoundError('請求書が見つかりません');
    }

    // ステータス遷移の妥当性チェック
    if (!isValidStatusTransition(existingInvoice.status, newStatus)) {
      throw httpError(400, '無効なステータス遷移です');
    }

    // 品目が必要な遷移の場合のチェック
    if (requiresItemsForTransition(existingInvoice.status, newStatus)) {
      if (!existingInvoice.items || existingInvoice.items.length === 0) {
        throw httpError(400, 'ステータス変更には品目の登録が必要です');
      }

      // 品目の妥当性チェック
      for (let i = 0; i < existingInvoice.items.length; i++) {
        const item = existingInvoice.items[i];
        const qty = Number(item.quantity);
        const price = Number(item.unitPrice);
        const discount = Number(item.discountAmount);

        if (qty <= 0) {
          throw new Error(`品目${i + 1}行目: 数量は正の数である必要があります`);
        }
        if (price < 0) {
          throw new Error(`品目${i + 1}行目: 単価は0以上である必要があります`);
        }
        if (discount > price * qty) {
          throw new Error(
            `品目${i + 1}行目: 割引額が品目合計金額を超えています`
          );
        }
      }
    }

    // 支払日が必要な遷移の場合のチェック
    if (newStatus === 'PAID' && !paymentDate) {
      throw httpError(400, '支払済みステータスには支払日が必要です');
    }

    const updateData: {
      status: InvoiceStatus;
      invoiceNumber?: string;
      paymentDate?: Date | null;
    } = {
      status: newStatus,
      paymentDate: newStatus === 'PAID' ? paymentDate || new Date() : null,
    };

    // 番号生成が必要な場合
    if (
      requiresNumberGenerationForTransition(existingInvoice.status, newStatus)
    ) {
      // 会社情報取得とシーケンス更新
      const company = await tx.company.update({
        where: { id: companyId },
        data: {
          invoiceNumberSeq: {
            increment: 1,
          },
        },
      });

      // 請求書番号生成
      const invoiceNumber = generateInvoiceNumber(company.invoiceNumberSeq);
      updateData.invoiceNumber = invoiceNumber;
    }

    // 請求書更新
    const updatedInvoice = await tx.invoice.update({
      where: { id: invoiceId },
      data: updateData,
      include: {
        client: true,
        items: {
          orderBy: { sortOrder: 'asc' },
        },
        quote: {
          select: {
            id: true,
            quoteNumber: true,
            issueDate: true,
            status: true,
          },
        },
      },
    });

    return updatedInvoice as InvoiceWithRelations;
  });
}

/**
 * 支払情報を更新
 */
export async function updatePaymentInfo(
  invoiceId: string,
  companyId: string,
  data: UpdatePaymentData
): Promise<InvoiceWithRelations> {
  // 請求書の存在確認
  const existingInvoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      companyId,
      deletedAt: null,
    },
  });

  if (!existingInvoice) {
    throw new NotFoundError('請求書が見つかりません');
  }

  // ステータス遷移の妥当性チェック
  if (!isValidStatusTransition(existingInvoice.status, data.status)) {
    throw httpError(400, '無効なステータス遷移です');
  }

  // 支払済みステータスには支払日が必要
  if (data.status === 'PAID' && !data.paymentDate) {
    throw httpError(400, '支払済みステータスには支払日が必要です');
  }

  const updatedInvoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: data.status,
      paymentDate: data.paymentDate,
    },
    include: {
      client: true,
      items: {
        orderBy: { sortOrder: 'asc' },
      },
      quote: {
        select: {
          id: true,
          quoteNumber: true,
          issueDate: true,
          status: true,
        },
      },
    },
  });

  return updatedInvoice as InvoiceWithRelations;
}

/**
 * 期限超過請求書の自動ステータス更新
 */
export async function updateOverdueInvoices(
  companyId: string
): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // 時刻を0時に設定

  const result = await prisma.invoice.updateMany({
    where: {
      companyId,
      status: 'SENT',
      dueDate: {
        lt: today,
      },
      paymentDate: null,
      deletedAt: null,
    },
    data: {
      status: 'OVERDUE',
    },
  });

  return result.count;
}

/**
 * 請求書を削除（論理削除）
 */
export async function deleteInvoice(
  invoiceId: string,
  companyId: string
): Promise<void> {
  const existingInvoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      companyId,
      deletedAt: null,
    },
  });

  if (!existingInvoice) {
    throw new NotFoundError('請求書が見つかりません');
  }

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { deletedAt: new Date() },
  });
}

/**
 * 請求書一覧を取得
 */
export async function getInvoices(
  companyId: string,
  where: InvoiceFilterConditions,
  orderBy: Prisma.InvoiceOrderByWithRelationInput,
  include: InvoiceIncludeConfig,
  pagination: { skip: number; take: number }
): Promise<{ invoices: InvoiceWithRelations[]; total: number }> {
  const secureWhere = {
    ...where,
    companyId,
    deletedAt: null,
  };

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where: secureWhere,
      orderBy,
      include,
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.invoice.count({ where: secureWhere }),
  ]);

  return { invoices: invoices as InvoiceWithRelations[], total };
}

/**
 * 請求書を取得
 */
export async function getInvoice(
  invoiceId: string,
  companyId: string,
  include: InvoiceIncludeConfig = {}
): Promise<InvoiceWithRelations | null> {
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      companyId,
      deletedAt: null,
    },
    include,
  });

  return invoice as InvoiceWithRelations | null;
}

/**
 * 品目を作成
 */
export async function createInvoiceItem(
  invoiceId: string,
  companyId: string,
  data: InvoiceItemData
): Promise<PrismaInvoiceItem> {
  // 請求書の存在確認
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      companyId,
      deletedAt: null,
    },
  });

  if (!invoice) {
    throw new NotFoundError('請求書が見つかりません');
  }

  // 並び順の自動決定（未指定または0のとき）
  let sortOrder = data.sortOrder;
  if (sortOrder === undefined || sortOrder === 0) {
    const next = await getNextSortOrder(invoiceId);
    sortOrder = next;
  }

  const item = await prisma.invoiceItem.create({
    data: {
      invoiceId,
      ...data,
      sortOrder,
    },
  });

  return item as PrismaInvoiceItem;
}

/**
 * 品目を更新
 */
export async function updateInvoiceItem(
  itemId: string,
  invoiceId: string,
  companyId: string,
  data: InvoiceItemUpdateData
): Promise<PrismaInvoiceItem> {
  // 品目の存在確認
  const existingItem = await prisma.invoiceItem.findFirst({
    where: {
      id: itemId,
      invoice: {
        id: invoiceId,
        companyId,
        deletedAt: null,
      },
    },
  });

  if (!existingItem) {
    throw new NotFoundError('品目が見つかりません');
  }

  // 既存値を考慮した整合性チェック（数量・単価・割引の合計超過防止）
  {
    const effectiveQuantity =
      data.quantity !== undefined
        ? Number(data.quantity)
        : Number(existingItem.quantity);
    const effectiveUnitPrice =
      data.unitPrice !== undefined
        ? Number(data.unitPrice)
        : Number(existingItem.unitPrice);
    const effectiveDiscount =
      data.discountAmount !== undefined
        ? Number(data.discountAmount)
        : Number(existingItem.discountAmount);

    if (effectiveQuantity <= 0) {
      throw httpError(400, '数量は正の数である必要があります');
    }
    if (effectiveUnitPrice < 0) {
      throw httpError(400, '単価は0以上である必要があります');
    }
    if (effectiveDiscount < 0) {
      throw httpError(400, '割引額は0以上である必要があります');
    }
    if (effectiveDiscount > effectiveUnitPrice * effectiveQuantity) {
      throw httpError(400, '割引額は品目合計金額を超えることはできません');
    }
  }

  // 楽観ロック: updatedAt 一致条件
  const { updatedAt, ...updateData } = data;
  const result = await prisma.invoiceItem.updateMany({
    where: {
      id: itemId,
      invoiceId,
      invoice: { companyId, deletedAt: null },
      updatedAt,
    },
    data: updateData,
  });
  if (result.count === 0) {
    throw new ConflictError(
      '更新競合が発生しました。最新の状態を取得してから再試行してください。'
    );
  }
  const item = await prisma.invoiceItem.findUnique({ where: { id: itemId } });
  if (!item) throw new NotFoundError('品目が見つかりません');

  return item as PrismaInvoiceItem;
}

/**
 * 品目を削除
 */
export async function deleteInvoiceItem(
  itemId: string,
  invoiceId: string,
  companyId: string
): Promise<void> {
  const existingItem = await prisma.invoiceItem.findFirst({
    where: {
      id: itemId,
      invoice: {
        id: invoiceId,
        companyId,
        deletedAt: null,
      },
    },
  });

  if (!existingItem) {
    throw new NotFoundError('品目が見つかりません');
  }

  const deleteResult = await prisma.invoiceItem.deleteMany({
    where: {
      id: itemId,
      invoice: {
        id: invoiceId,
        companyId,
        deletedAt: null,
      },
    },
  });

  if (deleteResult.count === 0) {
    throw new NotFoundError('品目が見つかりません');
  }
}

/**
 * 品目一覧を取得
 */
export async function getInvoiceItems(
  invoiceId: string,
  companyId: string
): Promise<PrismaInvoiceItem[]> {
  const items = await prisma.invoiceItem.findMany({
    where: {
      invoice: {
        id: invoiceId,
        companyId,
        deletedAt: null,
      },
    },
    orderBy: { sortOrder: 'asc' },
  });

  return items as PrismaInvoiceItem[];
}

/**
 * 品目を取得
 */
export async function getInvoiceItem(
  itemId: string,
  invoiceId: string,
  companyId: string
): Promise<PrismaInvoiceItem | null> {
  const item = await prisma.invoiceItem.findFirst({
    where: {
      id: itemId,
      invoice: {
        id: invoiceId,
        companyId,
        deletedAt: null,
      },
    },
  });

  return item as PrismaInvoiceItem | null;
}

/**
 * 品目の並び順を一括更新
 */
export async function reorderInvoiceItems(
  invoiceId: string,
  companyId: string,
  data: ReorderInvoiceItemsData
): Promise<PrismaInvoiceItem[]> {
  return await prisma.$transaction(async (tx) => {
    // 請求書の存在確認
    const invoice = await tx.invoice.findFirst({
      where: {
        id: invoiceId,
        companyId,
        deletedAt: null,
      },
    });

    if (!invoice) {
      throw new NotFoundError('請求書が見つかりません');
    }

    // 並び順を正規化
    const normalizedItems = normalizeSortOrder(data.items);

    // 一括更新（楽観ロック対応）
    const updateResults: { itemId: string; success: boolean }[] = [];

    for (const item of normalizedItems) {
      const originalItem = data.items.find((i) => i.id === item.id);
      if (!originalItem) {
        throw new Error(`品目ID ${item.id} の元データが見つかりません`);
      }

      const result = await tx.invoiceItem.updateMany({
        where: {
          id: item.id,
          invoiceId,
          invoice: { companyId, deletedAt: null },
          updatedAt: originalItem.updatedAt,
        },
        data: {
          sortOrder: item.sortOrder,
        },
      });

      updateResults.push({
        itemId: item.id,
        success: result.count > 0,
      });
    }

    // 失敗した更新があるかチェック
    const failedUpdates = updateResults.filter((r) => !r.success);
    if (failedUpdates.length > 0) {
      throw new ConflictError(
        `並び順更新で競合が発生しました。対象品目ID: ${failedUpdates
          .map((f) => f.itemId)
          .join(', ')}。最新の状態を取得してから再試行してください。`
      );
    }

    // 更新後の品目一覧を取得
    const updatedItems = await tx.invoiceItem.findMany({
      where: {
        invoice: {
          id: invoiceId,
          companyId,
          deletedAt: null,
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return updatedItems as PrismaInvoiceItem[];
  });
}

/**
 * 税計算を実行
 */
export async function calculateInvoiceTax(
  invoiceId: string,
  companyId: string
): Promise<TaxCalculationResult> {
  // 請求書と会社情報を取得
  const [invoice, company] = await Promise.all([
    prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        companyId,
        deletedAt: null,
      },
      include: {
        items: true,
      },
    }),
    prisma.company.findUnique({
      where: { id: companyId },
      select: {
        standardTaxRate: true,
        reducedTaxRate: true,
        priceIncludesTax: true,
      },
    }),
  ]);

  if (!invoice) {
    throw new NotFoundError('請求書が見つかりません');
  }

  if (!company) {
    throw new NotFoundError('会社情報が見つかりません');
  }

  return calculateTax(
    invoice.items.map((item) => ({
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      discountAmount: Number(item.discountAmount),
      taxRate: item.taxRate ? Number(item.taxRate) : null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })),
    {
      ...company,
      standardTaxRate: Number(company.standardTaxRate),
      reducedTaxRate: Number(company.reducedTaxRate),
    }
  );
}

/**
 * 次の並び順を取得
 */
async function getNextSortOrder(invoiceId: string): Promise<number> {
  const lastItem = await prisma.invoiceItem.findFirst({
    where: { invoiceId },
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  });

  return (lastItem?.sortOrder ?? -1) + 1;
}

/**
 * 請求書品目一括処理（作成・更新・削除・並び替え）
 */
export async function bulkProcessInvoiceItems(
  invoiceId: string,
  companyId: string,
  bulkData: BulkInvoiceItemsData
): Promise<PrismaInvoiceItem[]> {
  return await prisma.$transaction(async (tx) => {
    // 請求書の存在確認
    const invoice = await tx.invoice.findFirst({
      where: {
        id: invoiceId,
        companyId,
        deletedAt: null,
      },
    });

    if (!invoice) {
      throw new NotFoundError('請求書が見つかりません');
    }

    const results: PrismaInvoiceItem[] = [];
    // 新規作成品目の既存最大 sortOrder を起点に採番（安定した順序のため）
    const last = await tx.invoiceItem.findFirst({
      where: { invoiceId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    let nextSortOrder = (last?.sortOrder ?? -1) + 1;

    for (const item of bulkData.items) {
      switch (item.action) {
        case 'create': {
          // 入力値の整合性チェック（サーバー側の最終防衛線）
          const qty = Number(item.data.quantity);
          const unitPrice = Number(item.data.unitPrice);
          const discount = Number(item.data.discountAmount ?? 0);
          if (qty <= 0)
            throw httpError(400, '数量は正の数である必要があります');
          if (unitPrice < 0)
            throw httpError(400, '単価は0以上である必要があります');
          if (discount < 0)
            throw httpError(400, '割引額は0以上である必要があります');
          if (discount > unitPrice * qty) {
            throw httpError(
              400,
              '割引額は品目合計金額を超えることはできません'
            );
          }

          const createdItem = await tx.invoiceItem.create({
            data: {
              invoiceId,
              ...item.data,
              // 指定がなければ末尾に連番で付与（複数 create の順序が安定）
              sortOrder: item.data.sortOrder ?? nextSortOrder++,
            },
          });
          results.push(createdItem as PrismaInvoiceItem);
          break;
        }

        case 'update': {
          // 楽観ロック: updatedAt 一致条件
          const { updatedAt, ...updateData } = item.data;

          // 既存値を取得して整合性検証
          const existing = await tx.invoiceItem.findFirst({
            where: {
              id: item.id,
              invoiceId,
              invoice: { companyId, deletedAt: null },
            },
          });
          if (!existing) {
            throw new NotFoundError('品目が見つかりません');
          }

          const effectiveQuantity =
            updateData.quantity !== undefined
              ? Number(updateData.quantity)
              : Number(existing.quantity);
          const effectiveUnitPrice =
            updateData.unitPrice !== undefined
              ? Number(updateData.unitPrice)
              : Number(existing.unitPrice);
          const effectiveDiscount =
            updateData.discountAmount !== undefined
              ? Number(updateData.discountAmount)
              : Number(existing.discountAmount);

          if (effectiveQuantity <= 0) {
            throw httpError(400, '数量は正の数である必要があります');
          }
          if (effectiveUnitPrice < 0) {
            throw httpError(400, '単価は0以上である必要があります');
          }
          if (effectiveDiscount < 0) {
            throw httpError(400, '割引額は0以上である必要があります');
          }
          if (effectiveDiscount > effectiveUnitPrice * effectiveQuantity) {
            throw httpError(
              400,
              '割引額は品目合計金額を超えることはできません'
            );
          }

          const result = await tx.invoiceItem.updateMany({
            where: {
              id: item.id,
              invoiceId,
              invoice: { companyId, deletedAt: null },
              updatedAt,
            },
            data: updateData,
          });
          if (result.count === 0) {
            throw new Error(
              '更新競合が発生しました。最新の状態を取得してから再試行してください。'
            );
          }
          const updatedItem = await tx.invoiceItem.findUnique({
            where: { id: item.id },
          });
          results.push(updatedItem as PrismaInvoiceItem);
          break;
        }

        case 'delete': {
          const deleteResult = await tx.invoiceItem.deleteMany({
            where: {
              id: item.id,
              invoice: {
                id: invoiceId,
                companyId,
                deletedAt: null,
              },
            },
          });

          if (deleteResult.count === 0) {
            throw new NotFoundError(
              `削除対象品目が見つかりません (ID: ${item.id})`
            );
          }
          break;
        }
      }
    }

    // ソート順を正規化
    const allItems = await tx.invoiceItem.findMany({
      where: { invoiceId },
      orderBy: { sortOrder: 'asc' },
    });

    const currentMap = new Map(allItems.map((it) => [it.id, it.sortOrder]));
    const normalizedItems = normalizeSortOrder(
      allItems.map((item) => ({ id: item.id, sortOrder: item.sortOrder }))
    );
    for (const item of normalizedItems) {
      const prev = currentMap.get(item.id);
      if (prev !== item.sortOrder) {
        const updateResult = await tx.invoiceItem.updateMany({
          where: {
            id: item.id,
            invoice: {
              id: invoiceId,
              companyId,
              deletedAt: null,
            },
          },
          data: { sortOrder: item.sortOrder },
        });

        if (updateResult.count === 0) {
          throw new NotFoundError(
            `ソート順更新対象品目が見つかりません (ID: ${item.id})`
          );
        }
      }
    }

    return results;
  });
}

/**
 * 請求書品目を完全置換（既存全削除→新規一括作成）
 */
export async function replaceAllInvoiceItems(
  invoiceId: string,
  companyId: string,
  newItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    taxCategory: 'STANDARD' | 'REDUCED' | 'EXEMPT' | 'NON_TAX';
    taxRate?: number;
    discountAmount?: number;
    unit?: string;
    sku?: string;
    sortOrder?: number;
  }>
): Promise<PrismaInvoiceItem[]> {
  return await prisma.$transaction(async (tx) => {
    // 請求書の存在確認
    const invoice = await tx.invoice.findFirst({
      where: {
        id: invoiceId,
        companyId,
        deletedAt: null,
      },
    });

    if (!invoice) {
      throw new NotFoundError('請求書が見つかりません');
    }

    // 既存品目を全削除
    await tx.invoiceItem.deleteMany({
      where: { invoiceId },
    });

    // 新規品目を一括作成
    if (newItems.length === 0) {
      return [];
    }

    const results: PrismaInvoiceItem[] = [];
    let sortOrder = 0;

    for (const itemData of newItems) {
      // 入力値の整合性チェック（サーバー側の最終防衛線）
      const qty = Number(itemData.quantity);
      const unitPrice = Number(itemData.unitPrice);
      const discount = Number(itemData.discountAmount ?? 0);
      if (qty <= 0) throw httpError(400, '数量は正の数である必要があります');
      if (unitPrice < 0)
        throw httpError(400, '単価は0以上である必要があります');
      if (discount < 0)
        throw httpError(400, '割引額は0以上である必要があります');
      if (discount > unitPrice * qty) {
        throw httpError(400, '割引額は品目合計金額を超えることはできません');
      }

      const createdItem = await tx.invoiceItem.create({
        data: {
          invoiceId,
          ...itemData,
          sortOrder: itemData.sortOrder ?? sortOrder++,
        },
      });
      results.push(createdItem as PrismaInvoiceItem);
    }

    return results;
  });
}
