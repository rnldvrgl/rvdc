"use client"

import { useEffect, useState } from "react"

interface CalendarPreferences {
  weekStartsOn: 0 | 1 // 0 = Sunday, 1 = Monday
}

const DEFAULT_PREFERENCES: CalendarPreferences = {
  weekStartsOn: 1, // Default to Monday
}

const STORAGE_KEY = "calendar-preferences"

export const useCalendarPreferences = () => {
  const [preferences, setPreferences] =
    useState<CalendarPreferences>(DEFAULT_PREFERENCES)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as CalendarPreferences
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed })
      }
    } catch {
      // error is handled by mutation
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    if (!isLoaded) return

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
    } catch {
      // error is handled by mutation
    }
  }, [preferences, isLoaded])

  const updatePreferences = (updates: Partial<CalendarPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...updates }))
  }

  const setWeekStartsOn = (weekStartsOn: 0 | 1) => {
    updatePreferences({ weekStartsOn })
  }

  const resetPreferences = () => {
    setPreferences(DEFAULT_PREFERENCES)
  }

  return {
    preferences,
    isLoaded,
    setWeekStartsOn,
    updatePreferences,
    resetPreferences,
  }
}

export type { CalendarPreferences }
