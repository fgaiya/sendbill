'use client'

import { forwardRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/shared/utils/ui'
import { SIDEBAR_BASE_CLASSES, SIDEBAR_STATE_CLASSES, SIDEBAR_TOGGLE_CLASSES } from '@/lib/domains/navigation/styles'
import { SidebarItem } from './SidebarItem'
import type { SidebarMenuItem } from '@/lib/domains/navigation/types'

interface MobileSidebarProps {
  isOpen: boolean
  onClose: () => void
  menuItems: SidebarMenuItem[]
  actionItems: SidebarMenuItem[]
}

export const MobileSidebar = forwardRef<HTMLDivElement, MobileSidebarProps>(
  ({ isOpen, onClose, menuItems, actionItems }, ref) => {
    if (!isOpen) return null

    return (
      <div className={SIDEBAR_BASE_CLASSES.MOBILE_OVERLAY}>
        <div
          ref={ref}
          className={cn(
            SIDEBAR_BASE_CLASSES.MOBILE_PANEL,
            SIDEBAR_STATE_CLASSES.MOBILE_OPEN
          )}
        >
          {/* モバイルヘッダー */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">メニュー</h2>
            <button
              onClick={onClose}
              className={SIDEBAR_TOGGLE_CLASSES.MOBILE_BUTTON}
              aria-label="メニューを閉じる"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* モバイルメニュー */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            {menuItems.map((item) => (
              <SidebarItem
                key={item.href}
                item={item}
                isCollapsed={false}
                className="w-full"
              />
            ))}
          </nav>

          {/* モバイルアクション */}
          {actionItems.length > 0 && (
            <div className="px-4 py-4 border-t border-gray-200 space-y-1">
              {actionItems.map((item) => (
                <SidebarItem
                  key={item.href}
                  item={item}
                  isCollapsed={false}
                  className="w-full"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }
)

MobileSidebar.displayName = 'MobileSidebar'