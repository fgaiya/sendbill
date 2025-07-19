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

// サイドバーベーススタイル
export const SIDEBAR_BASE_CLASSES = {
  CONTAINER: 'bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out',
  SIDEBAR: 'flex fixed left-0 top-0 bottom-0 z-30',
} as const

// サイドバー状態別スタイル
export const SIDEBAR_STATE_CLASSES = {
  COLLAPSED: 'w-16',
  EXPANDED: 'w-64',
} as const

// サイドバーアイテムスタイル
export const SIDEBAR_ITEM_CLASSES = {
  BASE: cn('flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors group', FOCUS_RING_CLASSES),
  ACTIVE: 'bg-blue-50 text-blue-700 border-r-2 border-blue-700',
  INACTIVE: 'text-gray-700 hover:text-gray-900 hover:bg-gray-50',
  ICON_WRAPPER: 'flex-shrink-0 w-6 h-6',
  LABEL: 'ml-3 transition-opacity duration-300',
  LABEL_COLLAPSED: 'opacity-0 overflow-hidden',
  LABEL_EXPANDED: 'opacity-100',
} as const

// サイドバートグルボタンスタイル
export const SIDEBAR_TOGGLE_CLASSES = {
  BUTTON: cn('p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors', FOCUS_RING_CLASSES),
} as const