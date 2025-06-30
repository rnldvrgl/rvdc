import api from '@/lib/utils/api'
import { useQuery } from '@tanstack/react-query'

export function useUserProfile() {
  return useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const res = await api.get(`/users/profile/`)
      return res.data
    },
    staleTime: 1000 * 60 * 60 * 24,
  })
}
