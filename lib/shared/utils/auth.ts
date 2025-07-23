import { NextResponse } from 'next/server';

import { apiErrors } from '@/lib/shared/forms';

/**
 * リソースの所有者チェックを行う共通ヘルパー関数
 *
 * @param resource - チェック対象のリソース（userId プロパティを持つ）
 * @param currentUserId - 現在のユーザーID
 * @param resourceName - リソース名（エラーメッセージ用）
 * @returns 権限がない場合はエラーレスポンス、権限がある場合はnull
 */
export function checkResourceOwnership<T extends { userId: string }>(
  resource: T | null,
  currentUserId: string,
  resourceName: string
): NextResponse | null {
  if (!resource) {
    return NextResponse.json(apiErrors.notFound(resourceName), { status: 404 });
  }

  if (resource.userId !== currentUserId) {
    return NextResponse.json(apiErrors.forbidden(), { status: 403 });
  }

  return null;
}
