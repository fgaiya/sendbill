'use client'

import { useSidebar } from '@/lib/domains/navigation/contexts/SidebarContext'
import { cn } from '@/lib/shared/utils/ui'
import { APP_CONFIG } from '@/lib/shared/config'
import Footer from '@/components/layout/Footer'

interface DashboardContentProps {
  children: React.ReactNode
}

export function DashboardContent({ children }: DashboardContentProps) {
  const { isCollapsed } = useSidebar()

  return (
    <div className={cn(
      APP_CONFIG.ANIMATION.TRANSITION_ALL,
      // モバイル・タブレット（lg未満）: マージンなし
      // デスクトップ（lg以上）: サイドバー状態に応じてマージン調整
      isCollapsed ? APP_CONFIG.UI.SIDEBAR.COLLAPSED_MARGIN : APP_CONFIG.UI.SIDEBAR.EXPANDED_MARGIN
    )}>
      <main className="min-h-screen">
        <div className={APP_CONFIG.UI.LAYOUT.CONTENT_INNER_PADDING}>
          {children}
        </div>
      </main>
      <Footer />
    </div>
  )
}