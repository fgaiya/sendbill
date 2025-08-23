'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAuth } from '@clerk/nextjs';

import {
  NAV_LINK_BASE_CLASSES,
  NAV_LINK_STATE_CLASSES,
} from '@/lib/domains/navigation/styles';
import {
  NavigationProps,
  NavigationItem,
} from '@/lib/domains/navigation/types';

const navigationItems: NavigationItem[] = [
  { href: '/', label: 'ホーム', requireAuth: false },
  { href: '/dashboard', label: 'ダッシュボード', requireAuth: true },
  { href: '/dashboard/clients', label: '顧客管理', requireAuth: true },
  { href: '/dashboard/documents', label: '帳票管理', requireAuth: true },
  { href: '/dashboard/settings', label: '設定', requireAuth: true },
];

export default function Navigation({ isMobile = false }: NavigationProps) {
  const { isSignedIn } = useAuth();
  const pathname = usePathname();

  const visibleItems = navigationItems.filter(
    (item) => !item.requireAuth || isSignedIn
  );

  const baseClasses = isMobile
    ? NAV_LINK_BASE_CLASSES.MOBILE
    : NAV_LINK_BASE_CLASSES.DESKTOP;

  return (
    <nav className={isMobile ? 'space-y-1' : 'flex space-x-4'}>
      {visibleItems.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(item.href + '/');
        const stateClasses = isActive
          ? NAV_LINK_STATE_CLASSES.ACTIVE
          : NAV_LINK_STATE_CLASSES.INACTIVE;
        const classes = `${baseClasses} ${stateClasses}`;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={classes}
            role={isMobile ? 'menuitem' : undefined}
            data-menu-item={isMobile ? 'true' : undefined}
            tabIndex={isMobile ? 0 : undefined}
            aria-current={isActive ? 'page' : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
