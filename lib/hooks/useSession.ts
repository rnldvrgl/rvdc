import api from "@/lib/utils/api"
import { useQuery } from "@tanstack/react-query"

export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const res = await api.get("/auth/me/")
      return res.data
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  })
}
