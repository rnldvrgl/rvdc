'use client'

import { AirconBrands } from '@/lib/constants/interface'
import { useApiMutation } from '@/lib/hooks/useApiMutation'
import api from '@/lib/utils/api'

export function useAirconBrandMutations() {
  const url = '/installations/aircon-brands/'

  const addBrand = useApiMutation({
    mutationFn: (data: Omit<AirconBrands, 'id'>) => api.post(url, data),
    successMessage: 'Brand created successfully.',
    invalidateQueries: [{ queryKey: ['aircon-brands'] }],
  })

  const updateBrand = useApiMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: Omit<AirconBrands, 'id'>
    }) => api.patch(`${url}${id}/`, data),
    successMessage: 'Brand updated successfully.',
    invalidateQueries: [{ queryKey: ['aircon-brands'] }],
  })

  const deleteBrand = useApiMutation({
    mutationFn: (id: number) => api.delete(`${url}${id}/`),
    successMessage: 'Brand deleted successfully.',
    invalidateQueries: [{ queryKey: ['aircon-brands'] }],
  })

  return { addBrand, updateBrand, deleteBrand }
}
