import { Prisma } from '@prisma/client';

/**
 * オブジェクト操作共通ユーティリティ
 */

/**
 * オブジェクトからundefinedの値を安全に除外する
 * 型安全性を保ちながらPrismaの更新データを準備する際に使用
 *
 * @param obj - フィルタリング対象のオブジェクト
 * @returns undefinedが除外されたオブジェクト（undefined プロパティは型レベルでも除去）
 */
export function omitUndefined<T extends Record<string, unknown>>(
  obj: T
): {
  [K in keyof T as T[K] extends undefined ? never : K]: Exclude<
    T[K],
    undefined
  >;
} {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined)
  ) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/**
 * Prisma Decimalをnumberに変換する
 * @param value - Decimal値、number値、またはnull/undefined
 * @returns number値またはnull/undefined
 */
export function convertDecimalToNumber(
  value: Prisma.Decimal | number | null | undefined
): number | null | undefined {
  if (value === null) return null;
  if (value === undefined) return undefined;
  if (typeof value === 'number') return value;
  // Prisma.Decimal は toNumber を提供
  try {
    return value.toNumber();
  } catch {
    // 念のためのフォールバック
    return Number(value as unknown as string);
  }
}

/**
 * オブジェクト内のDecimal値をnumberに変換する（型安全版）
 * @param obj - 変換対象のオブジェクト
 * @param decimalFields - Decimalフィールドのキー配列
 * @returns Decimalが変換されたオブジェクト
 */
export function convertDecimalFields<
  T extends Record<string, unknown>,
  K extends keyof T,
>(
  obj: T,
  decimalFields: readonly K[]
): Omit<T, K> & { [P in K]: number | null | undefined } {
  const converted: Record<string, unknown> = { ...obj };
  decimalFields.forEach((field) => {
    converted[field as string] = convertDecimalToNumber(
      obj[field] as Prisma.Decimal | number | null | undefined
    );
  });
  return converted as Omit<T, K> & { [P in K]: number | null | undefined };
}
