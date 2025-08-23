import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod';

import { importQuoteItemsFromCSV } from '@/lib/domains/quotes/service';
import {
  apiErrors,
  handleApiError,
  commonValidationSchemas,
} from '@/lib/shared/forms';
import { requireUserCompany } from '@/lib/shared/utils/auth';

interface RouteContext {
  params: Promise<{ quoteId: string }>;
}

const quoteParamsSchema = z.object({
  quoteId: commonValidationSchemas.cuid('quoteID'),
});

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { quoteId } = quoteParamsSchema.parse(await context.params);
    const { company, error, status } = await requireUserCompany();
    if (error) {
      return NextResponse.json(error, { status });
    }

    // FormDataからCSVファイルとオプションを取得
    const formData = await request.formData();
    const filePart = formData.get('file');
    const overwrite = formData.get('overwrite') === 'true';

    if (!(filePart instanceof File)) {
      return NextResponse.json(
        apiErrors.validation([
          {
            path: ['file'],
            message: 'CSVファイルは必須です',
            code: 'custom',
            input: filePart,
          },
        ]),
        { status: 400 }
      );
    }
    const file = filePart;
    const validMimeTypes = [
      'text/csv',
      'application/csv',
      'application/vnd.ms-excel',
    ];

    // ファイルタイプチェック
    if (
      !validMimeTypes.includes(file.type) &&
      !file.name.toLowerCase().endsWith('.csv')
    ) {
      return NextResponse.json(
        apiErrors.validation([
          {
            path: ['file'],
            message: 'CSVファイルを選択してください',
            code: 'custom',
            input: file,
          },
        ]),
        { status: 400 }
      );
    }

    // ファイルサイズチェック（5MB制限）
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        apiErrors.validation([
          {
            path: ['file'],
            message: 'ファイルサイズは5MB以下にしてください',
            code: 'custom',
            input: file,
          },
        ]),
        { status: 400 }
      );
    }

    // CSVテキストを読み取り
    const csvText = await file.text();

    if (!csvText.trim()) {
      return NextResponse.json(
        apiErrors.validation([
          {
            path: ['file'],
            message: 'CSVファイルが空です',
            code: 'custom',
            input: csvText,
          },
        ]),
        { status: 400 }
      );
    }

    // CSVインポート処理
    const result = await importQuoteItemsFromCSV(
      quoteId,
      company.id,
      csvText,
      overwrite
    );

    // インポート結果をレスポンス
    return NextResponse.json({
      success: result.success,
      imported: result.imported,
      errors: result.errors,
      message: result.success
        ? `${result.imported}件の品目をインポートしました`
        : `インポートが完了しました（成功: ${result.imported}件、エラー: ${result.errors.length}件）`,
    });
  } catch (error) {
    return handleApiError(error, 'Quote items CSV import');
  }
}
