'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { SidebarContextType } from '../types'

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

const SIDEBAR_STORAGE_KEY = 'sendbill-sidebar-collapsed'

interface SidebarProviderProps {
  children: React.ReactNode
}

export function SidebarProvider({ children }: SidebarProviderProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY)
    if (stored !== null) {
      setIsCollapsed(JSON.parse(stored))
    }
  }, [])

  // LocalStorage更新ヘルパー
  const updateStorage = useCallback((value: boolean) => {
    if (mounted) {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(value))
    }
  }, [mounted])

  const toggle = useCallback(() => {
    setIsCollapsed(prev => {
      const newState = !prev
      updateStorage(newState)
      return newState
    })
  }, [updateStorage])

  const collapse = useCallback(() => {
    setIsCollapsed(true)
    updateStorage(true)
  }, [updateStorage])

  const expand = useCallback(() => {
    setIsCollapsed(false)
    updateStorage(false)
  }, [updateStorage])

  const toggleMobile = useCallback(() => {
    setIsMobileOpen(prev => !prev)
  }, [])

  const closeMobile = useCallback(() => {
    setIsMobileOpen(false)
  }, [])

  const value: SidebarContextType = {
    isCollapsed,
    isMobileOpen,
    toggle,
    collapse,
    expand,
    toggleMobile,
    closeMobile,
  }

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar(): SidebarContextType {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}