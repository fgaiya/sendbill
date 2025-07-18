import { forwardRef } from 'react'
import { useAuth, UserButton } from '@clerk/nextjs'
import Link from "next/link"
import { Navigation } from '@/components/domains/navigation'
import { KeyboardEventHandler } from '@/lib/domains/navigation/types'
import { FOCUS_RING_CLASSES } from '@/lib/domains/navigation/styles'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  onKeyDown: KeyboardEventHandler
}

export const MobileMenu = forwardRef<HTMLDivElement, MobileMenuProps>(
  ({ isOpen, onClose, onKeyDown }, ref) => {
    const { isSignedIn } = useAuth()

    if (!isOpen) return null

    return (
      <div 
        ref={ref}
        className="md:hidden border-t border-gray-200 pt-4 pb-3"
        id="mobile-menu"
        role="menu"
        aria-orientation="vertical"
        aria-labelledby="mobile-menu-button"
        onKeyDown={onKeyDown}
      >
        <div className="space-y-1">
          <Navigation isMobile />
          <div className="pt-4 border-t border-gray-200 mt-4">
            {isSignedIn ? (
              <div className="flex items-center justify-between px-4">
                <Link
                  href="/dashboard"
                  className={`text-gray-700 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium ${FOCUS_RING_CLASSES}`}
                  onClick={onClose}
                  role="menuitem"
                  data-menu-item="true"
                  tabIndex={0}
                >
                  ダッシュボード
                </Link>
                <UserButton />
              </div>
            ) : (
              <div className="space-y-2 px-4">
                <Link
                  href="/sign-in"
                  className={`text-gray-700 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium ${FOCUS_RING_CLASSES}`}
                  onClick={onClose}
                  role="menuitem"
                  data-menu-item="true"
                  tabIndex={0}
                >
                  ログイン
                </Link>
                <Link
                  href="/sign-up"
                  className={`bg-blue-600 hover:bg-blue-700 text-white block px-3 py-2 rounded-md text-base font-medium text-center transition-colors ${FOCUS_RING_CLASSES}`}
                  onClick={onClose}
                  role="menuitem"
                  data-menu-item="true"
                  tabIndex={0}
                >
                  新規登録
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }
)

MobileMenu.displayName = 'MobileMenu'