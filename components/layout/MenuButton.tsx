import { forwardRef } from 'react';

import { Menu, X } from 'lucide-react';

import { A11Y_MESSAGES } from '@/lib/domains/navigation/constants';
import { BUTTON_CLASSES } from '@/lib/domains/navigation/styles';
import { KeyboardEventHandler } from '@/lib/domains/navigation/types';

interface MenuButtonProps {
  isOpen: boolean;
  onClick: () => void;
  onKeyDown: KeyboardEventHandler;
}

export const MenuButton = forwardRef<HTMLButtonElement, MenuButtonProps>(
  ({ isOpen, onClick, onKeyDown }, ref) => {
    return (
      <div className="md:hidden">
        <button
          ref={ref}
          onClick={onClick}
          onKeyDown={onKeyDown}
          className={BUTTON_CLASSES.MENU_TOGGLE}
          aria-label={
            isOpen
              ? A11Y_MESSAGES.MENU_CLOSE_LABEL
              : A11Y_MESSAGES.MENU_OPEN_LABEL
          }
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
          aria-haspopup="menu"
          id="mobile-menu-button"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
    );
  }
);

MenuButton.displayName = 'MenuButton';
