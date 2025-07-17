import { useEffect } from 'react'
import { OutsideClickConfig } from '../../domains/navigation/types'
import { isElementInContainer } from '../../domains/navigation/utils'

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