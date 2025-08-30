import { auth, currentUser } from '@clerk/nextjs/server';
import { Prisma } from '@prisma/client';

import { apiErrors } from '@/lib/shared/forms';
import { getPrisma } from '@/lib/shared/prisma';

/**
 * Clerkユーザーに対応するDBユーザーを取得・作成する統一関数
 * @param autoCreate 存在しない場合に自動作成するか
 * @returns User | null
 */
async function getOrCreateUser(autoCreate: boolean = false) {
  try {
    // 1. auth()でClerk認証状態を確認
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return null;
    }

    // 2. 既存ユーザーをDBから検索
    let user = await getPrisma().user.findUnique({
      where: { clerkId },
    });

    if (user) {
      console.log('User found in DB:', clerkId);
      return user;
    }

    // 3. 自動作成が無効の場合はnullを返す
    if (!autoCreate) {
      return null;
    }

    // 4. 自動作成: currentUser()でClerkからユーザー詳細取得
    const clerkUser = await currentUser();

    if (!clerkUser?.primaryEmailAddress?.emailAddress) {
      console.error('Failed to get email from Clerk user:', clerkId);
      return null;
    }

    // 5. DBにユーザー作成（冪等性を考慮）
    try {
      user = await getPrisma().user.create({
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
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        console.log(
          'User already created by concurrent request, fetching:',
          clerkId
        );
        user = await getPrisma().user.findUnique({
          where: { clerkId },
        });
        return user;
      }
      throw error;
    }
  } catch (error) {
    console.error('Failed to get or create user:', error);
    return null;
  }
}

/**
 * 現在認証されているユーザーのデータベースレコードを取得
 * Clerkの認証情報からPrismaのUserレコードを取得する
 */
export async function getCurrentUser() {
  return getOrCreateUser(false);
}

/**
 * 認証レスポンスを生成する共通ヘルパー関数
 * @param user ユーザーオブジェクト
 * @returns 統一されたAPIレスポンス
 */
function createAuthResponse(user: { id: string } | null) {
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
 * 認証チェックとユーザー取得を行うヘルパー関数
 * APIルートで使用するための統一的な認証処理
 * 開発環境では自動ユーザー作成、本番環境ではWebhook前提
 */
export async function requireAuth() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const user = await getOrCreateUser(isDevelopment);
  return createAuthResponse(user);
}

/**
 * リソースの取得・存在確認・所有権チェックを一括で行う高度な関数
 * @param resource - Prismaクエリの結果（null可能）
 * @param resourceName - エラーメッセージ用のリソース名
 * @returns 認証済みユーザーと確認済みリソース
 */
/**
 * 認証済みユーザーの会社情報を取得する（自動作成対応）
 */
export async function requireUserCompany() {
  const { user, error, status } = await requireAuth();
  if (error) {
    return { error, status, user: null, company: null };
  }

  let company = await getPrisma().company.findUnique({
    where: { userId: user!.id },
  });

  // Company が存在しない場合は自動作成（既存ユーザー対応）
  if (!company) {
    try {
      // Userの詳細情報を取得してemailを確認
      const fullUser = await getPrisma().user.findUnique({
        where: { id: user!.id },
      });

      company = await getPrisma().company.create({
        data: {
          userId: user!.id,
          companyName: fullUser?.email
            ? `${fullUser.email}の会社`
            : '新しい会社', // デフォルト名（後で変更可能）
        },
      });
      console.log('Company auto-created for existing user:', user!.id);
    } catch (createError) {
      // 同時リクエストでの重複作成を考慮
      if (
        createError instanceof Prisma.PrismaClientKnownRequestError &&
        createError.code === 'P2002'
      ) {
        // 再度検索を試行
        company = await getPrisma().company.findUnique({
          where: { userId: user!.id },
        });
      }

      if (!company) {
        console.error(
          'Failed to create or find company for user:',
          user!.id,
          createError
        );
        return {
          error: apiErrors.internal(),
          status: 500,
          user,
          company: null,
        };
      }
    }
  }

  return { error: null, status: 200, user, company };
}

export async function requireResourceAccess<T extends { companyId: string }>(
  resource: T | null,
  resourceName: string
) {
  if (!resource) {
    return {
      error: apiErrors.notFound(resourceName),
      status: 404,
      user: null,
      company: null,
      resource: null,
    };
  }

  const { user, error, status } = await requireAuth();
  if (error) {
    return { error, status, user: null, company: null, resource: null };
  }

  // ユーザーの会社情報を取得
  const company = await getPrisma().company.findUnique({
    where: { userId: user!.id },
  });

  if (!company) {
    return {
      error: apiErrors.forbidden(),
      status: 403,
      user,
      company: null,
      resource: null,
    };
  }

  if (resource.companyId !== company.id) {
    return {
      error: apiErrors.forbidden(),
      status: 403,
      user,
      company,
      resource: null,
    };
  }

  return { error: null, status: 200, user, company, resource };
}

/**
 * 認証チェック + 自動ユーザー作成版
 * APIルートで使用するための統一的な認証処理（自動ユーザー作成付き）
 */
export async function requireAuthOrCreate() {
  const user = await getOrCreateUser(true);
  return createAuthResponse(user);
}
