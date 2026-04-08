import { STALE_TIME } from "@/lib/constants/general"
import { useApiQuery } from "@/lib/hooks/useApiQuery"
import { useQuery } from "@tanstack/react-query"

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

const GO2RTC_URL = process.env.NEXT_PUBLIC_GO2RTC_URL ?? ""

export function useGo2rtcStatus() {
  return useQuery<Go2rtcStatus>({
    queryKey: ["go2rtc-status"],
    queryFn: async (): Promise<Go2rtcStatus> => {
      if (!GO2RTC_URL) {
        return { running: false, streams: {}, stream_count: 0, error: "GO2RTC_URL not configured" }
      }
      try {
        // Fetch version/health
        const apiRes = await fetch(`${GO2RTC_URL}/api`, { signal: AbortSignal.timeout(5000) })
        if (!apiRes.ok) throw new Error(`HTTP ${apiRes.status}`)
        const apiData = await apiRes.json()

        // Fetch streams
        const streamsRes = await fetch(`${GO2RTC_URL}/api/streams`, { signal: AbortSignal.timeout(5000) })
        const streams = streamsRes.ok ? await streamsRes.json() : {}

        return {
          running: true,
          version: apiData?.version,
          streams,
          stream_count: Object.keys(streams).length,
        }
      } catch (err) {
        return {
          running: false,
          streams: {},
          stream_count: 0,
          error: err instanceof Error ? err.message : "Cannot reach go2rtc",
        }
      }
    },
    staleTime: STALE_TIME.DEFAULT,
    refetchInterval: 60_000,
  })
}
