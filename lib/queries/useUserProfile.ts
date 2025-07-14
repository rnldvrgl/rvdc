import { User } from '@/lib/constants/interface'
import { useApiQuery } from '@/lib/hooks/useApiQuery'

export function useUserProfile() {
  return useApiQuery<User>({
    queryKey: ['user-profile'],
    url: '/users/profile/',
    staleTime: 1000 * 60 * 60 * 24,
  })
}
