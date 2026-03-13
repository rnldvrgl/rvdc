import { STALE_TIME } from "@/lib/constants/general"
import { User } from "@/lib/constants/interface"
import { useApiQuery } from "@/lib/hooks/useApiQuery"

export function useUserProfile() {
  return useApiQuery<User>({
    queryKey: ["user-profile"],
    url: "/users/profile/",
    staleTime: STALE_TIME.STATIC,
  })
}
