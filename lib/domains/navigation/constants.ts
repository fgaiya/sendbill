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

// サイドバーメニュー項目定義（アイコンなし）
import type { SidebarMenuConfig } from './types'

export const SIDEBAR_MENU_CONFIG: SidebarMenuConfig[] = [
  {
    href: '/dashboard',
    label: 'ダッシュボード',
    iconName: 'LayoutDashboard',
    requireAuth: true,
    isActive: (pathname: string) => pathname === '/dashboard',
  },
  {
    href: '/dashboard/invoices',
    label: '請求書',
    iconName: 'FileText',
    requireAuth: true,
    isActive: (pathname: string) => pathname.startsWith('/dashboard/invoices'),
  },
  {
    href: '/dashboard/clients',
    label: '顧客管理',
    iconName: 'Users',
    requireAuth: true,
    isActive: (pathname: string) => pathname.startsWith('/dashboard/clients'),
  },
  {
    href: '/dashboard/quotes',
    label: '見積書',
    iconName: 'Receipt',
    requireAuth: true,
    isActive: (pathname: string) => pathname.startsWith('/dashboard/quotes'),
  },
  {
    href: '/dashboard/settings',
    label: '設定',
    iconName: 'Settings',
    requireAuth: true,
    isActive: (pathname: string) => pathname.startsWith('/dashboard/settings'),
  },
] as const

// サイドバーアクション項目定義（アイコンなし）
export const SIDEBAR_ACTION_CONFIG: SidebarMenuConfig[] = [
  {
    href: '/api/auth/logout',
    label: 'ログアウト',
    iconName: 'LogOut',
    requireAuth: true,
  },
] as const