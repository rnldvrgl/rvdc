"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, VideoOff } from "lucide-react"

interface HlsPlayerProps {
  src: string
  className?: string
}

const MAX_RETRIES = 12
const RETRY_DELAY_MS = 3000

export function HlsPlayer({ src, className }: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const retryCount = useRef(0)
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return

    setError(false)
    setLoading(true)
    retryCount.current = 0

    let hls: import("hls.js").default | null = null

    const init = async () => {
      hls?.destroy()
      hls = null

      const Hls = (await import("hls.js")).default

      if (Hls.isSupported()) {
        hls = new Hls({
          liveSyncDurationCount: 2,
          liveMaxLatencyDurationCount: 6,
          lowLatencyMode: false,
          maxBufferLength: 10,
          maxMaxBufferLength: 20,
          fragLoadingTimeOut: 20000,
          manifestLoadingTimeOut: 20000,
        })
        hls.loadSource(src)
        hls.attachMedia(video)
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          retryCount.current = 0
          setLoading(false)
          video.play().catch(() => {})
        })
        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (data.fatal) {
            hls?.destroy()
            hls = null
            if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              // Recoverable media error — just reinit
            }
            if (retryCount.current < MAX_RETRIES) {
              retryCount.current++
              retryTimer.current = setTimeout(init, RETRY_DELAY_MS)
            } else {
              setError(true)
              setLoading(false)
            }
          }
        })
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Native HLS (Safari)
        video.src = src
        video.addEventListener("loadedmetadata", () => {
          setLoading(false)
          video.play().catch(() => {})
        })
        video.addEventListener("error", () => {
          setError(true)
          setLoading(false)
        })
      } else {
        setError(true)
        setLoading(false)
      }
    }

    init()

    return () => {
      if (retryTimer.current) clearTimeout(retryTimer.current)
      hls?.destroy()
      if (video) {
        video.src = ""
        video.load()
      }
    }
  }, [src])

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center gap-2 bg-black text-white/50 ${className}`}>
        <VideoOff className="size-8" />
        <span className="text-xs">Stream unavailable</span>
      </div>
    )
  }

  return (
    <div className={`relative bg-black ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <Loader2 className="size-6 text-white/50 animate-spin" />
        </div>
      )}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        muted
        playsInline
        autoPlay
      />
    </div>
  )
}
