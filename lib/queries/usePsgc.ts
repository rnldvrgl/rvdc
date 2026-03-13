import { STALE_TIME } from "@/lib/constants/general"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"

const API_BASE = "https://psgc.gitlab.io/api"

export function useProvinces() {
  return useQuery({
    queryKey: ["provinces"],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE}/provinces/`)
      return res.data
    },
    staleTime: STALE_TIME.IMMUTABLE,
  })
}

export function useCities(provinceCode: string | null) {
  return useQuery({
    queryKey: ["cities", provinceCode],
    queryFn: async () => {
      if (!provinceCode) return []
      const res = await axios.get(
        `${API_BASE}/provinces/${provinceCode}/cities-municipalities/`,
      )
      return res.data
    },
    enabled: !!provinceCode,
    staleTime: STALE_TIME.IMMUTABLE,
  })
}

export function useBarangays(cityCode: string | null) {
  return useQuery({
    queryKey: ["barangays", cityCode],
    queryFn: async () => {
      if (!cityCode) return []
      const res = await axios.get(
        `${API_BASE}/cities-municipalities/${cityCode}/barangays/`,
      )
      return res.data
    },
    enabled: !!cityCode,
    staleTime: STALE_TIME.IMMUTABLE,
  })
}
