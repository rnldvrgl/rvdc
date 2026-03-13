import { EntityState, useEntitySheetReturn } from '@/lib/constants/interface'
import { useState } from 'react'

export function useEntitySheet<T>(
  beforeClose?: () => boolean | Promise<boolean>,
): useEntitySheetReturn<T> {
  const [entityState, setEntityState] = useState<EntityState<T>>({
    open: false,
    entity: undefined,
  })

  const openEntity = (entity?: T) => {
    setEntityState({ open: true, entity })
  }

  const closeEntity = async () => {
    if (beforeClose) {
      const result = await beforeClose()
      if (!result) return
    }
    setEntityState({ open: false, entity: undefined })
  }

  const toggleEntity = (entity?: T) => {
    if (entityState.open) {
      void closeEntity()
    } else {
      openEntity(entity)
    }
  }

  return { entityState, openEntity, closeEntity, toggleEntity }
}
