export * from './hooks';
export * from './contexts/SidebarContext';
export * from './utils';

// lucide-reactアイコンマッピング
import {
  Home,
  LayoutDashboard,
  FileText,
  Users,
  Building,
  Receipt,
  Settings,
  LogOut,
} from 'lucide-react';

import { SIDEBAR_MENU_CONFIG, SIDEBAR_ACTION_CONFIG } from './constants';

import type { SidebarMenuItem, IconName } from './types';

const ICON_MAP: Record<
  IconName,
  React.ComponentType<{ className?: string }>
> = {
  Home,
  LayoutDashboard,
  FileText,
  Users,
  Building,
  Receipt,
  Settings,
  LogOut,
} as const;

// アイコン付きサイドバーメニュー項目
export const SIDEBAR_MENU_ITEMS: SidebarMenuItem[] = SIDEBAR_MENU_CONFIG.map(
  (item) => ({
    ...item,
    icon: ICON_MAP[item.iconName],
  })
);

// アイコン付きサイドバーアクション項目
export const SIDEBAR_ACTION_ITEMS: SidebarMenuItem[] =
  SIDEBAR_ACTION_CONFIG.map((item) => ({
    ...item,
    icon: ICON_MAP[item.iconName],
  }));
