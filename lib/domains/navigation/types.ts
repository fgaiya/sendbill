// メニュー状態の型定義
export interface MenuState {
  isOpen: boolean
  toggle: () => void
  close: () => void
  open: () => void
}

// キーボードイベントハンドラーの型
export type KeyboardEventHandler = (event: React.KeyboardEvent) => void

// フォーカス管理フックの戻り値型
export interface FocusManagement {
  menuRef: React.RefObject<HTMLDivElement | null>
  buttonRef: React.RefObject<HTMLButtonElement | null>
  handleMenuKeyDown: KeyboardEventHandler
  handleButtonKeyDown: KeyboardEventHandler
}

// 外部クリック検出フックの設定型
export interface OutsideClickConfig {
  refs: React.RefObject<HTMLElement | null>[]
  isEnabled: boolean
  onOutsideClick: () => void
}

// ナビゲーション項目の型
export interface NavigationItem {
  href: string
  label: string
  requireAuth: boolean
}

// ナビゲーションコンポーネントのプロパティ型
export interface NavigationProps {
  isMobile?: boolean
}

// サイドバー状態の型定義
export interface SidebarState {
  isCollapsed: boolean
  isMobileOpen: boolean
  toggle: () => void
  collapse: () => void
  expand: () => void
  toggleMobile: () => void
  closeMobile: () => void
}

// サイドバーコンテキストの型
export type SidebarContextType = SidebarState

// アイコン名の型定義
export type IconName = 'LayoutDashboard' | 'FileText' | 'Users' | 'Receipt' | 'Settings' | 'LogOut'

// サイドバーメニュー設定の型
export interface SidebarMenuConfig {
  href: string
  label: string
  iconName: IconName
  requireAuth: boolean
  isActive?: (pathname: string) => boolean
}

// サイドバーメニュー項目の型
export interface SidebarMenuItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  requireAuth: boolean
  isActive?: (pathname: string) => boolean
}

// サイドバーコンポーネントのプロパティ型
export interface SidebarProps {
  className?: string
}

// サイドバーアイテムコンポーネントのプロパティ型
export interface SidebarItemProps {
  item: SidebarMenuItem
  isCollapsed: boolean
  className?: string
}

// アクセシビリティ属性の型
export interface AccessibilityAttributes {
  'aria-expanded'?: boolean
  'aria-controls'?: string
  'aria-haspopup'?: 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog' | true | false
  'aria-labelledby'?: string
  'aria-current'?: 'page' | 'step' | 'location' | 'date' | 'time' | true | false
  role?: string
  tabIndex?: number
}