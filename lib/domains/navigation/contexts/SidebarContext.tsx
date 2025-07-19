'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

import { SidebarContextType } from '../types'

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

const SIDEBAR_STORAGE_KEY = 'sendbill-sidebar-collapsed'

  // localStorage が利用可能かどうかをチェックするヘルパー関数
  const isLocalStorageAvailable = () => {
    try {
      const test = '__test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  }

interface SidebarProviderProps {
  children: React.ReactNode
}

export function SidebarProvider({ children }: SidebarProviderProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [storageAvailable] = useState(isLocalStorageAvailable())

  useEffect(() => {
    setMounted(true)

    if (!storageAvailable) return

    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY)
    if (stored !== null) {
      try {
        setIsCollapsed(JSON.parse(stored))
      } catch (error) {
        console.warn('Failed to parse sidebar state from localStorage:', error)
        localStorage.removeItem(SIDEBAR_STORAGE_KEY)
      }
    }
  }, [storageAvailable])

  // LocalStorage更新ヘルパー
  const updateStorage = useCallback((value: boolean) => {
    if (mounted && storageAvailable) {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(value))
    }
  }, [mounted, storageAvailable])

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