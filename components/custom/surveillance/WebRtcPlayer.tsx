"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { VideoOff, RefreshCw, Mic, MicOff } from "lucide-react"

interface WebRtcPlayerProps {
  src: string // WebSocket URL: ws://host:1984/api/ws?src=stream_name
  className?: string
  enableMic?: boolean
  onMicStateChange?: (active: boolean) => void
}

const RECONNECT_DELAY_MS = 3000
const MAX_RETRIES = 5

export function WebRtcPlayer({ src, className, enableMic = false, onMicStateChange }: WebRtcPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retryCount = useRef(0)

  const [state, setState] = useState<"connecting" | "connected" | "error">("connecting")
  const [retryNum, setRetryNum] = useState(0)
  const [micActive, setMicActive] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  const cleanup = useCallback(() => {
    if (retryTimer.current) {
      clearTimeout(retryTimer.current)
      retryTimer.current = null
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop())
      micStreamRef.current = null
    }
    if (pcRef.current) {
      pcRef.current.getSenders().forEach((s) => { if (s.track) s.track.stop() })
      pcRef.current.close()
      pcRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setMicActive(false)
    onMicStateChange?.(false)
  }, [onMicStateChange])

  const startStream = useCallback(() => {
    cleanup()
    setState("connecting")
    setRetryNum(0)
    retryCount.current = 0
    setRetryKey((k) => k + 1)
  }, [cleanup])

  useEffect(() => {
    if (!src || !videoRef.current) return

    const video = videoRef.current
    setState("connecting")
    setRetryNum(0)
    retryCount.current = 0

    const connect = async () => {
      cleanup()

      const pc = new RTCPeerConnection({
        bundlePolicy: "max-bundle",
        iceServers: [
          { urls: ["stun:stun.cloudflare.com:3478", "stun:stun.l.google.com:19302"] },
        ],
      })
      pcRef.current = pc

      // Request mic if enabled
      if (enableMic) {
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({ audio: true })
          micStreamRef.current = micStream
          micStream.getTracks().forEach((track) => {
            pc.addTransceiver(track, { direction: "sendonly" })
          })
          setMicActive(true)
          onMicStateChange?.(true)
        } catch {
          // Mic denied or unavailable — continue without
          setMicActive(false)
          onMicStateChange?.(false)
        }
      }

      // Add receive-only transceivers for video and audio
      pc.addTransceiver("video", { direction: "recvonly" })
      pc.addTransceiver("audio", { direction: "recvonly" })

      // Handle remote tracks
      pc.addEventListener("track", (ev) => {
        if (ev.streams.length > 0) {
          video.srcObject = ev.streams[0]
        } else {
          // Fallback: build stream from tracks
          const stream = video.srcObject instanceof MediaStream ? video.srcObject : new MediaStream()
          stream.addTrack(ev.track)
          video.srcObject = stream
        }
        video.play().catch(() => {})
      })

      pc.addEventListener("connectionstatechange", () => {
        if (pc.connectionState === "connected") {
          retryCount.current = 0
          setState("connected")
        } else if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          pc.close()
          pcRef.current = null
          if (retryCount.current < MAX_RETRIES) {
            retryCount.current++
            setRetryNum(retryCount.current)
            setState("connecting")
            retryTimer.current = setTimeout(connect, RECONNECT_DELAY_MS)
          } else {
            setState("error")
          }
        }
      })

      // Create offer
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      // Open WebSocket for signaling
      const ws = new WebSocket(src)
      wsRef.current = ws

      ws.addEventListener("open", () => {
        ws.send(JSON.stringify({ type: "webrtc/offer", value: offer.sdp }))
      })

      ws.addEventListener("message", (ev) => {
        const msg = JSON.parse(ev.data)
        switch (msg.type) {
          case "webrtc/answer":
            pc.setRemoteDescription({ type: "answer", sdp: msg.value }).catch(() => {})
            break
          case "webrtc/candidate":
            if (msg.value) {
              pc.addIceCandidate({ candidate: msg.value, sdpMid: "0" }).catch(() => {})
            }
            break
        }
      })

      // Send local ICE candidates
      pc.addEventListener("icecandidate", (ev) => {
        const candidate = ev.candidate ? ev.candidate.toJSON().candidate : ""
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "webrtc/candidate", value: candidate }))
        }
      })

      ws.addEventListener("close", () => {
        wsRef.current = null
      })

      ws.addEventListener("error", () => {
        ws.close()
        if (retryCount.current < MAX_RETRIES) {
          retryCount.current++
          setRetryNum(retryCount.current)
          setState("connecting")
          retryTimer.current = setTimeout(connect, RECONNECT_DELAY_MS)
        } else {
          setState("error")
        }
      })
    }

    connect()

    return cleanup
  }, [src, enableMic, retryKey, cleanup, onMicStateChange])

  if (state === "error") {
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
      {state === "connecting" && (
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
        className={`w-full h-full object-cover ${state === "connecting" ? "absolute inset-0" : ""}`}
        muted={!enableMic}
        playsInline
        autoPlay
      />
      {/* Mic indicator */}
      {enableMic && state === "connected" && (
        <div className="absolute bottom-1.5 left-1.5 z-10">
          {micActive ? (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-green-500/80 text-white text-[9px]">
              <Mic className="size-3" />
              <span>Mic On</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-500/60 text-white text-[9px]">
              <MicOff className="size-3" />
              <span>Mic Off</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
