'use client'

import { useSidebar } from '@/lib/domains/navigation/contexts/SidebarContext'
import { cn } from '@/lib/shared/utils/ui'
import Footer from '@/components/layout/Footer'

interface DashboardContentProps {
  children: React.ReactNode
}

export function DashboardContent({ children }: DashboardContentProps) {
  const { isCollapsed } = useSidebar()

  return (
    <div className={cn(
      'transition-all duration-300 ease-in-out',
      // モバイル・タブレット（lg未満）: マージンなし
      // デスクトップ（lg以上）: サイドバー状態に応じてマージン調整
      isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
    )}>
      <main className="min-h-screen">
        <div className="p-6">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  )
}