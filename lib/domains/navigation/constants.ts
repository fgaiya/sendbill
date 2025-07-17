// DOM セレクター定数
export const SELECTORS = {
  MENU_ITEM: '[data-menu-item]',
  FOCUSABLE_ELEMENTS: 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
} as const

// アクセシビリティメッセージ
export const A11Y_MESSAGES = {
  MENU_OPENED: 'メニューを開きました',
  MENU_CLOSED: 'メニューを閉じました',
  MENU_OPEN_LABEL: 'メニューを開く',
  MENU_CLOSE_LABEL: 'メニューを閉じる',
} as const

// キーボードキー定数
export const KEYBOARD_KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  ARROW_DOWN: 'ArrowDown',
  ARROW_UP: 'ArrowUp',
  HOME: 'Home',
  END: 'End',
  TAB: 'Tab',
} as const

// 時間定数
export const TIMING = {
  ANNOUNCEMENT_CLEANUP_DELAY: 1000,
} as const