import { useRef, useEffect } from 'react'

import { getMenuItems } from '../utils'

/**
 * フォーカス管理フック
 * メニューの開閉時のフォーカス制御を担当
 */
export const useFocusManagement = (isMenuOpen: boolean) => {
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // メニュー開閉時のフォーカス管理
  useEffect(() => {
    if (isMenuOpen) {
      const firstMenuItem = getMenuItems(menuRef.current)[0]
      firstMenuItem?.focus()
    }
  }, [isMenuOpen])

  return {
    menuRef,
    buttonRef,
  }
}