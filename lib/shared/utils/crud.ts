import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod';

import { apiErrors, handleApiError } from '@/lib/shared/forms';
import {
  requireAuth,
  requireAuthOrCreate,
  requireResourceAccess,
} from '@/lib/shared/utils/auth';
import { omitUndefined } from '@/lib/shared/utils/objects';

/**
 * Prisma のモデルデリゲートに共通する５メソッドだけを抜き出した型。
 * 型パーツ抽出のための内部ユーティリティ。any は外部に漏れない。
 */
type DelegateLike = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  findUnique: (...args: any[]) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  findMany: (...args: any[]) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create: (...args: any[]) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update: (...args: any[]) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete: (...args: any[]) => any;
};

/**
 * デリゲートから「where/data 型」を抽出するユーティリティ
 */
type WhereArg<D extends DelegateLike> = Parameters<D['findUnique']>[0]['where'];

/**
 * 汎用 CRUD オプション型
 * UncheckedCreateInput使用で型制約を緩和
 */
interface CrudOptions<D extends DelegateLike, TCreateSchema, TUpdateSchema> {
  model: D;
  schemas: {
    create: TCreateSchema;
    update: TUpdateSchema;
  };
  resourceName: string;
  uniqueConstraint?: (userId: string) => WhereArg<D>;
}

/**
 * CRUD作成処理の内部共通関数
 * 認証関数の違いによる重複を排除
 */
async function createResourceInternal<
  D extends DelegateLike,
  TCreateSchema extends z.ZodSchema,
>(
  request: NextRequest,
  options: CrudOptions<D, TCreateSchema, z.ZodSchema>,
  authFunction: typeof requireAuth | typeof requireAuthOrCreate
) {
  try {
    const { user, error, status } = await authFunction();
    if (error) {
      return NextResponse.json(error, { status });
    }

    const body = await request.json();
    const validatedData = options.schemas.create.parse(
      body
    ) as z.infer<TCreateSchema>;

    // 一意制約チェック（オプション）
    if (options.uniqueConstraint) {
      const existing = await options.model.findUnique({
        where: options.uniqueConstraint(user!.id),
      } as { where: WhereArg<D> });

      if (existing) {
        return NextResponse.json(
          apiErrors.conflict(`${options.resourceName}は既に登録されています`),
          { status: 409 }
        );
      }
    }

    const entity = await options.model.create({
      data: { ...(validatedData as Record<string, unknown>), userId: user!.id },
    });

    return NextResponse.json(entity, { status: 201 });
  } catch (error) {
    return handleApiError(error, `${options.resourceName} creation`);
  }
}

/**
 * 基本的なCRUD作成処理
 */
export async function createResource<
  D extends DelegateLike,
  TCreateSchema extends z.ZodSchema,
>(request: NextRequest, options: CrudOptions<D, TCreateSchema, z.ZodSchema>) {
  return createResourceInternal(request, options, requireAuth);
}

/**
 * CRUD取得処理（一覧）の内部共通関数
 * 認証関数の違いによる重複を排除
 */
async function getResourcesInternal<D extends DelegateLike>(
  options: Pick<
    CrudOptions<D, z.ZodSchema, z.ZodSchema>,
    'model' | 'resourceName'
  >,
  whereOptions: Record<string, unknown> | undefined,
  authFunction: typeof requireAuth | typeof requireAuthOrCreate
) {
  try {
    const { user, error, status } = await authFunction();
    if (error) {
      return NextResponse.json(error, { status });
    }

    const entities = await options.model.findMany({
      where: { userId: user!.id, ...whereOptions },
    });

    return NextResponse.json(entities);
  } catch (error) {
    return handleApiError(error, `${options.resourceName} fetch`);
  }
}

/**
 * 基本的なCRUD取得処理（一覧）
 */
export async function getResources<D extends DelegateLike>(
  options: Pick<
    CrudOptions<D, z.ZodSchema, z.ZodSchema>,
    'model' | 'resourceName'
  >,
  whereOptions?: Record<string, unknown>
) {
  return getResourcesInternal(options, whereOptions, requireAuth);
}

/**
 * 基本的なCRUD更新処理
 */
export async function updateResource<
  D extends DelegateLike,
  TUpdateSchema extends z.ZodSchema,
>(
  id: string,
  request: NextRequest,
  options: CrudOptions<D, z.ZodSchema, TUpdateSchema>
) {
  try {
    const body = await request.json();
    const validatedData = options.schemas.update.parse(
      body
    ) as z.infer<TUpdateSchema>;

    const {
      error,
      status,
      resource: _existingEntity,
    } = await requireResourceAccess(
      await options.model.findUnique({ where: { id } }),
      options.resourceName
    );
    if (error) {
      return NextResponse.json(error, { status });
    }

    const filteredData = omitUndefined(
      validatedData as Record<string, unknown>
    );

    const updatedEntity = await options.model.update({
      where: { id },
      data: filteredData,
    });

    return NextResponse.json(updatedEntity);
  } catch (error) {
    return handleApiError(error, `${options.resourceName} update`);
  }
}

/**
 * 基本的なCRUD削除処理
 */
export async function deleteResource<D extends DelegateLike>(
  id: string,
  options: Pick<
    CrudOptions<D, z.ZodSchema, z.ZodSchema>,
    'model' | 'resourceName'
  >,
  customValidation?: (entity: unknown) => Promise<NextResponse | null>
) {
  try {
    const {
      error,
      status,
      resource: existingEntity,
    } = await requireResourceAccess(
      await options.model.findUnique({ where: { id } }),
      options.resourceName
    );
    if (error) {
      return NextResponse.json(error, { status });
    }

    // カスタムバリデーション（例：関連データチェック）
    if (customValidation) {
      const validationResult = await customValidation(existingEntity);
      if (validationResult) {
        return validationResult;
      }
    }

    await options.model.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: `${options.resourceName}を削除しました` },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error, `${options.resourceName} delete`);
  }
}

/**
 * 基本的なCRUD取得処理（単体）
 */
export async function getResource<D extends DelegateLike>(
  id: string,
  options: Pick<
    CrudOptions<D, z.ZodSchema, z.ZodSchema>,
    'model' | 'resourceName'
  >,
  includeOptions?: Record<string, unknown>
) {
  try {
    const {
      error,
      status,
      resource: entity,
    } = await requireResourceAccess(
      await options.model.findUnique({
        where: { id },
        include: includeOptions,
      }),
      options.resourceName
    );
    if (error) {
      return NextResponse.json(error, { status });
    }

    return NextResponse.json(entity);
  } catch (error) {
    return handleApiError(error, `${options.resourceName} fetch`);
  }
}

/**
 * 基本的なCRUD作成処理（自動ユーザー作成版）
 * ウェブフック設定なしでも動作する遅延ユーザー作成対応
 */
export async function createResourceWithAutoUser<
  D extends DelegateLike,
  TCreateSchema extends z.ZodSchema,
>(request: NextRequest, options: CrudOptions<D, TCreateSchema, z.ZodSchema>) {
  return createResourceInternal(request, options, requireAuthOrCreate);
}

/**
 * 基本的なCRUD取得処理（一覧）（自動ユーザー作成版）
 */
export async function getResourcesWithAutoUser<D extends DelegateLike>(
  options: Pick<
    CrudOptions<D, z.ZodSchema, z.ZodSchema>,
    'model' | 'resourceName'
  >,
  whereOptions?: Record<string, unknown>
) {
  return getResourcesInternal(options, whereOptions, requireAuthOrCreate);
}
