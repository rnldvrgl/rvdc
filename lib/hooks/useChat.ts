"use client"

import {
  getToken,
  getValidAccessToken,
  refreshAccessToken,
} from "@/lib/utils/tokens"
import { useCallback, useEffect, useRef, useState } from "react"

export type ChatMessage = {
  id: string
  from: number
  from_name: string
  to: number
  body: string
  ts: number
  image_url?: string
  reactions?: Record<string, number[]>
  reply_to?: { id: string; body: string; from_name: string }
}

type ChatUser = {
  id: number
  first_name: string
  last_name: string
  name: string
  role: string
  profile_image: string
  is_online: boolean
  unread_count: number
  last_message: ChatMessage | null
  last_seen: number | null
}

type WSEvent =
  | { type: "message"; message: ChatMessage }
  | { type: "typing"; from: number }
  | { type: "read"; from: number }
  | { type: "history"; with: number; messages: ChatMessage[] }
  | { type: "presence"; online: number[] }
  | {
      type: "reaction"
      msg_id: string
      emoji: string
      from: number
      reactions: Record<string, number[]>
    }

type UseChatOptions = {
  onMessage?: (msg: ChatMessage) => void
}

const HISTORY_REQUEST_TIMEOUT_MS = 10000
const MAX_RETRY_BEFORE_COOLDOWN = 3
const RETRY_COOLDOWN_MS = 120000

export function useChat({ onMessage }: UseChatOptions = {}) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const reconnectAttemptRef = useRef(0)
  const reconnectPauseUntilRef = useRef(0)
  const heartbeatRef = useRef<ReturnType<typeof setInterval>>(undefined)
  const historyTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const callbackRef = useRef(onMessage)
  callbackRef.current = onMessage

  const [connected, setConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<number[]>([])
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([])
  const [messages, setMessages] = useState<Record<number, ChatMessage[]>>({})
  const [typingFrom, setTypingFrom] = useState<number | null>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  // Track which partners have "seen" (read) our latest messages
  const [seenBy, setSeenBy] = useState<Set<number>>(new Set())
  // Track loading state for history
  const [loadingHistory, setLoadingHistory] = useState(false)
  // Queue history requests when WS isn't ready yet
  const pendingHistoryRef = useRef<number | null>(null)

  const stopHistoryLoading = useCallback(() => {
    clearTimeout(historyTimerRef.current)
    setLoadingHistory(false)
  }, [])

  const startHistoryLoading = useCallback(() => {
    clearTimeout(historyTimerRef.current)
    setLoadingHistory(true)
    historyTimerRef.current = setTimeout(() => {
      setLoadingHistory(false)
    }, HISTORY_REQUEST_TIMEOUT_MS)
  }, [])

  const scheduleReconnect = useCallback((delayMs: number) => {
    clearTimeout(reconnectTimer.current)
    reconnectTimer.current = setTimeout(connect, delayMs)
  }, [])

  const canAttemptConnection = useCallback(() => {
    if (typeof window === "undefined") return false
    if (!navigator.onLine) return false
    if (document.visibilityState === "hidden") return false
    return Date.now() >= reconnectPauseUntilRef.current
  }, [])

  // Fetch chat users via REST
  const fetchUsers = useCallback(async () => {
    try {
      const token = getToken("access")
      if (!token) return
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000"
      const res = await fetch(`${baseUrl}/api/chat/users/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data: ChatUser[] = await res.json()
        setChatUsers(data)
      }
    } catch {
      // Silently fail
    }
  }, [])

  const connect = useCallback(async () => {
    if (!canAttemptConnection()) {
      const retryIn = Math.max(
        5000,
        reconnectPauseUntilRef.current - Date.now(),
      )
      scheduleReconnect(retryIn)
      return
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000"
    const wsProtocol = baseUrl.startsWith("https") ? "wss" : "ws"
    const host = baseUrl.replace(/^https?:\/\//, "")
    const token = await getValidAccessToken()

    if (!token) {
      scheduleReconnect(5000)
      return
    }

    if (wsRef.current) {
      wsRef.current.close()
    }

    const ws = new WebSocket(`${wsProtocol}://${host}/ws/chat/?token=${token}`)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      reconnectAttemptRef.current = 0
      reconnectPauseUntilRef.current = 0
      // Request presence on connect
      ws.send(JSON.stringify({ action: "presence" }))
      // Start heartbeat (every 30s) to keep presence alive
      clearInterval(heartbeatRef.current)
      heartbeatRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ action: "ping" }))
        }
      }, 30_000)
      // Flush any pending history request (e.g., user opened a chat before WS was ready)
      if (pendingHistoryRef.current !== null) {
        startHistoryLoading()
        ws.send(
          JSON.stringify({
            action: "history",
            with: pendingHistoryRef.current,
          }),
        )
        pendingHistoryRef.current = null
      }
    }

    ws.onmessage = (event) => {
      try {
        const data: WSEvent = JSON.parse(event.data)

        if (data.type === "message") {
          const msg = data.message
          const partnerId = msg.from === getCurrentUserId() ? msg.to : msg.from
          setMessages((prev) => {
            const existing = prev[partnerId] || []
            // Deduplicate by id
            if (existing.some((m) => m.id === msg.id)) return prev
            return { ...prev, [partnerId]: [...existing, msg] }
          })
          // Update chat users: last_message for both sender and receiver, unread for incoming
          setChatUsers((prev) => {
            const updated = prev.map((u) => {
              if (u.id === msg.from) {
                return {
                  ...u,
                  last_message: msg,
                  unread_count: u.unread_count + 1,
                }
              }
              if (u.id === msg.to) {
                return { ...u, last_message: msg }
              }
              return u
            })
            // Re-sort by most recent message first
            return updated.sort((a, b) => {
              const tsA = a.last_message?.ts ?? 0
              const tsB = b.last_message?.ts ?? 0
              return tsB - tsA
            })
          })
          callbackRef.current?.(msg)
        } else if (data.type === "typing") {
          setTypingFrom(data.from)
          clearTimeout(typingTimeoutRef.current)
          typingTimeoutRef.current = setTimeout(() => setTypingFrom(null), 3000)
        } else if (data.type === "read") {
          // Partner read our messages — mark as seen
          setSeenBy((prev) => new Set(prev).add(data.from))
        } else if (data.type === "history") {
          setMessages((prev) => ({ ...prev, [data.with]: data.messages }))
          stopHistoryLoading()
        } else if (data.type === "reaction") {
          // Update reactions on the specific message
          const msgId = data.msg_id
          const newReactions = data.reactions
          setMessages((prev) => {
            const updated = { ...prev }
            for (const [partnerId, msgs] of Object.entries(updated)) {
              const idx = msgs.findIndex((m) => m.id === msgId)
              if (idx !== -1) {
                const copy = [...msgs]
                copy[idx] = {
                  ...copy[idx],
                  reactions: Object.keys(newReactions).length
                    ? newReactions
                    : undefined,
                }
                updated[Number(partnerId)] = copy
                break
              }
            }
            return updated
          })
        } else if (data.type === "presence") {
          setOnlineUsers(data.online)
          setChatUsers((prev) =>
            prev.map((u) => ({
              ...u,
              is_online: data.online.includes(u.id),
            })),
          )
        }
      } catch {
        // Ignore malformed
      }
    }

    ws.onclose = (event) => {
      setConnected(false)
      clearInterval(heartbeatRef.current)
      stopHistoryLoading()
      if (event.code === 4001) {
        refreshAccessToken().then((ok) => {
          if (ok) {
            reconnectAttemptRef.current = 0
            reconnectPauseUntilRef.current = 0
            scheduleReconnect(1000)
          }
        })
        return
      }

      if (!canAttemptConnection()) {
        scheduleReconnect(5000)
        return
      }

      const delay = Math.min(
        5000 * Math.pow(2, reconnectAttemptRef.current),
        60000,
      )
      reconnectAttemptRef.current += 1

      if (reconnectAttemptRef.current >= MAX_RETRY_BEFORE_COOLDOWN) {
        reconnectPauseUntilRef.current = Date.now() + RETRY_COOLDOWN_MS
        scheduleReconnect(RETRY_COOLDOWN_MS)
        return
      }

      scheduleReconnect(delay)
    }

    ws.onerror = () => {
      stopHistoryLoading()
      ws.close()
    }
  }, [
    canAttemptConnection,
    scheduleReconnect,
    startHistoryLoading,
    stopHistoryLoading,
  ])

  // Send a message
  const sendMessage = useCallback(
    (
      to: number,
      body: string,
      replyTo?: { id: string; body: string; from_name: string },
      imageUrl?: string,
    ) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        const payload: Record<string, unknown> = {
          action: "send",
          to,
          body,
        }
        if (replyTo) {
          payload.reply_to = replyTo
        }
        if (imageUrl) {
          payload.image_url = imageUrl
        }
        wsRef.current.send(JSON.stringify(payload))
        // Clear seen state for this partner since we just sent a new message
        setSeenBy((prev) => {
          const next = new Set(prev)
          next.delete(to)
          return next
        })
      }
    },
    [],
  )

  // Request history for a user
  const loadHistory = useCallback((withUserId: number) => {
    startHistoryLoading()
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ action: "history", with: withUserId }),
      )
    } else {
      // Queue for when WS connects
      pendingHistoryRef.current = withUserId
    }
  }, [startHistoryLoading])

  // Send typing indicator
  const sendTyping = useCallback((to: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: "typing", to }))
    }
  }, [])

  // Mark messages as read
  const markRead = useCallback((fromUserId: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: "read", from: fromUserId }))
    }
    // Clear local unread count
    setChatUsers((prev) =>
      prev.map((u) => (u.id === fromUserId ? { ...u, unread_count: 0 } : u)),
    )
  }, [])

  // Send emoji reaction
  const sendReaction = useCallback(
    (to: number, msgId: string, emoji: string) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({ action: "react", to, msg_id: msgId, emoji }),
        )
      }
    },
    [],
  )

  useEffect(() => {
    fetchUsers()
    connect()
    return () => {
      clearTimeout(historyTimerRef.current)
      clearTimeout(reconnectTimer.current)
      clearInterval(heartbeatRef.current)
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect, fetchUsers])

  return {
    connected,
    chatUsers,
    messages,
    onlineUsers,
    typingFrom,
    loadingHistory,
    sendMessage,
    loadHistory,
    sendTyping,
    markRead,
    sendReaction,
    seenBy,
    fetchUsers,
  }
}

function getCurrentUserId(): number {
  try {
    const stored = localStorage.getItem("user-profile-storage")
    if (stored) {
      const parsed = JSON.parse(stored)
      return parsed?.state?.userProfile?.id || 0
    }
  } catch {
    // Ignore
  }
  return 0
}
