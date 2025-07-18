import { cn } from '@/lib/shared/utils/ui'

// 共通フォーカススタイル
export const FOCUS_RING_CLASSES = 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'

// ナビゲーションリンクの基本スタイル
export const NAV_LINK_BASE_CLASSES = {
  MOBILE: cn('block px-3 py-2 rounded-md text-base font-medium transition-colors', FOCUS_RING_CLASSES),
  DESKTOP: cn('px-3 py-2 rounded-md text-sm font-medium transition-colors', FOCUS_RING_CLASSES),
} as const

// 状態に応じたスタイル
export const NAV_LINK_STATE_CLASSES = {
  ACTIVE: 'bg-blue-100 text-blue-900',
  INACTIVE: 'text-gray-700 hover:text-gray-900 hover:bg-gray-50',
} as const

// ボタンスタイル
export const BUTTON_CLASSES = {
  MENU_TOGGLE: cn('text-gray-700 hover:text-gray-900 p-2 rounded-md transition-colors', FOCUS_RING_CLASSES),
  PRIMARY: cn('bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors', FOCUS_RING_CLASSES),
  SECONDARY: cn('text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors', FOCUS_RING_CLASSES),
} as const