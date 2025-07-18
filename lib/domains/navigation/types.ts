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