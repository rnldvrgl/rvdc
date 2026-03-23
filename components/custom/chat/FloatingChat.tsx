"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { type ChatMessage, useChat } from "@/lib/hooks/useChat"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { getAudioContext } from "@/lib/utils/audioContext"
import { cn } from "@/lib/utils/helpers"
import { formatDistanceToNow } from "date-fns"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, MessageCircle, Send, X } from "lucide-react"
import Image from "next/image"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-500",
  manager: "bg-blue-500",
  clerk: "bg-emerald-500",
}

const REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "😡", "👍"]

function UserAvatar({
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
    sm: "size-2.5",
    md: "size-3",
    lg: "size-3.5",
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

function formatLastSeen(ts: number | null | undefined): string {
  if (!ts) return "Offline"
  return formatDistanceToNow(new Date(ts * 1000), { addSuffix: true })
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
      className="fixed bottom-6 right-4 sm:right-6 z-50 size-12 sm:size-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl flex items-center justify-center"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <MessageCircle className="size-5 sm:size-6" />
      {totalUnread > 0 && (
        <>
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 size-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold"
          >
            {totalUnread > 9 ? "9+" : totalUnread}
          </motion.span>
          <span className="absolute inset-0 rounded-full animate-ping bg-primary/30" />
        </>
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
    last_seen: number | null
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
                <UserAvatar
                  name={user.name}
                  role={user.role}
                  isOnline={user.is_online}
                  image={user.profile_image}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-sm font-medium truncate">
                        {user.name}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] shrink-0",
                          user.is_online
                            ? "text-green-500"
                            : "text-muted-foreground",
                        )}
                      >
                        {user.is_online
                          ? "Online"
                          : formatLastSeen(user.last_seen)}
                      </span>
                    </div>
                    {user.unread_count > 0 && (
                      <Badge
                        variant="destructive"
                        className="text-[10px] h-5 min-w-5 flex items-center justify-center px-1.5"
                      >
                        {user.unread_count}
                      </Badge>
                    )}
                  </div>
                  {user.last_message && (
                    <div className="flex items-center gap-1">
                      <p className="text-xs text-muted-foreground truncate flex-1">
                        {user.last_message.body.slice(0, 30)}
                        {user.last_message.body.length > 30 ? "..." : ""}
                      </p>
                      <span className="text-[10px] text-muted-foreground/60 shrink-0">
                        {formatDistanceToNow(new Date(user.last_message.ts * 1000), { addSuffix: false })}
                      </span>
                    </div>
                  )}
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
  partnerLastSeen,
  messages,
  currentUserId,
  typingFrom,
  seenByPartner,
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
  partnerLastSeen: number | null
  messages: ChatMessage[]
  currentUserId: number
  typingFrom: number | null
  seenByPartner: boolean
  onSend: (body: string) => void
  onTyping: () => void
  onReact: (msgId: string, emoji: string) => void
  onBack: () => void
  onClose: () => void
}) {
  const [input, setInput] = useState("")
  const [reactionPickerFor, setReactionPickerFor] = useState<string | null>(
    null,
  )
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const typingThrottle = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Focus input on mount
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const handleSend = () => {
    const body = input.trim()
    if (!body) return
    onSend(body)
    setInput("")
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
    textareaRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 96)}px`
    }
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
        <UserAvatar
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
              formatLastSeen(partnerLastSeen)
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
        onClick={() => reactionPickerFor && setReactionPickerFor(null)}
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="size-10 text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">
              No messages yet. Say hello!
            </p>
          </div>
        )}
        {messages.map((msg, idx) => {
          const isMine = msg.from === currentUserId
          // Find index of last outgoing message to show status
          const lastMyMsgIdx = messages.findLastIndex(
            (m) => m.from === currentUserId,
          )
          const showStatus = isMine && idx === lastMyMsgIdx
          const hasReactions =
            msg.reactions && Object.keys(msg.reactions).length > 0
          const isPickerOpen = reactionPickerFor === msg.id

          return (
            <div
              key={msg.id}
              className={cn(
                "group relative",
                isMine ? "flex flex-col items-end" : "flex flex-col items-start",
              )}
            >
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.15 }}
                className="relative max-w-[80%]"
              >
                {/* Message bubble */}
                <div
                  className={cn(
                    "rounded-2xl px-3 py-2 text-sm",
                    isMine
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md",
                  )}
                  onDoubleClick={() =>
                    setReactionPickerFor(isPickerOpen ? null : msg.id)
                  }
                >
                  <p className="wrap-break-word whitespace-pre-wrap">
                    {msg.body}
                  </p>
                  <div
                    className={cn(
                      "flex items-center gap-1 mt-0.5",
                      isMine ? "justify-end" : "",
                    )}
                  >
                    <span
                      className={cn(
                        "text-[10px]",
                        isMine
                          ? "text-primary-foreground/60"
                          : "text-muted-foreground",
                      )}
                    >
                      {formatTime(msg.ts)}
                    </span>
                    {showStatus && (
                      <span
                        className={cn(
                          "text-[10px]",
                          seenByPartner
                            ? "text-blue-300"
                            : "text-primary-foreground/50",
                        )}
                      >
                        {seenByPartner ? "· Seen" : "· Sent"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Smiley trigger — visible on hover */}
                <button
                  onClick={() =>
                    setReactionPickerFor(isPickerOpen ? null : msg.id)
                  }
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 size-6 rounded-full bg-muted/80 backdrop-blur text-muted-foreground flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted",
                    isMine ? "-left-7" : "-right-7",
                  )}
                >
                  😊
                </button>

                {/* Reaction picker */}
                <AnimatePresence>
                  {isPickerOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, y: 4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: 4 }}
                      transition={{ duration: 0.12 }}
                      className={cn(
                        "absolute z-10 flex gap-0.5 rounded-full bg-card border border-border shadow-lg px-1.5 py-1",
                        isMine ? "right-0" : "left-0",
                        "-top-9",
                      )}
                    >
                      {REACTION_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => {
                            onReact(msg.id, emoji)
                            setReactionPickerFor(null)
                          }}
                          className="size-7 rounded-full hover:bg-muted flex items-center justify-center text-base transition-transform hover:scale-125"
                        >
                          {emoji}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Reaction badges */}
              {hasReactions && (
                <div
                  className={cn(
                    "flex gap-0.5 -mt-1.5 px-1",
                    isMine ? "justify-end" : "justify-start",
                  )}
                >
                  {Object.entries(msg.reactions!).map(([emoji, userIds]) => {
                    const iReacted = userIds.includes(currentUserId)
                    return (
                      <button
                        key={emoji}
                        onClick={() => onReact(msg.id, emoji)}
                        className={cn(
                          "flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs border transition-colors",
                          iReacted
                            ? "bg-primary/15 border-primary/30 text-primary"
                            : "bg-muted/50 border-border text-muted-foreground hover:bg-muted",
                        )}
                      >
                        <span>{emoji}</span>
                        {userIds.length > 1 && (
                          <span className="text-[10px]">{userIds.length}</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
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
      <div className="px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] border-t border-border bg-card">
        <div className="flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 min-h-9 max-h-24 text-base sm:text-sm resize-none py-2"
            maxLength={2000}
            autoComplete="off"
            rows={1}
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
  const chatWindowRef = useRef<HTMLDivElement>(null)
  // Prevent SSR/client hydration mismatch (Zustand reads localStorage on client)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Only available for admin, manager, clerk
  const canChat = role === "admin" || role === "manager" || role === "clerk"

  const {
    connected,
    chatUsers,
    messages,
    typingFrom,
    sendMessage,
    loadHistory,
    sendTyping,
    markRead,
    sendReaction,
    seenBy,
  } = useChat({
    onMessage: (msg) => {
      if (msg.from !== user_id) {
        playReceiveSound()
      }
    },
  })

  // When WS reconnects with an active chat, reload history
  const prevConnected = useRef(false)
  useEffect(() => {
    if (connected && !prevConnected.current && activeChat) {
      loadHistory(activeChat)
    }
    prevConnected.current = connected
  }, [connected, activeChat, loadHistory])

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
        playSendSound()
      }
    },
    [activeChat, sendMessage],
  )

  const handleTyping = useCallback(() => {
    if (activeChat) {
      sendTyping(activeChat)
    }
  }, [activeChat, sendTyping])

  const handleReact = useCallback(
    (msgId: string, emoji: string) => {
      if (activeChat) {
        sendReaction(activeChat, msgId, emoji)
      }
    },
    [activeChat, sendReaction],
  )

  const handleBack = useCallback(() => {
    setActiveChat(null)
  }, [])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    setActiveChat(null)
  }, [])

  const handleToggle = useCallback(() => {
    setIsOpen(true)
  }, [])

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      if (
        chatWindowRef.current &&
        !chatWindowRef.current.contains(e.target as Node)
      ) {
        handleClose()
      }
    }
    // Delay attaching so the opening click doesn't immediately close
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handler)
    }, 0)
    return () => {
      clearTimeout(timer)
      document.removeEventListener("mousedown", handler)
    }
  }, [isOpen, handleClose])

  // Mark messages as read when opening a chat
  useEffect(() => {
    if (activeChat && isOpen) {
      markRead(activeChat)
    }
  }, [activeChat, isOpen, markRead, messages])

  if (!mounted || !canChat) return null

  return (
    <>
      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={chatWindowRef}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed z-50 inset-0 sm:inset-auto sm:bottom-20 sm:right-6 sm:w-80 sm:h-[min(480px,calc(100dvh-6rem))] sm:rounded-2xl sm:border border-border bg-card sm:shadow-2xl overflow-hidden flex flex-col"
          >
            {activeChat && activePartner ? (
              <MessageThread
                partnerId={activeChat}
                partnerName={activePartner.name}
                partnerRole={activePartner.role}
                partnerImage={activePartner.profile_image}
                partnerOnline={activePartner.is_online}
                partnerLastSeen={activePartner.last_seen}
                messages={messages[activeChat] || []}
                currentUserId={user_id || 0}
                typingFrom={typingFrom}
                seenByPartner={seenBy.has(activeChat)}
                onSend={handleSend}
                onTyping={handleTyping}
                onReact={handleReact}
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

      {/* Floating bubble — only show when chat window is closed */}
      {!isOpen && (
        <ChatBubble
          onClick={handleToggle}
          totalUnread={totalUnread}
        />
      )}
    </>
  )
}

// ── Sounds (Apple iMessage-inspired) ─────────────────────────────────

function playReceiveSound() {
  try {
    const ctx = getAudioContext()
    if (ctx.state !== "running") return
    const t = ctx.currentTime

    // Three-note ascending chime (like iMessage receive)
    const notes = [1046.5, 1318.5, 1568] // C6, E6, G6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = "sine"
      osc.frequency.value = freq
      const start = t + i * 0.08
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(0.06, start + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15)
      osc.start(start)
      osc.stop(start + 0.15)
    })
  } catch {
    // Audio not available
  }
}

function playSendSound() {
  try {
    const ctx = getAudioContext()
    if (ctx.state !== "running") return
    const t = ctx.currentTime

    // Quick ascending swoosh (like iMessage send)
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = "sine"
    osc.frequency.setValueAtTime(800, t)
    osc.frequency.linearRampToValueAtTime(1200, t + 0.1)
    gain.gain.setValueAtTime(0.05, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12)
    osc.start(t)
    osc.stop(t + 0.12)
  } catch {
    // Audio not available
  }
}
