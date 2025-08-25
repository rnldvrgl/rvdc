import { useApiMutation } from '@/lib/hooks/useApiMutation'
import api from '@/lib/utils/api'

export function useAirconUnitStatusMutations() {
  const url = '/installations/aircon-units/'

  const claimSale = useApiMutation({
    mutationFn: (id: number) => api.patch(`${url}${id}/`, { sale: id }),
    successMessage: 'Unit marked as sold.',
    invalidateQueries: [{ queryKey: ['aircon-units'] }],
  })

  const claimInstallation = useApiMutation({
    mutationFn: (id: number) => api.patch(`${url}${id}/`, { installation: id }),
    successMessage: 'Unit marked as installed.',
    invalidateQueries: [{ queryKey: ['aircon-units'] }],
  })

  const reserveUnit = useApiMutation({
    mutationFn: (payload: { id: number; client_id: number }) =>
      api.patch(`${url}${payload.id}/`, { reserved_by: payload.client_id }),
    successMessage: 'Unit reserved.',
    invalidateQueries: [{ queryKey: ['aircon-units'] }],
  })

  const redeemCleaning = useApiMutation({
    mutationFn: (id: number) =>
      api.patch(`${url}${id}/`, { free_cleaning_redeemed: true }),
    successMessage: 'Free cleaning redeemed.',
    invalidateQueries: [{ queryKey: ['aircon-units'] }],
  })

  return { claimSale, claimInstallation, reserveUnit, redeemCleaning }
}
