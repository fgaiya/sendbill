import { cn } from '@/lib/shared/utils/ui'
import { APP_CONFIG } from '@/lib/shared/config'

// ナビゲーション固有スタイルクラス（設定値は config.ts に移動）

// ナビゲーションリンクの基本スタイル
export const NAV_LINK_BASE_CLASSES = {
  MOBILE: cn('block px-3 py-2', APP_CONFIG.UI.BUTTON.BORDER_RADIUS, 'text-base font-medium', APP_CONFIG.ANIMATION.TRANSITION_COLORS, APP_CONFIG.UI.FOCUS.RING),
  DESKTOP: cn('px-3 py-2', APP_CONFIG.UI.BUTTON.BORDER_RADIUS, 'text-sm font-medium', APP_CONFIG.ANIMATION.TRANSITION_COLORS, APP_CONFIG.UI.FOCUS.RING),
} as const

// 状態に応じたスタイル
export const NAV_LINK_STATE_CLASSES = {
  ACTIVE: 'bg-blue-100 text-blue-900',
  INACTIVE: APP_CONFIG.UI.COLORS.NAV_INACTIVE,
} as const

// ボタンスタイル
export const BUTTON_CLASSES = {
  MENU_TOGGLE: cn('text-gray-700 hover:text-gray-900 p-2', APP_CONFIG.UI.BUTTON.BORDER_RADIUS, APP_CONFIG.ANIMATION.TRANSITION_COLORS, APP_CONFIG.UI.FOCUS.RING),
  PRIMARY: cn(APP_CONFIG.UI.BUTTON.REGULAR_PRIMARY, APP_CONFIG.UI.FOCUS.RING),
  SECONDARY: cn(APP_CONFIG.UI.BUTTON.REGULAR_SECONDARY, APP_CONFIG.UI.FOCUS.RING),
} as const

// サイドバーベーススタイル
export const SIDEBAR_BASE_CLASSES = {
  CONTAINER: cn('bg-white border-r border-gray-200 flex flex-col', APP_CONFIG.ANIMATION.TRANSITION_ALL),
  SIDEBAR: 'flex fixed left-0 top-0 bottom-0 z-30',
} as const

// サイドバー状態別スタイル
export const SIDEBAR_STATE_CLASSES = {
  COLLAPSED: APP_CONFIG.UI.SIDEBAR.COLLAPSED_WIDTH,
  EXPANDED: APP_CONFIG.UI.SIDEBAR.EXPANDED_WIDTH,
} as const

// サイドバーアイテムスタイル
export const SIDEBAR_ITEM_CLASSES = {
  BASE: cn('flex items-center px-3 py-2 text-sm font-medium', APP_CONFIG.UI.BUTTON.BORDER_RADIUS, APP_CONFIG.ANIMATION.TRANSITION_COLORS, 'group', APP_CONFIG.UI.FOCUS.RING),
  ACTIVE: APP_CONFIG.UI.COLORS.SIDEBAR_ACTIVE,
  INACTIVE: APP_CONFIG.UI.COLORS.SIDEBAR_INACTIVE,
  ICON_WRAPPER: cn('flex-shrink-0', APP_CONFIG.UI.SPACING.ICON_SIZE),
  LABEL: cn(APP_CONFIG.UI.SPACING.COMPONENT_GAP, APP_CONFIG.ANIMATION.TRANSITION_OPACITY),
  LABEL_COLLAPSED: 'opacity-0 overflow-hidden',
  LABEL_EXPANDED: 'opacity-100',
} as const

// サイドバートグルボタンスタイル
export const SIDEBAR_TOGGLE_CLASSES = {
  BUTTON: cn('p-2', APP_CONFIG.UI.BUTTON.BORDER_RADIUS, 'text-gray-500 hover:text-gray-700 hover:bg-gray-100', APP_CONFIG.ANIMATION.TRANSITION_COLORS, APP_CONFIG.UI.FOCUS.RING),
} as const