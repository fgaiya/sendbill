'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/shared/utils/ui'
import { SIDEBAR_ITEM_CLASSES } from '@/lib/domains/navigation/styles'
import type { SidebarItemProps } from '@/lib/domains/navigation/types'

export function SidebarItem({ item, isCollapsed, className }: SidebarItemProps) {
  const pathname = usePathname()
  const isActive = item.isActive ? item.isActive(pathname) : pathname === item.href
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      className={cn(
        SIDEBAR_ITEM_CLASSES.BASE,
        isActive ? SIDEBAR_ITEM_CLASSES.ACTIVE : SIDEBAR_ITEM_CLASSES.INACTIVE,
        className
      )}
      aria-current={isActive ? 'page' : undefined}
      title={isCollapsed ? item.label : undefined}
    >
      <div className={SIDEBAR_ITEM_CLASSES.ICON_WRAPPER}>
        <Icon className="w-6 h-6" />
      </div>
      <span
        className={cn(
          SIDEBAR_ITEM_CLASSES.LABEL,
          isCollapsed 
            ? SIDEBAR_ITEM_CLASSES.LABEL_COLLAPSED 
            : SIDEBAR_ITEM_CLASSES.LABEL_EXPANDED
        )}
      >
        {item.label}
      </span>
    </Link>
  )
}