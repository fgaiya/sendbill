'use client'

import { useAuth } from '@clerk/nextjs'
import Link from "next/link"
import { usePathname } from 'next/navigation'

interface NavigationProps {
  isMobile?: boolean
}

const navigationItems = [
  { href: '/', label: 'ホーム', requireAuth: false },
  { href: '/dashboard', label: 'ダッシュボード', requireAuth: true },
  { href: '/invoices', label: '請求書', requireAuth: true },
  { href: '/clients', label: 'クライアント', requireAuth: true },
  { href: '/quotes', label: '見積書', requireAuth: true },
]

export default function Navigation({ isMobile = false }: NavigationProps) {
  const { isSignedIn } = useAuth()
  const pathname = usePathname()

  const visibleItems = navigationItems.filter(item => 
    !item.requireAuth || isSignedIn
  )

  const baseClasses = isMobile 
    ? "block px-3 py-2 rounded-md text-base font-medium transition-colors"
    : "px-3 py-2 rounded-md text-sm font-medium transition-colors"

  return (
    <nav className={isMobile ? "space-y-1" : "flex space-x-4"}>
      {visibleItems.map((item) => {
        const isActive = pathname === item.href
        const classes = `${baseClasses} ${
          isActive
            ? "bg-blue-100 text-blue-900"
            : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
        }`

        return (
          <Link
            key={item.href}
            href={item.href}
            className={classes}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}