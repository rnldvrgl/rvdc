'use client'

import { EntityState, useEntitySheetReturn } from '@/lib/constants/interface'
import { useState } from 'react'

export function useEntitySheet<T>(): useEntitySheetReturn<T> {
  const [entityState, setEntityState] = useState<EntityState<T>>({
    open: false,
    entity: undefined,
  })

  const openEntity = (entity?: T) => {
    setEntityState({ open: true, entity })
  }

  const closeEntity = () => {
    setEntityState({ open: false, entity: undefined })
  }

  const toggleEntity = () => {
    setEntityState((prev) => ({
      open: !prev.open,
      entity: prev.open ? undefined : prev.entity,
    }))
  }

  return { entityState, openEntity, closeEntity, toggleEntity }
}
