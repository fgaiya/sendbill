'use client'

import { useAuth, UserButton } from '@clerk/nextjs'
import Link from "next/link"
import { Navigation } from '@/components/domains/navigation'
import { MenuButton } from './MenuButton'
import { MobileMenu } from './MobileMenu'
import { useMenuState, useKeyboardNavigation } from '@/lib/domains/navigation/hooks'
import { useOutsideClick } from '@/lib/shared/hooks'
import { BUTTON_CLASSES } from '@/lib/domains/navigation/styles'

export default function Header() {
  const { isSignedIn } = useAuth()
  const menu = useMenuState()
  const { menuRef, buttonRef, handleMenuKeyDown, handleButtonKeyDown } = useKeyboardNavigation(
    menu.isOpen,
    menu.toggle,
    menu.close
  )

  // 外部クリック検出
  useOutsideClick({
    refs: [menuRef, buttonRef],
    isEnabled: menu.isOpen,
    onOutsideClick: menu.close,
  })

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* ロゴ・ブランド */}
          <div className="flex-shrink-0">
            <Link 
              href="/" 
              className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
            >
              SendBill
            </Link>
          </div>

          {/* デスクトップナビゲーション */}
          <div className="hidden md:block">
            <Navigation />
          </div>

          {/* デスクトップ認証エリア */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {isSignedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className={BUTTON_CLASSES.SECONDARY}
                >
                  ダッシュボード
                </Link>
                <UserButton />
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className={BUTTON_CLASSES.SECONDARY}
                >
                  ログイン
                </Link>
                <Link
                  href="/sign-up"
                  className={BUTTON_CLASSES.PRIMARY}
                >
                  新規登録
                </Link>
              </>
            )}
          </div>

          {/* モバイルメニューボタン */}
          <MenuButton
            ref={buttonRef}
            isOpen={menu.isOpen}
            onClick={menu.toggle}
            onKeyDown={handleButtonKeyDown}
          />
        </div>

        {/* モバイルメニュー */}
        <MobileMenu
          ref={menuRef}
          isOpen={menu.isOpen}
          onClose={menu.close}
          onKeyDown={handleMenuKeyDown}
        />
      </div>
    </header>
  )
}