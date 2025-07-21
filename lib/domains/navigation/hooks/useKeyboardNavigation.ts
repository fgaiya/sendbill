import { FocusManagement } from '../types';

import { useEscapeHandler } from './useEscapeHandler';
import { useFocusManagement } from './useFocusManagement';
import { useKeyboardEvents } from './useKeyboardEvents';

/**
 * キーボードナビゲーションフック
 * 複数の専用フックを組み合わせた統合インターフェース
 */
export const useKeyboardNavigation = (
  isMenuOpen: boolean,
  onToggle: () => void,
  onClose: () => void
): FocusManagement => {
  // フォーカス管理
  const { menuRef, buttonRef } = useFocusManagement(isMenuOpen);

  // キーボードイベント処理
  const { handleButtonKeyDown, handleMenuKeyDown } = useKeyboardEvents(
    isMenuOpen,
    onToggle,
    menuRef
  );

  // エスケープキー処理
  useEscapeHandler(isMenuOpen, onClose, buttonRef);

  return {
    menuRef,
    buttonRef,
    handleMenuKeyDown,
    handleButtonKeyDown,
  };
};
