import { auth } from '@clerk/nextjs/server';

import { apiErrors } from '@/lib/shared/forms';
import { prisma } from '@/lib/shared/prisma';

/**
 * 現在認証されているユーザーのデータベースレコードを取得
 * Clerkの認証情報からPrismaのUserレコードを取得する
 */
export async function getCurrentUser() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    return user;
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
}

/**
 * 認証チェックとユーザー取得を行うヘルパー関数
 * APIルートで使用するための統一的な認証処理
 */
export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    return {
      error: apiErrors.unauthorized(),
      status: 401,
      user: null,
    };
  }

  return {
    error: null,
    status: 200,
    user,
  };
}

/**
 * リソースの所有権をチェックする関数
 * ユーザーが指定されたリソースにアクセスする権限があるかを確認
 */
export async function checkResourceOwnership(resourceUserId: string) {
  const { user, error, status } = await requireAuth();

  if (error) {
    return { error, status, hasAccess: false };
  }

  if (user!.id !== resourceUserId) {
    return {
      error: apiErrors.forbidden(),
      status: 403,
      hasAccess: false,
    };
  }

  return {
    error: null,
    status: 200,
    hasAccess: true,
  };
}
