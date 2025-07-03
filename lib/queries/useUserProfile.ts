import { User } from '@/lib/constants/interface'
import { useApiQuery } from '@/lib/hooks/useApiQuery'

export function useUserProfile() {
  return useApiQuery<User>(['user-profile'], '/users/profile/', undefined, {
    staleTime: 1000 * 60 * 60 * 24,
  })
}
