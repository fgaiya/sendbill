import { SELECTORS, A11Y_MESSAGES, TIMING } from './constants'

/**
 * 指定された要素内のフォーカス可能な要素を取得
 */
export const getFocusableElements = (container: HTMLElement | null): HTMLElement[] => {
  if (!container) return []
  return Array.from(container.querySelectorAll(SELECTORS.FOCUSABLE_ELEMENTS)) as HTMLElement[]
}

/**
 * 指定された要素内のメニュー項目を取得
 */
export const getMenuItems = (container: HTMLElement | null): HTMLElement[] => {
  if (!container) return []
  return Array.from(container.querySelectorAll(SELECTORS.MENU_ITEM)) as HTMLElement[]
}

/**
 * スクリーンリーダー用の音声通知を作成
 */
export const announceToScreenReader = (message: string): void => {
  const announcement = document.createElement('div')
  announcement.setAttribute('aria-live', 'polite')
  announcement.setAttribute('aria-atomic', 'true')
  announcement.setAttribute('class', 'sr-only')
  announcement.textContent = message
  
  document.body.appendChild(announcement)
  setTimeout(() => {
    if (document.body.contains(announcement)) {
      document.body.removeChild(announcement)
    }
  }, TIMING.ANNOUNCEMENT_CLEANUP_DELAY)
}

/**
 * メニュー開閉時のスクリーンリーダー通知
 */
export const announceMenuToggle = (isOpen: boolean): void => {
  const message = isOpen ? A11Y_MESSAGES.MENU_OPENED : A11Y_MESSAGES.MENU_CLOSED
  announceToScreenReader(message)
}

/**
 * 配列内の次のインデックスを計算（循環）
 */
export const getNextIndex = (currentIndex: number, length: number): number => {
  return (currentIndex + 1) % length
}

/**
 * 配列内の前のインデックスを計算（循環）
 */
export const getPreviousIndex = (currentIndex: number, length: number): number => {
  return (currentIndex - 1 + length) % length
}

/**
 * 要素が指定されたコンテナ内に含まれているかチェック
 */
export const isElementInContainer = (element: Node | null, container: HTMLElement | null): boolean => {
  return !!(container && element && container.contains(element))
}