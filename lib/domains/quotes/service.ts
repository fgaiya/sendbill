import {
  Prisma,
  QuoteStatus,
  type QuoteItem as PrismaQuoteItem,
  TaxCategory,
} from '@prisma/client/edge';

import { httpError } from '@/lib/shared/forms';
import { getPrisma } from '@/lib/shared/prisma';
import { ConflictError, NotFoundError } from '@/lib/shared/utils/errors';

import {
  generateQuoteNumber,
  calculateTax,
  normalizeSortOrder,
  parseCSVData,
  isValidStatusTransition,
  requiresItemsForTransition,
  requiresNumberGenerationForTransition,
  STATUS_TRANSITION_RULES,
} from './utils';

import type { ReorderQuoteItemsData } from './schemas';
import type {
  QuoteWithRelations,
  QuoteData,
  QuoteUpdateData,
  QuoteItemData,
  QuoteItemUpdateData,
  BulkQuoteItemsData,
  TaxCalculationResult,
  QuoteIncludeConfig,
  QuoteFilterConditions,
  CsvImportResult,
} from './types';

/**
 * 見積書サービス層
 * データベース操作とビジネスロジックを抽象化
 */

/**
 * 見積書を作成
 */
export async function createQuote(
  companyId: string,
  data: QuoteData
): Promise<QuoteWithRelations> {
  // クライアントの存在確認
  const client = await getPrisma().client.findFirst({
    where: {
      id: data.clientId,
      companyId,
      deletedAt: null,
    },
  });

  if (!client) {
    throw new NotFoundError('指定されたクライアントが見つかりません');
  }

  // 見積書を作成（DRAFT状態、仮番号を一意に採番）
  const draftNumber = `DRAFT-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const quote = await getPrisma().quote.create({
    data: {
      companyId,
      clientId: data.clientId,
      quoteNumber: draftNumber,
      issueDate: data.issueDate,
      expiryDate: data.expiryDate,
      notes: data.notes,
      status: 'DRAFT',
    },
    include: {
      client: true,
      items: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  return quote as QuoteWithRelations;
}

/**
 * 見積書を更新
 */
export async function updateQuote(
  quoteId: string,
  companyId: string,
  data: QuoteUpdateData
): Promise<QuoteWithRelations> {
  // 見積書の存在確認
  const existingQuote = await getPrisma().quote.findFirst({
    where: {
      id: quoteId,
      companyId,
      deletedAt: null,
    },
  });

  if (!existingQuote) {
    throw new NotFoundError('見積書が見つかりません');
  }

  // クライアントIDが変更される場合は存在確認
  if (data.clientId && data.clientId !== existingQuote.clientId) {
    const client = await getPrisma().client.findFirst({
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
  const result = await getPrisma().quote.updateMany({
    where: { id: quoteId, companyId, deletedAt: null, updatedAt },
    data: updateData,
  });
  if (result.count === 0) {
    throw new ConflictError(
      '更新競合が発生しました。最新の状態を取得してから再試行してください。'
    );
  }

  const quote = await getPrisma().quote.findFirst({
    where: { id: quoteId, companyId },
    include: {
      client: true,
      items: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });
  if (!quote) throw new NotFoundError('見積書が見つかりません');

  return quote as QuoteWithRelations;
}

/**
 * 見積書ステータスを更新（番号採番処理を含む）
 */
export async function updateQuoteStatus(
  quoteId: string,
  companyId: string,
  newStatus: QuoteStatus
): Promise<QuoteWithRelations> {
  return await getPrisma().$transaction(async (tx) => {
    // 見積書の存在確認
    const existingQuote = await tx.quote.findFirst({
      where: {
        id: quoteId,
        companyId,
        deletedAt: null,
      },
      include: {
        items: true,
      },
    });

    if (!existingQuote) {
      throw new NotFoundError('見積書が見つかりません');
    }

    // ステータス遷移の妥当性チェック
    if (!isValidStatusTransition(existingQuote.status, newStatus)) {
      const validTransitions =
        STATUS_TRANSITION_RULES.find(
          (r) => r.from === existingQuote.status
        )?.to.join('、') ?? 'なし';
      throw new Error(
        `${existingQuote.status}から${newStatus}への遷移は無効です。有効な遷移先: ${validTransitions}`
      );
    }

    // 品目チェック
    if (requiresItemsForTransition(existingQuote.status, newStatus)) {
      if (!existingQuote.items || existingQuote.items.length === 0) {
        throw new Error('品目が登録されていません');
      }

      // 品目の妥当性チェック
      for (let i = 0; i < existingQuote.items.length; i++) {
        const item = existingQuote.items[i];
        const qty = Number(item.quantity);
        const price = Number(item.unitPrice);
        const discount = Number(item.discountAmount);

        if (qty <= 0) {
          throw new Error(`品目${i + 1}行目: 数量は正の値である必要があります`);
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

    const updateData: { status: QuoteStatus; quoteNumber?: string } = {
      status: newStatus,
    };

    // 番号生成が必要な場合
    if (
      requiresNumberGenerationForTransition(existingQuote.status, newStatus)
    ) {
      // 会社情報取得とシーケンス更新
      const company = await tx.company.update({
        where: { id: companyId },
        data: {
          quoteNumberSeq: {
            increment: 1,
          },
        },
      });

      // 見積書番号生成
      const quoteNumber = generateQuoteNumber(company.quoteNumberSeq);
      updateData.quoteNumber = quoteNumber;
    }

    // 見積書更新
    const updatedQuote = await tx.quote.update({
      where: { id: quoteId },
      data: updateData,
      include: {
        client: true,
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return updatedQuote as QuoteWithRelations;
  });
}

/**
 * 見積書を削除（論理削除）
 */
export async function deleteQuote(
  quoteId: string,
  companyId: string
): Promise<void> {
  const existingQuote = await getPrisma().quote.findFirst({
    where: {
      id: quoteId,
      companyId,
      deletedAt: null,
    },
  });

  if (!existingQuote) {
    throw new NotFoundError('見積書が見つかりません');
  }

  await getPrisma().quote.update({
    where: { id: quoteId },
    data: { deletedAt: new Date() },
  });
}

/**
 * 見積書一覧を取得
 */
export async function getQuotes(
  companyId: string,
  where: QuoteFilterConditions,
  orderBy: Prisma.QuoteOrderByWithRelationInput,
  include: QuoteIncludeConfig,
  pagination: { skip: number; take: number }
): Promise<{ quotes: QuoteWithRelations[]; total: number }> {
  const [quotes, total] = await Promise.all([
    getPrisma().quote.findMany({
      where,
      orderBy,
      include,
      skip: pagination.skip,
      take: pagination.take,
    }),
    getPrisma().quote.count({ where }),
  ]);

  return { quotes: quotes as QuoteWithRelations[], total };
}

/**
 * 見積書を取得
 */
export async function getQuote(
  quoteId: string,
  companyId: string,
  include: QuoteIncludeConfig = {}
): Promise<QuoteWithRelations | null> {
  const quote = await getPrisma().quote.findFirst({
    where: {
      id: quoteId,
      companyId,
      deletedAt: null,
    },
    include,
  });

  return quote as QuoteWithRelations | null;
}

/**
 * 見積書を複製
 * - タイトル相当のフィールドはモデルに存在しないため、notesはそのまま複製
 * - 発行日は本日、ステータスは常にDRAFT、番号は仮番号（DRAFT-xxxxx）
 * - 品目は新規IDで全件複製し並び順を維持
 */
export async function duplicateQuote(
  companyId: string,
  sourceQuoteId: string
): Promise<QuoteWithRelations> {
  return await getPrisma().$transaction(async (tx) => {
    // 元の見積書取得（会社所属チェック含む）
    const source = await tx.quote.findFirst({
      where: { id: sourceQuoteId, companyId, deletedAt: null },
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!source) {
      throw new NotFoundError('見積書が見つかりません');
    }

    // 仮番号生成
    const draftNumber = `DRAFT-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    // 新しい見積書作成
    const today = new Date();
    const created = await tx.quote.create({
      data: {
        companyId,
        clientId: source.clientId,
        quoteNumber: draftNumber,
        issueDate: today,
        // 複製時の有効期限は明示要件がないため保持（そのまま）
        expiryDate: source.expiryDate ?? undefined,
        notes: source.notes ?? undefined,
        status: 'DRAFT',
      },
    });

    // 品目複製（新IDで作成、sortOrder維持）
    for (const item of source.items ?? []) {
      await tx.quoteItem.create({
        data: {
          quoteId: created.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxCategory: item.taxCategory,
          taxRate: item.taxRate ?? undefined,
          discountAmount: item.discountAmount,
          unit: item.unit ?? undefined,
          sku: item.sku ?? undefined,
          sortOrder: item.sortOrder,
        },
      });
    }

    // 作成後の完全データを返却
    const duplicated = await tx.quote.findUnique({
      where: { id: created.id },
      include: {
        client: true,
        items: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!duplicated) throw new NotFoundError('複製後の見積書が見つかりません');
    return duplicated as QuoteWithRelations;
  });
}

/**
 * 品目を作成
 */
export async function createQuoteItem(
  quoteId: string,
  companyId: string,
  data: QuoteItemData
): Promise<PrismaQuoteItem> {
  // 見積書の存在確認
  const quote = await getPrisma().quote.findFirst({
    where: {
      id: quoteId,
      companyId,
      deletedAt: null,
    },
  });

  if (!quote) {
    throw new NotFoundError('見積書が見つかりません');
  }

  // 並び順の自動決定（未指定または0のとき）
  let sortOrder = data.sortOrder;
  if (sortOrder === undefined || sortOrder === 0) {
    const next = await getNextSortOrder(quoteId);
    sortOrder = next;
  }

  const item = await getPrisma().quoteItem.create({
    data: {
      quoteId,
      ...data,
      sortOrder,
    },
  });

  return item as PrismaQuoteItem;
}

/**
 * 品目を更新
 */
export async function updateQuoteItem(
  itemId: string,
  quoteId: string,
  companyId: string,
  data: QuoteItemUpdateData
): Promise<PrismaQuoteItem> {
  // 品目の存在確認
  const existingItem = await getPrisma().quoteItem.findFirst({
    where: {
      id: itemId,
      quote: {
        id: quoteId,
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
  const result = await getPrisma().quoteItem.updateMany({
    where: {
      id: itemId,
      quoteId,
      quote: { companyId, deletedAt: null },
      updatedAt,
    },
    data: updateData,
  });
  if (result.count === 0) {
    throw new ConflictError(
      '更新競合が発生しました。最新の状態を取得してから再試行してください。'
    );
  }
  const item = await getPrisma().quoteItem.findUnique({
    where: { id: itemId },
  });
  if (!item) throw new NotFoundError('品目が見つかりません');

  return item as PrismaQuoteItem;
}

/**
 * 品目を削除
 */
export async function deleteQuoteItem(
  itemId: string,
  quoteId: string,
  companyId: string
): Promise<void> {
  const existingItem = await getPrisma().quoteItem.findFirst({
    where: {
      id: itemId,
      quote: {
        id: quoteId,
        companyId,
        deletedAt: null,
      },
    },
  });

  if (!existingItem) {
    throw new NotFoundError('品目が見つかりません');
  }

  await getPrisma().quoteItem.delete({
    where: { id: itemId },
  });
}

/**
 * 品目の並び順を一括更新（部分更新）
 * 更新件数が期待値に満たない場合は競合としてエラー
 */
export async function reorderQuoteItems(
  quoteId: string,
  companyId: string,
  data: ReorderQuoteItemsData
): Promise<PrismaQuoteItem[]> {
  return await getPrisma().$transaction(async (tx) => {
    // 見積書の存在確認
    const quote = await tx.quote.findFirst({
      where: { id: quoteId, companyId, deletedAt: null },
    });
    if (!quote) {
      throw new NotFoundError('見積書が見つかりません');
    }

    let updatedCount = 0;
    for (const { id, sortOrder, updatedAt } of data.items) {
      const result = await tx.quoteItem.updateMany({
        where: {
          id,
          quoteId,
          quote: { companyId, deletedAt: null },
          updatedAt,
        },
        data: { sortOrder },
      });
      updatedCount += result.count;
    }

    if (updatedCount !== data.items.length) {
      throw new ConflictError(
        '更新競合が発生しました。最新の状態を取得してから再試行してください。'
      );
    }

    const items = await tx.quoteItem.findMany({
      where: { quoteId },
      orderBy: { sortOrder: 'asc' },
    });
    return items as PrismaQuoteItem[];
  });
}

/**
 * 品目一覧を取得
 */
export async function getQuoteItems(
  quoteId: string,
  companyId: string
): Promise<PrismaQuoteItem[]> {
  // 見積書の存在確認
  const quote = await getPrisma().quote.findFirst({
    where: {
      id: quoteId,
      companyId,
      deletedAt: null,
    },
  });

  if (!quote) {
    throw new NotFoundError('見積書が見つかりません');
  }

  const items = await getPrisma().quoteItem.findMany({
    where: { quoteId },
    orderBy: { sortOrder: 'asc' },
  });

  return items as PrismaQuoteItem[];
}

/**
 * 単一品目を取得
 */
export async function getQuoteItem(
  itemId: string,
  quoteId: string,
  companyId: string
): Promise<PrismaQuoteItem | null> {
  const item = await getPrisma().quoteItem.findFirst({
    where: {
      id: itemId,
      quoteId,
      quote: { companyId, deletedAt: null },
    },
  });
  return item as PrismaQuoteItem | null;
}

/**
 * 品目をバルク処理
 */
export async function bulkProcessQuoteItems(
  quoteId: string,
  companyId: string,
  bulkData: BulkQuoteItemsData
): Promise<PrismaQuoteItem[]> {
  return await getPrisma().$transaction(async (tx) => {
    // 見積書の存在確認
    const quote = await tx.quote.findFirst({
      where: {
        id: quoteId,
        companyId,
        deletedAt: null,
      },
    });

    if (!quote) {
      throw new NotFoundError('見積書が見つかりません');
    }

    const results: PrismaQuoteItem[] = [];

    for (const item of bulkData.items) {
      switch (item.action) {
        case 'create':
          const createdItem = await tx.quoteItem.create({
            data: {
              quoteId,
              ...item.data,
            },
          });
          results.push(createdItem as PrismaQuoteItem);
          break;

        case 'update': {
          // 楽観ロック: updatedAt 一致条件
          const { updatedAt, ...updateData } = item.data;

          // 既存値を取得して整合性検証
          const existing = await tx.quoteItem.findFirst({
            where: {
              id: item.id,
              quoteId,
              quote: { companyId, deletedAt: null },
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

          const result = await tx.quoteItem.updateMany({
            where: {
              id: item.id,
              quoteId,
              quote: { companyId, deletedAt: null },
              updatedAt,
            },
            data: updateData,
          });
          if (result.count === 0) {
            throw new Error(
              '更新競合が発生しました。最新の状態を取得してから再試行してください。'
            );
          }
          const updatedItem = await tx.quoteItem.findUnique({
            where: { id: item.id },
          });
          results.push(updatedItem as PrismaQuoteItem);
          break;
        }

        case 'delete':
          await tx.quoteItem.delete({
            where: { id: item.id },
          });
          break;
      }
    }

    // ソート順を正規化
    const allItems = await tx.quoteItem.findMany({
      where: { quoteId },
      orderBy: { sortOrder: 'asc' },
    });

    const currentMap = new Map(allItems.map((it) => [it.id, it.sortOrder]));
    const normalizedItems = normalizeSortOrder(
      allItems.map((item) => ({ id: item.id, sortOrder: item.sortOrder }))
    );
    for (const item of normalizedItems) {
      const prev = currentMap.get(item.id);
      if (prev !== item.sortOrder) {
        await tx.quoteItem.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        });
      }
    }

    return results;
  });
}

/**
 * 見積書品目を完全置換（既存全削除→新規一括作成）
 */
export async function replaceAllQuoteItems(
  quoteId: string,
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
): Promise<PrismaQuoteItem[]> {
  return await getPrisma().$transaction(async (tx) => {
    // 見積書の存在確認
    const quote = await tx.quote.findFirst({
      where: {
        id: quoteId,
        companyId,
        deletedAt: null,
      },
    });

    if (!quote) {
      throw new NotFoundError('見積書が見つかりません');
    }

    // 既存品目を全削除
    await tx.quoteItem.deleteMany({
      where: { quoteId },
    });

    // 新規品目を一括作成
    if (newItems.length === 0) {
      return [];
    }

    const results: PrismaQuoteItem[] = [];
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

      const createdItem = await tx.quoteItem.create({
        data: {
          quoteId,
          ...itemData,
          sortOrder: itemData.sortOrder ?? sortOrder++,
        },
      });
      results.push(createdItem as PrismaQuoteItem);
    }

    return results;
  });
}

/**
 * 次の sortOrder を取得（10刻み）
 */
async function getNextSortOrder(quoteId: string): Promise<number> {
  const last = await getPrisma().quoteItem.findFirst({
    where: { quoteId },
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  });
  const current = last?.sortOrder ?? 0;
  return current + 10;
}

/**
 * CSVから品目をインポート
 */
export async function importQuoteItemsFromCSV(
  quoteId: string,
  companyId: string,
  csvText: string,
  overwrite = false
): Promise<CsvImportResult> {
  return await getPrisma().$transaction(async (tx) => {
    // 見積書の存在確認
    const quote = await tx.quote.findFirst({
      where: {
        id: quoteId,
        companyId,
        deletedAt: null,
      },
    });

    if (!quote) {
      throw new NotFoundError('見積書が見つかりません');
    }

    // 上書きモードの場合、既存品目を削除
    if (overwrite) {
      await tx.quoteItem.deleteMany({
        where: { quoteId },
      });
    }

    // CSVパース
    let csvData: Array<Record<string, string>>;
    try {
      csvData = parseCSVData(csvText);
    } catch (error) {
      return {
        success: false,
        imported: 0,
        errors: [{ row: 0, error: (error as Error).message }],
      };
    }

    const errors: Array<{ row: number; error: string }> = [];
    let imported = 0;

    // データ処理
    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      const rowNumber = i + 2; // ヘッダー行分を考慮

      try {
        // 必須フィールドチェック
        if (!row.description) {
          throw new Error('品目名は必須です');
        }
        if (!row.quantity || isNaN(Number(row.quantity))) {
          throw new Error('数量は数値である必要があります');
        }
        if (!row.unitPrice || isNaN(Number(row.unitPrice))) {
          throw new Error('単価は数値である必要があります');
        }

        // 品目作成
        // taxCategory を安全に解決
        const validTaxCategories: readonly TaxCategory[] = [
          'STANDARD',
          'REDUCED',
          'EXEMPT',
          'NON_TAX',
        ] as const;
        const value = row.taxCategory?.toUpperCase();
        const taxCategory: TaxCategory = validTaxCategories.includes(
          value as TaxCategory
        )
          ? (value as TaxCategory)
          : 'STANDARD';

        await tx.quoteItem.create({
          data: {
            quoteId,
            description: row.description,
            quantity: Number(row.quantity),
            unitPrice: Number(row.unitPrice),
            taxCategory,
            taxRate: row.taxRate ? Number(row.taxRate) : undefined,
            discountAmount: row.discountAmount ? Number(row.discountAmount) : 0,
            unit: row.unit || undefined,
            sku: row.sku || undefined,
            sortOrder: (i + 1) * 10,
          },
        });

        imported++;
      } catch (error) {
        errors.push({
          row: rowNumber,
          error: (error as Error).message,
        });
      }
    }

    return {
      success: errors.length === 0,
      imported,
      errors,
    };
  });
}

/**
 * 見積書の税計算を実行
 */
export async function calculateQuoteTax(
  quoteId: string,
  companyId: string
): Promise<TaxCalculationResult> {
  // 見積書と会社情報を取得
  const [quote, company] = await Promise.all([
    getPrisma().quote.findFirst({
      where: {
        id: quoteId,
        companyId,
        deletedAt: null,
      },
      include: {
        items: true,
      },
    }),
    getPrisma().company.findUnique({
      where: { id: companyId },
      select: {
        standardTaxRate: true,
        reducedTaxRate: true,
        priceIncludesTax: true,
      },
    }),
  ]);

  if (!quote) {
    throw new NotFoundError('見積書が見つかりません');
  }

  if (!company) {
    throw new NotFoundError('会社情報が見つかりません');
  }

  return calculateTax(
    quote.items.map((item) => ({
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      discountAmount: Number(item.discountAmount),
      taxRate: item.taxRate ? Number(item.taxRate) : null,
    })),
    {
      ...company,
      standardTaxRate: Number(company.standardTaxRate),
      reducedTaxRate: Number(company.reducedTaxRate),
    }
  );
}
