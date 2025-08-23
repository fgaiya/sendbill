import { useEffect } from 'react';

/**
 * 複数モーダル対応のボディスクロールロック管理
 * 参照カウント方式で重複するモーダルのスクロールロックを適切に管理
 */

// モジュールスコープの状態管理
let __bodyScrollLockCount = 0;
let __bodyOverflowBeforeLock: string | null = null;

/**
 * ボディスクロールをロックする
 * 複数回呼ばれても安全（参照カウント管理）
 */
export function lockBodyScroll(): void {
  if (typeof document === 'undefined') return;
  if (__bodyScrollLockCount === 0) {
    __bodyOverflowBeforeLock = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  __bodyScrollLockCount++;
}

/**
 * ボディスクロールのロックを解除する
 * 全てのロックが解除された時点で元のoverflow値を復元
 */
export function unlockBodyScroll(): void {
  if (typeof document === 'undefined') return;
  __bodyScrollLockCount = Math.max(0, __bodyScrollLockCount - 1);
  if (__bodyScrollLockCount === 0) {
    document.body.style.overflow = __bodyOverflowBeforeLock ?? '';
    __bodyOverflowBeforeLock = null;
  }
}

/**
 * React useEffect用のスクロールロックフック
 * @param isLocked ロック状態
 */

export function useBodyScrollLock(isLocked: boolean): void {
  useEffect(() => {
    // SSR安全化: document が無い場合は何もしない
    if (typeof document === 'undefined') return;
    if (!isLocked) return;
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, [isLocked]);
}

/**
 * 現在のロック数を取得（デバッグ用）
 */
export function getBodyScrollLockCount(): number {
  return __bodyScrollLockCount;
}
