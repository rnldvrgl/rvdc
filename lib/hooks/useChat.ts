"use client"

import { getToken } from "@/lib/utils/tokens"
import { useCallback, useEffect, useRef, useState } from "react"

export type ChatMessage = {
  id: string
  from: number
  from_name: string
  to: number
  body: string
  ts: number
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

type UseChatOptions = {
  onMessage?: (msg: ChatMessage) => void
}

export function useChat({ onMessage }: UseChatOptions = {}) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
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
  // Queue history requests when WS isn't ready yet
  const pendingHistoryRef = useRef<number | null>(null)

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

  const connect = useCallback(() => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000"
    const wsProtocol = baseUrl.startsWith("https") ? "wss" : "ws"
    const host = baseUrl.replace(/^https?:\/\//, "")
    const token = getToken("access")

    if (!token) return

    if (wsRef.current) {
      wsRef.current.close()
    }

    const ws = new WebSocket(`${wsProtocol}://${host}/ws/chat/?token=${token}`)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      // Request presence on connect
      ws.send(JSON.stringify({ action: "presence" }))
      // Flush any pending history request (e.g., user opened a chat before WS was ready)
      if (pendingHistoryRef.current !== null) {
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
          // Update chat users unread if not the active chat
          setChatUsers((prev) =>
            prev.map((u) =>
              u.id === msg.from
                ? {
                    ...u,
                    last_message: msg,
                    unread_count: u.unread_count + 1,
                  }
                : u,
            ),
          )
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

    ws.onclose = () => {
      setConnected(false)
      reconnectTimer.current = setTimeout(connect, 5000)
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [])

  // Send a message
  const sendMessage = useCallback((to: number, body: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: "send", to, body }))
      // Clear seen state for this partner since we just sent a new message
      setSeenBy((prev) => {
        const next = new Set(prev)
        next.delete(to)
        return next
      })
    }
  }, [])

  // Request history for a user
  const loadHistory = useCallback((withUserId: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ action: "history", with: withUserId }),
      )
    } else {
      // Queue for when WS connects
      pendingHistoryRef.current = withUserId
    }
  }, [])

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

  useEffect(() => {
    fetchUsers()
    connect()
    return () => {
      clearTimeout(reconnectTimer.current)
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
    sendMessage,
    loadHistory,
    sendTyping,
    markRead,
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
