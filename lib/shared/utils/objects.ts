import { Decimal } from 'decimal.js';

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
 * @param value - Decimal値またはnull/undefined
 * @returns number値またはnull/undefined
 */
export function convertDecimalToNumber(
  value: Decimal | null | undefined
): number | null | undefined {
  if (value === null) return null;
  if (value === undefined) return undefined;
  return Number(value);
}

/**
 * オブジェクト内のDecimal値をnumberに変換する
 * @param obj - 変換対象のオブジェクト
 * @param decimalFields - Decimalフィールドのキー配列
 * @returns Decimalが変換されたオブジェクト
 */
export function convertDecimalFields<T extends Record<string, unknown>>(
  obj: T,
  decimalFields: (keyof T)[]
): T {
  const converted = { ...obj };

  decimalFields.forEach((field) => {
    const value = converted[field];
    if (value !== null && value !== undefined) {
      converted[field] = Number(value) as T[keyof T];
    }
  });

  return converted;
}
