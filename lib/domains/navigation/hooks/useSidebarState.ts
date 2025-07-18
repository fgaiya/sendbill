import { useSidebar } from '../contexts/SidebarContext'
import type { SidebarState } from '../types'

export const useSidebarState = (): SidebarState => {
  return useSidebar()
}