"use client"

import { useCallback, useSyncExternalStore } from "react"

const STORAGE_KEY = "sidebar-collapsed"

// In-memory fallback for SSR
let memoryValue = false

function getSnapshot(): boolean {
  if (typeof window === "undefined") return false
  try {
    return localStorage.getItem(STORAGE_KEY) === "true"
  } catch {
    return memoryValue
  }
}

function getServerSnapshot(): boolean {
  return false
}

const listeners = new Set<() => void>()

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function notify() {
  listeners.forEach((cb) => cb())
}

export function useSidebarCollapse() {
  const collapsed = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  )

  const setCollapsed = useCallback((value: boolean) => {
    memoryValue = value
    try {
      localStorage.setItem(STORAGE_KEY, String(value))
    } catch {
      // ignore
    }
    notify()
  }, [])

  const toggle = useCallback(() => {
    setCollapsed(!getSnapshot())
  }, [setCollapsed])

  return { collapsed, setCollapsed, toggle }
}
