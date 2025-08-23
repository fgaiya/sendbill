'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useUser } from '@clerk/nextjs';

import { SIDEBAR_MENU_CONFIG } from '@/lib/domains/navigation/constants';
import {
  NAV_LINK_BASE_CLASSES,
  NAV_LINK_STATE_CLASSES,
} from '@/lib/domains/navigation/styles';
import { NavigationProps } from '@/lib/domains/navigation/types';

export default function Navigation({ isMobile = false }: NavigationProps) {
  const { isSignedIn } = useUser();
  const pathname = usePathname();

  const visibleItems = SIDEBAR_MENU_CONFIG.filter(
    (item) => !item.requireAuth || isSignedIn
  );

  const baseClasses = isMobile
    ? NAV_LINK_BASE_CLASSES.MOBILE
    : NAV_LINK_BASE_CLASSES.DESKTOP;

  // 最長一致でACTIVE状態を決定（親子パス重複回避）
  const activeHref = visibleItems
    .filter(
      (item) => pathname === item.href || pathname.startsWith(item.href + '/')
    )
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <nav className={isMobile ? 'space-y-1' : 'flex space-x-4'}>
      {visibleItems.map((item) => {
        const isActive = item.href === activeHref;
        const stateClasses = isActive
          ? NAV_LINK_STATE_CLASSES.ACTIVE
          : NAV_LINK_STATE_CLASSES.INACTIVE;
        const classes = `${baseClasses} ${stateClasses}`;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={classes}
            aria-current={isActive ? 'page' : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
