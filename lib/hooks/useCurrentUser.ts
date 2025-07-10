import useUserProfileStore from '@/lib/store/useUserProfileStore'

export const useCurrentUser = () => {
  const userProfile = useUserProfileStore((state) => state.userProfile)
  return {
    userProfile,
    role: userProfile?.role,
    assigned_stall: userProfile?.assigned_stall,
    first_name: userProfile?.first_name,
    last_name: userProfile?.last_name,
  }
}
