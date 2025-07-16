'use client'

import { useAuth, UserButton } from '@clerk/nextjs'
import Link from "next/link"
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import Navigation from './Navigation'

export default function Header() {
  const { isSignedIn } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  ダッシュボード
                </Link>
                <UserButton />
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  ログイン
                </Link>
                <Link
                  href="/sign-up"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  新規登録
                </Link>
              </>
            )}
          </div>

          {/* モバイルメニューボタン */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-700 hover:text-gray-900 p-2 rounded-md transition-colors"
              aria-label="メニュー"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* モバイルメニュー */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 pt-4 pb-3">
            <div className="space-y-1">
              <Navigation isMobile />
              <div className="pt-4 border-t border-gray-200 mt-4">
                {isSignedIn ? (
                  <div className="flex items-center justify-between px-4">
                    <Link
                      href="/dashboard"
                      className="text-gray-700 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      ダッシュボード
                    </Link>
                    <UserButton />
                  </div>
                ) : (
                  <div className="space-y-2 px-4">
                    <Link
                      href="/sign-in"
                      className="text-gray-700 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      ログイン
                    </Link>
                    <Link
                      href="/sign-up"
                      className="bg-blue-600 hover:bg-blue-700 text-white block px-3 py-2 rounded-md text-base font-medium text-center transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      新規登録
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}