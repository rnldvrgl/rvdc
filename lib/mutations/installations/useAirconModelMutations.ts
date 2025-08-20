'use client'

import { AirconModels } from '@/lib/constants/interface'
import { useApiMutation } from '@/lib/hooks/useApiMutation'
import api from '@/lib/utils/api'

export function useAirconModelMutations() {
  const url = '/installations/aircon-models/'

  const addModel = useApiMutation({
    mutationFn: (data: Omit<AirconModels, 'id'>) => api.post(url, data),
    successMessage: 'Model created successfully.',
    invalidateQueries: [{ queryKey: ['aircon-models'] }],
  })

  const updateModel = useApiMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: Partial<Omit<AirconModels, 'id'>>
    }) => api.patch(`${url}${id}/`, data),
    successMessage: 'Model updated successfully.',
    invalidateQueries: [{ queryKey: ['aircon-models'] }],
  })

  const deleteModel = useApiMutation({
    mutationFn: (id: number) => api.delete(`${url}${id}/`),
    successMessage: 'Model deleted successfully.',
    invalidateQueries: [{ queryKey: ['aircon-models'] }],
  })

  return { addModel, updateModel, deleteModel }
}
