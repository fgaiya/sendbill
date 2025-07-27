import { auth, currentUser } from '@clerk/nextjs/server';

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
 * リソースの取得・存在確認・所有権チェックを一括で行う高度な関数
 * @param resource - Prismaクエリの結果（null可能）
 * @param resourceName - エラーメッセージ用のリソース名
 * @returns 認証済みユーザーと確認済みリソース
 */
export async function requireResourceAccess<T extends { userId: string }>(
  resource: T | null,
  resourceName: string
) {
  if (!resource) {
    return {
      error: apiErrors.notFound(resourceName),
      status: 404,
      user: null,
      resource: null,
    };
  }

  const { user, error, status } = await requireAuth();
  if (error) {
    return { error, status, user: null, resource: null };
  }

  if (resource.userId !== user!.id) {
    return {
      error: apiErrors.forbidden(),
      status: 403,
      user: null,
      resource: null,
    };
  }

  return { error: null, status: 200, user, resource };
}

/**
 * Clerkユーザーに対応するDBユーザーを確実に取得・作成する
 * 存在しない場合はClerkから情報を取得して自動作成
 * @returns User | null
 */
export async function ensureUser() {
  try {
    // 1. auth()でClerk認証状態を確認
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return null;
    }

    // 2. 既存ユーザーをDBから検索
    let user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (user) {
      console.log('User found in DB:', clerkId);
      return user;
    }

    // 3. 存在しない場合：currentUser()でClerkからユーザー詳細取得
    const clerkUser = await currentUser();

    if (!clerkUser?.primaryEmailAddress?.emailAddress) {
      console.error('Failed to get email from Clerk user:', clerkId);
      return null;
    }

    // 4. DBにユーザー作成（冪等性を考慮）
    try {
      user = await prisma.user.create({
        data: {
          clerkId: clerkId,
          email: clerkUser.primaryEmailAddress.emailAddress,
        },
      });

      console.log(
        'User created via lazy creation:',
        clerkId,
        `(${clerkUser.primaryEmailAddress.emailAddress})`
      );
      return user;
    } catch (error: unknown) {
      // 同時リクエストによる一意制約違反の場合
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        console.log(
          'User already created by concurrent request, fetching:',
          clerkId
        );
        user = await prisma.user.findUnique({
          where: { clerkId },
        });
        return user;
      }
      throw error;
    }
  } catch (error) {
    console.error('Failed to ensure user:', error);
    return null;
  }
}

/**
 * ensureUserのエイリアス（分かりやすい名前）
 * 現在のユーザーを取得、存在しない場合は作成
 */
export async function getCurrentUserOrCreate() {
  return ensureUser();
}

/**
 * 認証チェック + 自動ユーザー作成版
 * APIルートで使用するための統一的な認証処理（自動ユーザー作成付き）
 */
export async function requireAuthOrCreate() {
  const user = await ensureUser();

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
