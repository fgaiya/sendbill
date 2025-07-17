import { useState, useCallback } from 'react'
import { MenuState } from '../types'
import { announceMenuToggle } from '../utils'

/**
 * メニュー状態管理フック
 */
export const useMenuState = (): MenuState => {
  const [isOpen, setIsOpen] = useState(false)

  const toggle = useCallback(() => {
    setIsOpen(prev => {
      const newState = !prev
      announceMenuToggle(newState)
      return newState
    })
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    announceMenuToggle(false)
  }, [])

  const open = useCallback(() => {
    setIsOpen(true)
    announceMenuToggle(true)
  }, [])

  return {
    isOpen,
    toggle,
    close,
    open,
  }
}