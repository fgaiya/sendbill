import { useCallback, RefObject, useMemo } from 'react';

import { KEYBOARD_KEYS } from '../constants';
import { KeyboardEventHandler } from '../types';
import {
  getMenuItems,
  getFocusableElements,
  getNextIndex,
  getPreviousIndex,
} from '../utils';

/**
 * キーボードイベント処理フック
 * メニュー内のナビゲーションとボタンイベントを担当
 */
export const useKeyboardEvents = (
  isMenuOpen: boolean,
  onToggle: () => void,
  menuRef: RefObject<HTMLDivElement | null>
): {
  handleButtonKeyDown: KeyboardEventHandler;
  handleMenuKeyDown: KeyboardEventHandler;
} => {
  // ボタンのキーボードイベント
  const handleButtonKeyDown: KeyboardEventHandler = useCallback(
    (e) => {
      if (e.key === KEYBOARD_KEYS.ENTER || e.key === KEYBOARD_KEYS.SPACE) {
        e.preventDefault();
        onToggle();
      }
    },
    [onToggle]
  );

  // menuItems をキャッシュ
  const menuItems = useMemo(() => {
    if (!isMenuOpen || !menuRef.current) return [];
    return getMenuItems(menuRef.current);
  }, [isMenuOpen, menuRef]);

  // メニュー内のキーボードナビゲーション
  const handleMenuKeyDown: KeyboardEventHandler = useCallback(
    (e) => {
      if (!isMenuOpen) return;
      if (!menuRef.current) return;

      if (menuItems.length === 0) return;

      const currentIndex = menuItems.findIndex(
        (item) => item === document.activeElement
      );

      switch (e.key) {
        case KEYBOARD_KEYS.ARROW_DOWN: {
          e.preventDefault();
          const nextIndex = getNextIndex(currentIndex, menuItems.length);
          menuItems[nextIndex]?.focus();
          break;
        }

        case KEYBOARD_KEYS.ARROW_UP: {
          e.preventDefault();
          const prevIndex = getPreviousIndex(currentIndex, menuItems.length);
          menuItems[prevIndex]?.focus();
          break;
        }

        case KEYBOARD_KEYS.HOME:
          e.preventDefault();
          menuItems[0]?.focus();
          break;

        case KEYBOARD_KEYS.END:
          e.preventDefault();
          menuItems[menuItems.length - 1]?.focus();
          break;

        case KEYBOARD_KEYS.TAB: {
          // フォーカストラップ
          const focusableElements = getFocusableElements(menuRef.current);
          if (focusableElements.length === 0) break;
          if (focusableElements.length === 1) {
            e.preventDefault();
            break;
          }

          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
          break;
        }
      }
    },
    [isMenuOpen, menuRef, menuItems]
  );

  return {
    handleButtonKeyDown,
    handleMenuKeyDown,
  };
};
