import { useEffect, RefObject } from 'react';

import { KEYBOARD_KEYS } from '../constants';

/**
 * エスケープキー処理フック
 * Escapeキーでメニューを閉じる機能を担当
 */
export const useEscapeHandler = (
  isMenuOpen: boolean,
  onClose: () => void,
  buttonRef: RefObject<HTMLButtonElement | null>
) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === KEYBOARD_KEYS.ESCAPE && isMenuOpen) {
        onClose();
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMenuOpen, onClose, buttonRef]);
};
