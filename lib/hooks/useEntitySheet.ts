'use client'

import {
  EntitySheetState,
  UseEntitySheetReturn,
} from '@/lib/constants/interface'
import { useState } from 'react'

export function useEntitySheet<T>(): UseEntitySheetReturn<T> {
  const [sheetState, setSheetState] = useState<EntitySheetState<T>>({
    open: false,
    entity: undefined,
  })

  const openSheet = (entity?: T) => {
    setSheetState({ open: true, entity })
  }

  const closeSheet = () => {
    setSheetState({ open: false, entity: undefined })
  }

  const toggleSheet = () => {
    setSheetState((prev) => ({
      open: !prev.open,
      entity: prev.open ? undefined : prev.entity,
    }))
  }

  return { sheetState, openSheet, closeSheet, toggleSheet }
}
