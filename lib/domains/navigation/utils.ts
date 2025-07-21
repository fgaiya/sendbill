import { SELECTORS, A11Y_MESSAGES, TIMING } from './constants';

/**
 * 指定された要素内のフォーカス可能な要素を取得
 */
export const getFocusableElements = (
  container: HTMLElement | null
): HTMLElement[] => {
  if (!container) return [];
  return Array.from(
    container.querySelectorAll(SELECTORS.FOCUSABLE_ELEMENTS)
  ).filter((element): element is HTMLElement => element instanceof HTMLElement);
};

/**
 * 指定された要素内のメニュー項目を取得
 */
export const getMenuItems = (container: HTMLElement | null): HTMLElement[] => {
  if (!container) return [];
  return Array.from(container.querySelectorAll(SELECTORS.MENU_ITEM)).filter(
    (element): element is HTMLElement => element instanceof HTMLElement
  );
};

/**
 * スクリーンリーダー用の音声通知を作成
 */
let currentAnnouncement: HTMLElement | null = null;
let cleanupTimer: number | null = null;

export const announceToScreenReader = (message: string): void => {
  // 既存のアナウンスメントをクリーンアップ
  if (currentAnnouncement && document.body.contains(currentAnnouncement)) {
    document.body.removeChild(currentAnnouncement);
  }
  if (cleanupTimer) {
    clearTimeout(cleanupTimer);
  }

  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.setAttribute('class', 'sr-only');
  announcement.textContent = message;

  currentAnnouncement = announcement;
  document.body.appendChild(announcement);

  cleanupTimer = window.setTimeout(() => {
    if (currentAnnouncement && document.body.contains(currentAnnouncement)) {
      document.body.removeChild(currentAnnouncement);
      currentAnnouncement = null;
    }
    cleanupTimer = null;
  }, TIMING.ANNOUNCEMENT_CLEANUP_DELAY);
};

/**
 * メニュー開閉時のスクリーンリーダー通知
 */
export const announceMenuToggle = (isOpen: boolean): void => {
  const message = isOpen
    ? A11Y_MESSAGES.MENU_OPENED
    : A11Y_MESSAGES.MENU_CLOSED;
  announceToScreenReader(message);
};

/**
 * 配列内の次のインデックスを計算（循環）
 */
export const getNextIndex = (currentIndex: number, length: number): number => {
  if (length <= 0) return 0;
  return (currentIndex + 1) % length;
};

/**
 * 配列内の前のインデックスを計算（循環）
 */
export const getPreviousIndex = (
  currentIndex: number,
  length: number
): number => {
  if (length <= 0) return 0;
  return (currentIndex - 1 + length) % length;
};

/**
 * 要素が指定されたコンテナ内に含まれているかチェック
 */
export const isElementInContainer = (
  element: Node | null,
  container: HTMLElement | null
): boolean => {
  return !!(container && element && container.contains(element));
};
