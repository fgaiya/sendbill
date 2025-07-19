'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

import { 
  SIDEBAR_BASE_CLASSES, 
  SIDEBAR_STATE_CLASSES, 
  SIDEBAR_TOGGLE_CLASSES 
} from '@/lib/domains/navigation/styles'
import type { SidebarMenuItem } from '@/lib/domains/navigation/types'
import { cn } from '@/lib/shared/utils/ui'

import { SidebarItem } from './SidebarItem'


interface SidebarContentProps {
  isCollapsed: boolean
  onToggle: () => void
  menuItems: SidebarMenuItem[]
  actionItems: SidebarMenuItem[]
  className?: string
}

export function SidebarContent({ 
  isCollapsed, 
  onToggle, 
  menuItems, 
  actionItems, 
  className 
}: SidebarContentProps) {
  return (
    <aside
      className={cn(
        SIDEBAR_BASE_CLASSES.SIDEBAR,
        SIDEBAR_BASE_CLASSES.CONTAINER,
        isCollapsed 
          ? SIDEBAR_STATE_CLASSES.COLLAPSED 
          : SIDEBAR_STATE_CLASSES.EXPANDED,
        className
      )}
    >
      {/* サイドバーヘッダー */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
        {!isCollapsed && (
          <h2 className="text-lg font-semibold text-gray-900">SendBill</h2>
        )}
        <button
          onClick={onToggle}
          className={SIDEBAR_TOGGLE_CLASSES.BUTTON}
          aria-label={isCollapsed ? 'サイドバーを展開' : 'サイドバーを折りたたむ'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* メインメニュー */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {menuItems.map((item) => (
          <SidebarItem
            key={item.href}
            item={item}
            isCollapsed={isCollapsed}
          />
        ))}
      </nav>

      {/* アクションメニュー */}
      {actionItems.length > 0 && (
        <div className="px-3 py-4 border-t border-gray-200 space-y-1">
          {actionItems.map((item) => (
            <SidebarItem
              key={item.href}
              item={item}
              isCollapsed={isCollapsed}
            />
          ))}
        </div>
      )}
    </aside>
  )
}