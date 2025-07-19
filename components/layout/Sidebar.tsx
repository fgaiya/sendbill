'use client'

import { useAuth } from '@clerk/nextjs'
import { useSidebar } from '@/lib/domains/navigation/contexts/SidebarContext'
import { SIDEBAR_MENU_ITEMS, SIDEBAR_ACTION_ITEMS } from '@/lib/domains/navigation/client'
import { SidebarContent } from './SidebarContent'
import type { SidebarProps } from '@/lib/domains/navigation/types'

export function Sidebar({ className }: SidebarProps) {
  const { isSignedIn } = useAuth()
  const sidebar = useSidebar()

  if (!isSignedIn) {
    return null
  }

  // 全メニュー項目がrequireAuth=trueかつisSignedIn=trueなのでフィルタリング不要
  const menuItems = SIDEBAR_MENU_ITEMS
  const actionItems = SIDEBAR_ACTION_ITEMS

  return (
    <div className="hidden lg:block">
      <SidebarContent
        isCollapsed={sidebar.isCollapsed}
        onToggle={sidebar.toggle}
        menuItems={menuItems}
        actionItems={actionItems}
        className={className}
      />
    </div>
  )
}