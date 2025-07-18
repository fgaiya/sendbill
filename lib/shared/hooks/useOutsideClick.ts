import { useEffect } from 'react'
import { OutsideClickConfig } from '../../domains/navigation/types'

/**
 * 要素が指定されたコンテナ内に含まれているかチェック
 */
const isElementInContainer = (element: Node | null, container: HTMLElement | null): boolean => {
  return !!(container && element && container.contains(element))
}

/**
 * 外部クリック検出フック
 */
export const useOutsideClick = ({ refs, isEnabled, onOutsideClick }: OutsideClickConfig): void => {
  useEffect(() => {
    if (!isEnabled) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const isInsideAnyRef = refs.some(ref => isElementInContainer(target, ref.current))
      
      if (!isInsideAnyRef) {
        onOutsideClick()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [refs, isEnabled, onOutsideClick])
}