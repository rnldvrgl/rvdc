import { STALE_TIME } from "@/lib/constants/general"
import { useApiQuery } from "@/lib/hooks/useApiQuery"

export interface CCTVCamera {
  id: number
  name: string
  // stream_url is write-only on the API — not returned in responses
  location: string
  notes: string
  is_active: boolean
  order: number
  stream_name: string
  created_at: string
  updated_at: string
}

export interface Go2rtcStatus {
  running: boolean
  version?: string
  streams: Record<string, unknown>
  stream_count: number
  error?: string
}

export function useCCTVCameras() {
  return useApiQuery<CCTVCamera[]>({
    queryKey: ["cctv-cameras"],
    url: "/surveillance/cameras/",
    staleTime: STALE_TIME.STATIC,
  })
}

export function useGo2rtcStatus() {
  return useApiQuery<Go2rtcStatus>({
    queryKey: ["go2rtc-status"],
    url: "/surveillance/cameras/go2rtc-status/",
    staleTime: STALE_TIME.DEFAULT,
    refetchInterval: 60_000,
  })
}
