"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { VideoOff, RefreshCw } from "lucide-react"

interface HlsPlayerProps {
  src: string
  className?: string
}

const MAX_RETRIES = 10
const RETRY_DELAY_MS = 3000

export function HlsPlayer({ src, className }: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [retryNum, setRetryNum] = useState(0)
  const [retryKey, setRetryKey] = useState(0)
  const retryCount = useRef(0)
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hlsRef = useRef<import("hls.js").default | null>(null)

  const startStream = useCallback(() => {
    setError(false)
    setLoading(true)
    setRetryNum(0)
    retryCount.current = 0
    setRetryKey((k) => k + 1)
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return

    setError(false)
    setLoading(true)
    setRetryNum(0)
    retryCount.current = 0

    const onPlaying = () => setLoading(false)
    video.addEventListener("playing", onPlaying)

    const init = async () => {
      hlsRef.current?.destroy()
      hlsRef.current = null

      const Hls = (await import("hls.js")).default

      if (Hls.isSupported()) {
        const hls = new Hls({
          liveSyncDurationCount: 2,
          liveMaxLatencyDurationCount: 6,
          lowLatencyMode: false,
          maxBufferLength: 10,
          maxMaxBufferLength: 20,
          fragLoadingTimeOut: 20000,
          manifestLoadingTimeOut: 20000,
          // Retry media playlist until go2rtc produces the first segment (~3-5s startup)
          levelLoadingMaxRetry: 15,
          levelLoadingRetryDelay: 1000,
          levelLoadingMaxRetryTimeout: 4000,
        })
        hlsRef.current = hls
        hls.loadSource(src)
        hls.attachMedia(video)
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          retryCount.current = 0
          video.play().catch(() => {})
        })
        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (data.fatal) {
            hls.destroy()
            hlsRef.current = null
            if (retryCount.current < MAX_RETRIES) {
              retryCount.current++
              setRetryNum(retryCount.current)
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
      video.removeEventListener("playing", onPlaying)
      hlsRef.current?.destroy()
      hlsRef.current = null
      if (video) {
        video.src = ""
        video.load()
      }
    }
  }, [src, retryKey])

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center gap-3 bg-black text-white/50 aspect-3/4 ${className}`}>
        <VideoOff className="size-8" />
        <span className="text-xs">Stream unavailable</span>
        <button
          onClick={startStream}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white/60 hover:text-white text-xs transition-colors"
        >
          <RefreshCw className="size-3" />
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className={`relative bg-black ${className}`}>
      {loading && (
        <div className="flex flex-col items-center justify-center bg-black gap-3 aspect-3/4">
          {/* Pulsing camera outline */}
          <div className="relative size-14">
            <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping" />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="size-7 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
            </div>
          </div>
          {/* Scanning line */}
          <div className="w-24 h-0.5 rounded-full overflow-hidden bg-white/10">
            <div className="h-full w-1/3 bg-white/40 rounded-full animate-[shimmer_1.5s_ease-in-out_infinite]" />
          </div>
          <span className="text-[10px] text-white/30 uppercase tracking-widest">
            {retryNum > 0 ? `Retry ${retryNum}/${MAX_RETRIES}` : "Connecting"}
          </span>
        </div>
      )}
      <video
        ref={videoRef}
        className={`w-full h-full object-cover ${loading ? "absolute inset-0" : ""}`}
        muted
        playsInline
        autoPlay
      />
    </div>
  )
}
