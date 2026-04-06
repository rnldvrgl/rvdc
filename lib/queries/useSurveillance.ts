import { STALE_TIME } from "@/lib/constants/general"
import { useApiQuery } from "@/lib/hooks/useApiQuery"

export interface CCTVCamera {
  id: number
  name: string
  uid?: string          // write-only on API, not returned
  username?: string     // write-only on API, not returned
  channel: number
  location: string
  notes: string
  is_active: boolean
  order: number
  stream_name: string
  created_at: string
  updated_at: string
}

export interface Go2rtcStatus {
  configured: boolean
  streams: Record<string, unknown>
  error?: string
}

export function useCCTVCameras() {
  return useApiQuery<CCTVCamera[]>({
    queryKey: ["cctv-cameras"],
    url: "/surveillance/cameras/",
    staleTime: STALE_TIME.DEFAULT,
  })
}

export function useGo2rtcStatus() {
  return useApiQuery<Go2rtcStatus>({
    queryKey: ["go2rtc-status"],
    url: "/surveillance/cameras/go2rtc-status/",
    staleTime: 10_000,
    refetchInterval: 30_000,
  })
}
