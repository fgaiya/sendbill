import { NextRequest, NextResponse } from 'next/server';

import { importQuoteItemsFromCSV } from '@/lib/domains/quotes/service';
import { apiErrors, handleApiError } from '@/lib/shared/forms';
import { requireUserCompany } from '@/lib/shared/utils/auth';

interface RouteContext {
  params: Promise<{ quoteId: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { quoteId } = await context.params;
    const { company, error, status } = await requireUserCompany();
    if (error) {
      return NextResponse.json(error, { status });
    }

    // FormDataからCSVファイルとオプションを取得
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const overwrite = formData.get('overwrite') === 'true';

    if (!file) {
      return NextResponse.json(apiErrors.conflict('CSVファイルは必須です'), {
        status: 400,
      });
    }

    // ファイルタイプチェック
    if (!file.type.includes('csv') && !file.name.endsWith('.csv')) {
      return NextResponse.json(
        apiErrors.conflict('CSVファイルを選択してください'),
        { status: 400 }
      );
    }

    // ファイルサイズチェック（5MB制限）
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        apiErrors.conflict('ファイルサイズは5MB以下にしてください'),
        { status: 400 }
      );
    }

    // CSVテキストを読み取り
    const csvText = await file.text();

    if (!csvText.trim()) {
      return NextResponse.json(apiErrors.conflict('CSVファイルが空です'), {
        status: 400,
      });
    }

    // CSVインポート処理
    const result = await importQuoteItemsFromCSV(
      quoteId,
      company!.id,
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
