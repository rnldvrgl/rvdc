"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { type ChatMessage, useChat } from "@/lib/hooks/useChat"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { cn } from "@/lib/utils/helpers"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, ChevronDown, MessageCircle, Send, X } from "lucide-react"
import Image from "next/image"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-500",
  manager: "bg-blue-500",
  clerk: "bg-emerald-500",
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  manager: "Manager",
  clerk: "Clerk",
}

function UserInitials({
  name,
  role,
  isOnline,
  size = "md",
  image,
}: {
  name: string
  role: string
  isOnline?: boolean
  size?: "sm" | "md" | "lg"
  image?: string
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const sizeClass = {
    sm: "size-8 text-xs",
    md: "size-10 text-sm",
    lg: "size-12 text-base",
  }[size]

  const dotSize = {
    sm: "size-2",
    md: "size-2.5",
    lg: "size-3",
  }[size]

  return (
    <div className="relative shrink-0">
      {image ? (
        <Image
          src={image}
          alt={name}
          width={size === "lg" ? 48 : size === "md" ? 40 : 32}
          height={size === "lg" ? 48 : size === "md" ? 40 : 32}
          className={cn(sizeClass, "rounded-full object-cover")}
        />
      ) : (
        <div
          className={cn(
            sizeClass,
            "rounded-full flex items-center justify-center font-semibold text-white",
            ROLE_COLORS[role] || "bg-gray-500",
          )}
        >
          {initials}
        </div>
      )}
      {isOnline !== undefined && (
        <span
          className={cn(
            dotSize,
            "absolute bottom-0 right-0 rounded-full border-2 border-white dark:border-gray-900",
            isOnline ? "bg-green-500" : "bg-gray-400",
          )}
        />
      )}
    </div>
  )
}

function formatTime(ts: number) {
  return new Date(ts * 1000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })
}

// ── Chat Bubble (FAB) ────────────────────────────────────────────────

function ChatBubble({
  onClick,
  totalUnread,
}: {
  onClick: () => void
  totalUnread: number
}) {
  return (
    <motion.button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 size-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl flex items-center justify-center"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <MessageCircle className="size-6" />
      {totalUnread > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 size-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold"
        >
          {totalUnread > 9 ? "9+" : totalUnread}
        </motion.span>
      )}
    </motion.button>
  )
}

// ── User List (contact list) ─────────────────────────────────────────

function UserList({
  users,
  onSelect,
  onClose,
}: {
  users: {
    id: number
    name: string
    role: string
    profile_image: string
    is_online: boolean
    unread_count: number
    last_message: ChatMessage | null
  }[]
  onSelect: (userId: number) => void
  onClose: () => void
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
        <div className="flex items-center gap-2">
          <MessageCircle className="size-5 text-primary" />
          <h3 className="font-semibold text-sm">Chat</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={onClose}
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* User list */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {users.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              No contacts available
            </p>
          ) : (
            users.map((user) => (
              <button
                key={user.id}
                onClick={() => onSelect(user.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
              >
                <UserInitials
                  name={user.name}
                  role={user.role}
                  isOnline={user.is_online}
                  image={user.profile_image}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium truncate">
                      {user.name}
                    </span>
                    {user.unread_count > 0 && (
                      <Badge
                        variant="destructive"
                        className="text-[10px] h-5 min-w-5 flex items-center justify-center px-1.5"
                      >
                        {user.unread_count}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {ROLE_LABELS[user.role] || user.role}
                    </Badge>
                    {user.last_message && (
                      <span className="text-xs text-muted-foreground truncate">
                        {user.last_message.body.slice(0, 25)}
                        {user.last_message.body.length > 25 ? "..." : ""}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

// ── Message Thread ───────────────────────────────────────────────────

function MessageThread({
  partnerId,
  partnerName,
  partnerRole,
  partnerImage,
  partnerOnline,
  messages,
  currentUserId,
  typingFrom,
  onSend,
  onTyping,
  onBack,
  onClose,
}: {
  partnerId: number
  partnerName: string
  partnerRole: string
  partnerImage: string
  partnerOnline: boolean
  messages: ChatMessage[]
  currentUserId: number
  typingFrom: number | null
  onSend: (body: string) => void
  onTyping: () => void
  onBack: () => void
  onClose: () => void
}) {
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const typingThrottle = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSend = () => {
    const body = input.trim()
    if (!body) return
    onSend(body)
    setInput("")
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
    // Throttle typing indicator
    if (!typingThrottle.current) {
      onTyping()
      typingThrottle.current = setTimeout(() => {
        typingThrottle.current = undefined
      }, 2000)
    }
  }

  const isPartnerTyping = typingFrom === partnerId

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-muted/50">
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={onBack}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <UserInitials
          name={partnerName}
          role={partnerRole}
          isOnline={partnerOnline}
          size="sm"
          image={partnerImage}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{partnerName}</p>
          <p className="text-[11px] text-muted-foreground">
            {isPartnerTyping ? (
              <span className="text-primary">typing...</span>
            ) : partnerOnline ? (
              "Online"
            ) : (
              "Offline"
            )}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={onClose}
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-2"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="size-10 text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">
              No messages yet. Say hello!
            </p>
          </div>
        )}
        {messages.map((msg) => {
          const isMine = msg.from === currentUserId
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.15 }}
              className={cn("flex", isMine ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                  isMine
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted text-foreground rounded-bl-md",
                )}
              >
                <p className="wrap-break-word whitespace-pre-wrap">
                  {msg.body}
                </p>
                <p
                  className={cn(
                    "text-[10px] mt-0.5",
                    isMine
                      ? "text-primary-foreground/60"
                      : "text-muted-foreground",
                  )}
                >
                  {formatTime(msg.ts)}
                </p>
              </div>
            </motion.div>
          )
        })}

        {/* Typing indicator */}
        <AnimatePresence>
          {isPartnerTyping && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="flex justify-start"
            >
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2.5">
                <div className="flex gap-1">
                  <span className="size-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="size-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="size-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="px-3 py-2 border-t border-border bg-card">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 h-9 text-sm"
            maxLength={2000}
            autoComplete="off"
          />
          <Button
            size="icon"
            className="size-9 shrink-0"
            onClick={handleSend}
            disabled={!input.trim()}
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Main FloatingChat Component ──────────────────────────────────────

export default function FloatingChat() {
  const { role, user_id } = useCurrentUser()
  const [isOpen, setIsOpen] = useState(false)
  const [activeChat, setActiveChat] = useState<number | null>(null)
  const [minimized, setMinimized] = useState(false)

  // Only available for admin, manager, clerk
  const canChat = role === "admin" || role === "manager" || role === "clerk"

  const {
    chatUsers,
    messages,
    typingFrom,
    sendMessage,
    loadHistory,
    sendTyping,
    markRead,
  } = useChat({
    onMessage: (msg) => {
      // Play a subtle sound for incoming messages
      if (msg.from !== user_id) {
        playMessageSound()
      }
    },
  })

  const totalUnread = useMemo(
    () => chatUsers.reduce((sum, u) => sum + u.unread_count, 0),
    [chatUsers],
  )

  const activePartner = useMemo(
    () => chatUsers.find((u) => u.id === activeChat),
    [chatUsers, activeChat],
  )

  const handleSelectUser = useCallback(
    (userId: number) => {
      setActiveChat(userId)
      loadHistory(userId)
      markRead(userId)
    },
    [loadHistory, markRead],
  )

  const handleSend = useCallback(
    (body: string) => {
      if (activeChat) {
        sendMessage(activeChat, body)
      }
    },
    [activeChat, sendMessage],
  )

  const handleTyping = useCallback(() => {
    if (activeChat) {
      sendTyping(activeChat)
    }
  }, [activeChat, sendTyping])

  const handleBack = useCallback(() => {
    setActiveChat(null)
  }, [])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    setActiveChat(null)
  }, [])

  const handleToggle = useCallback(() => {
    if (isOpen) {
      setMinimized(!minimized)
    } else {
      setIsOpen(true)
      setMinimized(false)
    }
  }, [isOpen, minimized])

  // Mark messages as read when opening a chat
  useEffect(() => {
    if (activeChat && isOpen) {
      markRead(activeChat)
    }
  }, [activeChat, isOpen, markRead, messages])

  if (!canChat) return null

  return (
    <>
      {/* Chat window */}
      <AnimatePresence>
        {isOpen && !minimized && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-24 right-6 z-50 w-80 h-[480px] rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col"
          >
            {activeChat && activePartner ? (
              <MessageThread
                partnerId={activeChat}
                partnerName={activePartner.name}
                partnerRole={activePartner.role}
                partnerImage={activePartner.profile_image}
                partnerOnline={activePartner.is_online}
                messages={messages[activeChat] || []}
                currentUserId={user_id || 0}
                typingFrom={typingFrom}
                onSend={handleSend}
                onTyping={handleTyping}
                onBack={handleBack}
                onClose={handleClose}
              />
            ) : (
              <UserList
                users={chatUsers}
                onSelect={handleSelectUser}
                onClose={handleClose}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating bubble */}
      {isOpen && minimized ? (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
          <motion.button
            onClick={handleToggle}
            className="size-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronDown className="size-6 rotate-180" />
            {totalUnread > 0 && (
              <span className="absolute -top-1 -right-1 size-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                {totalUnread > 9 ? "9+" : totalUnread}
              </span>
            )}
          </motion.button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-full bg-muted"
            onClick={handleClose}
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : !isOpen ? (
        <ChatBubble
          onClick={handleToggle}
          totalUnread={totalUnread}
        />
      ) : null}
    </>
  )
}

// ── Sound ────────────────────────────────────────────────────────────

function playMessageSound() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 600
    osc.type = "sine"
    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.15)
  } catch {
    // Audio not available
  }
}
