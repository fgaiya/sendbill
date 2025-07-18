'use client'

import { useAuth } from '@clerk/nextjs'
import { useRef } from 'react'
import { Menu } from 'lucide-react'
import { cn } from '@/lib/shared/utils/ui'
import { useSidebarState } from '@/lib/domains/navigation/hooks'
import { useOutsideClick } from '@/lib/shared/hooks'
import { SIDEBAR_MENU_ITEMS, SIDEBAR_ACTION_ITEMS } from '@/lib/domains/navigation/client'
import { SIDEBAR_TOGGLE_CLASSES } from '@/lib/domains/navigation/styles'
import { MobileSidebar } from './MobileSidebar'
import { DesktopSidebar } from './DesktopSidebar'
import type { SidebarProps } from '@/lib/domains/navigation/types'

export function Sidebar({ className }: SidebarProps) {
  const { isSignedIn } = useAuth()
  const sidebar = useSidebarState()
  const mobileRef = useRef<HTMLDivElement>(null)

  useOutsideClick({
    refs: [mobileRef],
    isEnabled: sidebar.isMobileOpen,
    onOutsideClick: sidebar.closeMobile,
  })

  if (!isSignedIn) {
    return null
  }

  // 全メニュー項目がrequireAuth=trueかつisSignedIn=trueなのでフィルタリング不要
  const menuItems = SIDEBAR_MENU_ITEMS
  const actionItems = SIDEBAR_ACTION_ITEMS

  return (
    <>
      <MobileSidebar
        ref={mobileRef}
        isOpen={sidebar.isMobileOpen}
        onClose={sidebar.closeMobile}
        menuItems={menuItems}
        actionItems={actionItems}
      />

      <DesktopSidebar
        isCollapsed={sidebar.isCollapsed}
        onToggle={sidebar.toggle}
        menuItems={menuItems}
        actionItems={actionItems}
        className={className}
      />

      {/* モバイル版 - トグルボタン */}
      <button
        onClick={sidebar.toggleMobile}
        className={cn(
          SIDEBAR_TOGGLE_CLASSES.MOBILE_BUTTON,
          'fixed top-4 left-4 z-40'
        )}
        aria-label="メニューを開く"
      >
        <Menu className="w-6 h-6" />
      </button>
    </>
  )
}