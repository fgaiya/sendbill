/**
 * 安全な数値パース関数
 * NaN の場合のみフォールバック値を返す（0 は有効な値として扱う）
 */
export function toNumber(input: unknown, fallback: number): number {
  const n =
    typeof input === 'number'
      ? input
      : typeof input === 'string' && input.trim() !== ''
        ? Number(input)
        : NaN;
  return Number.isFinite(n) ? n : fallback;
}

/**
 * 安全なブール値パース関数
 * 文字列の場合は適切に判定し、その他の場合はフォールバック値を返す
 */
export function toBoolean(input: unknown, fallback: boolean): boolean {
  if (typeof input === 'boolean') return input;
  if (typeof input === 'number') return input !== 0;
  if (typeof input === 'string') {
    const v = input.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(v)) return true;
    if (['false', '0', 'no', 'off', ''].includes(v)) return false;
  }
  return fallback;
}
