'use client'

import { EntityState, useEntitySheetReturn } from '@/lib/constants/interface'
import { useState } from 'react'

export function useEntitySheetDialog<T>(): useEntitySheetReturn<T> {
  const [dialogState, setDialogState] = useState<EntityState<T>>({
    open: false,
    entity: undefined,
  })

  const openDialog = (entity?: T) => {
    setDialogState({ open: true, entity })
  }

  const closeDialog = () => {
    setDialogState({ open: false, entity: undefined })
  }

  const toggleDialog = () => {
    setDialogState((prev) => ({
      open: !prev.open,
      entity: prev.open ? undefined : prev.entity,
    }))
  }

  return {
    entityState: dialogState,
    openEntity: openDialog,
    closeEntity: closeDialog,
    toggleEntity: toggleDialog,
  }
}
