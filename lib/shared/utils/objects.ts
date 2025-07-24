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
