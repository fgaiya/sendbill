'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

import { isLocalStorageAvailable } from '@/lib/shared/utils/storage'

import { SidebarContextType } from '../types'

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

const SIDEBAR_STORAGE_KEY = 'sendbill-sidebar-collapsed'

interface SidebarProviderProps {
  children: React.ReactNode
}

export function SidebarProvider({ children }: SidebarProviderProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [storageAvailable] = useState(isLocalStorageAvailable())

  useEffect(() => {
    let isMounted = true

    if (!storageAvailable) return

    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY)
    if (stored !== null && isMounted) {
      try {
        setIsCollapsed(JSON.parse(stored))
      } catch (error) {
        console.warn('Failed to parse sidebar state from localStorage:', error)
        localStorage.removeItem(SIDEBAR_STORAGE_KEY)
      }
    }

    return () => {
      isMounted = false
    }
  }, [storageAvailable])

  // LocalStorage更新ヘルパー
  const updateStorage = useCallback((value: boolean) => {
    if (storageAvailable) {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(value))
    }
  }, [storageAvailable])

  const toggle = useCallback(() => {
    setIsCollapsed(prev => {
      const newState = !prev
      updateStorage(newState)
      return newState
    })
  }, [updateStorage])

  const collapse = useCallback(() => {
    setIsCollapsed(() => {
      updateStorage(true)
      return true
    })
  }, [updateStorage])

  const expand = useCallback(() => {
    setIsCollapsed(() => {
      updateStorage(false)
      return false
    })
  }, [updateStorage])


  const value: SidebarContextType = {
    isCollapsed,
    toggle,
    collapse,
    expand,
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