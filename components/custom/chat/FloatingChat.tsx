"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { type ChatMessage, useChat } from "@/lib/hooks/useChat"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import useChatStore from "@/lib/store/useChatStore"
import { getAudioContext } from "@/lib/utils/audioContext"
import { getSoundVolume } from "@/lib/utils/getSoundVolume"
import { cn } from "@/lib/utils/helpers"
import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowLeft,
  Check,
  CheckCheck,
  ImageIcon,
  Loader2,
  MessageCircle,
  Reply,
  Send,
  Smile,
  X,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-500",
  manager: "bg-blue-500",
  clerk: "bg-emerald-500",
}

const REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "😡", "👍"]

// ── Message status check icons (Messenger-style) ────────────────────

function MessageStatus({ seen }: { seen: boolean }) {
  if (seen) {
    return <CheckCheck className="size-3.5 text-purple-200" />
  }
  return <Check className="size-3.5 text-primary-foreground/50" />
}

function MessageStatusMuted({ seen }: { seen: boolean }) {
  if (seen) {
    return <CheckCheck className="size-3 text-primary" />
  }
  return <Check className="size-3 text-muted-foreground/60" />
}

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
      <Avatar className={cn(sizeClass)}>
        <AvatarImage
          src={image}
          alt={name}
        />
        <AvatarFallback
          className={cn(
            "font-semibold text-white",
            ROLE_COLORS[role] || "bg-gray-500",
          )}
        >
          {initials}
        </AvatarFallback>
      </Avatar>
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

function formatChatTime(ts: number): string {
  const date = new Date(ts * 1000)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)

  // Less than 1 minute
  if (diffMins < 1) return "Just now"
  // Less than 1 hour
  if (diffMins < 60) return `${diffMins}m ago`
  // Less than 24 hours
  if (diffHours < 24) return `${diffHours}h ago`

  // Check if yesterday
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()

  const time = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })

  if (isYesterday) return `Yesterday ${time}`

  // Same year — show month and day
  if (date.getFullYear() === now.getFullYear()) {
    return (
      date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
      }) + ` ${time}`
    )
  }

  // Different year
  return (
    date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) + ` ${time}`
  )
}

function formatCompactTime(ts: number): string {
  const diffMs = Date.now() - ts * 1000
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 1) return "now"
  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}d`
  return new Date(ts * 1000).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  })
}

function formatLastSeen(ts: number | null | undefined): string {
  if (!ts) return "Offline"
  const compact = formatCompactTime(ts)
  return compact === "now" ? "Just now" : `${compact} ago`
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
  currentUserId,
  seenBy,
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
  currentUserId: number
  seenBy: Set<number>
  onSelect: (userId: number) => void
  onClose: () => void
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:pt-3 border-b border-border bg-muted/50">
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
                            ? "text-success"
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
                    <div className="flex items-center gap-1 min-w-0">
                      {user.last_message.from === currentUserId && (
                        <MessageStatusMuted seen={seenBy.has(user.id)} />
                      )}
                      <p className="text-xs text-muted-foreground truncate min-w-0 flex-1">
                        {user.last_message.body || "(Image)"}
                      </p>
                      <span className="text-[10px] text-muted-foreground/60 shrink-0 ml-auto">
                        {formatCompactTime(user.last_message.ts)}
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
  loadingHistory,
  draft,
  onDraftChange,
  onSend,
  onTyping,
  onReact,
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
  loadingHistory: boolean
  draft: string
  onDraftChange: (value: string) => void
  onSend: (
    body: string,
    replyTo?: { id: string; body: string; from_name: string },
    imageUrl?: string,
  ) => void
  onTyping: () => void
  onReact: (msgId: string, emoji: string) => void
  onBack: () => void
  onClose: () => void
}) {
  const input = draft
  const setInput = onDraftChange
  const [pendingImage, setPendingImage] = useState<{
    file: File
    previewUrl: string
  } | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [reactionPickerFor, setReactionPickerFor] = useState<string | null>(
    null,
  )
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null)
  // Track which message has actions visible (for mobile tap) and position
  const [activeActions, setActiveActions] = useState<{
    id: string
    above: boolean
  } | null>(null)
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

  // Close reaction picker and active actions on scroll
  const handleScroll = useCallback(() => {
    if (reactionPickerFor) setReactionPickerFor(null)
    if (activeActions) setActiveActions(null)
  }, [reactionPickerFor, activeActions])

  // Determine if action bar should show above or below
  const handleBubbleTap = useCallback(
    (msgId: string, el: HTMLElement) => {
      if (activeActions?.id === msgId) {
        setActiveActions(null)
        return
      }
      const rect = el.getBoundingClientRect()
      const container = scrollRef.current
      if (container) {
        const containerRect = container.getBoundingClientRect()
        const spaceBelow = containerRect.bottom - rect.bottom
        setActiveActions({ id: msgId, above: spaceBelow < 60 })
      } else {
        setActiveActions({ id: msgId, above: false })
      }
    },
    [activeActions],
  )

  const handleSend = async () => {
    const body = input.trim()
    if (!body && !pendingImage) return

    const replyPayload = replyingTo
      ? {
          id: replyingTo.id,
          body: replyingTo.body,
          from_name: replyingTo.from_name,
        }
      : undefined

    if (pendingImage) {
      const imageUrl = await uploadImage(pendingImage.file)
      if (!imageUrl) return
      onSend(body, replyPayload, imageUrl)
      URL.revokeObjectURL(pendingImage.previewUrl)
      setPendingImage(null)
    } else {
      onSend(body, replyPayload)
    }

    if (replyingTo) setReplyingTo(null)
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

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const { getToken } = await import("@/lib/utils/tokens")
      const token = getToken("access")
      if (!token) return null
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000"
      const form = new FormData()
      form.append("image", file)
      const res = await fetch(`${baseUrl}/api/chat/upload-image/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })
      if (!res.ok) return null
      const data = await res.json()
      return data.url as string
    } catch {
      return null
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items)
    const imageItem = items.find((item) => item.type.startsWith("image/"))
    if (!imageItem) return
    e.preventDefault()
    const file = imageItem.getAsFile()
    if (!file) return
    if (pendingImage) URL.revokeObjectURL(pendingImage.previewUrl)
    setPendingImage({ file, previewUrl: URL.createObjectURL(file) })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (pendingImage) URL.revokeObjectURL(pendingImage.previewUrl)
    setPendingImage({ file, previewUrl: URL.createObjectURL(file) })
    // Reset input so the same file can be picked again
    e.target.value = ""
  }

  const isPartnerTyping = typingFrom === partnerId

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 pt-[max(0.625rem,env(safe-area-inset-top))] sm:pt-2.5 border-b border-border bg-muted/50">
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
        onScroll={handleScroll}
        onClick={() => {
          if (reactionPickerFor) setReactionPickerFor(null)
          if (activeActions) setActiveActions(null)
        }}
        onTouchMove={(e) => e.stopPropagation()}
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            {loadingHistory ? (
              <>
                <Loader2 className="size-8 text-muted-foreground/40 animate-spin mb-2" />
                <p className="text-xs text-muted-foreground">
                  Loading messages...
                </p>
              </>
            ) : (
              <>
                <MessageCircle className="size-10 text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground">
                  No messages yet. Say hello!
                </p>
              </>
            )}
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
                isMine
                  ? "flex flex-col items-end"
                  : "flex flex-col items-start",
              )}
            >
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.15 }}
                className="relative max-w-[80%]"
              >
                {/* Reaction picker — absolutely positioned above bubble */}
                <AnimatePresence>
                  {isPickerOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.12 }}
                      className={cn(
                        "absolute bottom-full mb-1 z-50 flex gap-1 rounded-full bg-card border border-border shadow-lg px-2 py-1.5",
                        isMine ? "right-0" : "left-0",
                      )}
                    >
                      {REACTION_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={(e) => {
                            e.stopPropagation()
                            onReact(msg.id, emoji)
                            setReactionPickerFor(null)
                          }}
                          className="size-8 rounded-full hover:bg-muted flex items-center justify-center text-lg transition-transform hover:scale-125"
                        >
                          {emoji}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Reply-to quote */}
                {msg.reply_to && (
                  <div
                    className={cn(
                      "text-[11px] px-3 py-1.5 rounded-t-xl border-l-2 mb-0.5",
                      isMine
                        ? "bg-primary/10 border-primary/40 text-primary-foreground/70"
                        : "bg-muted/80 border-muted-foreground/30 text-muted-foreground",
                    )}
                  >
                    <p className="font-medium text-[10px]">
                      {msg.reply_to.from_name}
                    </p>
                    <p className="truncate">
                      {msg.reply_to.body || "(Image)"}
                    </p>
                  </div>
                )}

                {/* Message bubble */}
                <div
                  className={cn(
                    "rounded-2xl px-3 py-2 text-sm",
                    isMine
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md",
                    msg.reply_to && "rounded-t-md",
                    hasReactions && "mb-3",
                  )}
                  onClick={(e) => handleBubbleTap(msg.id, e.currentTarget)}
                  onDoubleClick={() =>
                    setReactionPickerFor(isPickerOpen ? null : msg.id)
                  }
                >
                  {msg.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={msg.image_url}
                      alt="image"
                      className="max-w-[200px] rounded-lg mb-1 object-contain"
                    />
                  )}
                  {msg.body && (
                    <p className="wrap-break-word whitespace-pre-wrap">
                      {msg.body}
                    </p>
                  )}
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
                      {formatChatTime(msg.ts)}
                    </span>
                    {showStatus && <MessageStatus seen={seenByPartner} />}
                  </div>
                </div>

                {/* Reaction badges — overlapping bottom of bubble (Messenger style) */}
                {hasReactions && (
                  <div
                    className={cn(
                      "absolute -bottom-2 z-1 flex gap-0.5",
                      isMine ? "right-2" : "left-2",
                    )}
                  >
                    {Object.entries(msg.reactions!).map(([emoji, userIds]) => {
                      const iReacted = userIds.includes(currentUserId)
                      return (
                        <button
                          key={emoji}
                          onClick={() => onReact(msg.id, emoji)}
                          className={cn(
                            "flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs border shadow-sm transition-colors",
                            iReacted
                              ? "bg-primary/15 border-primary/30 text-primary"
                              : "bg-card border-border text-muted-foreground hover:bg-muted",
                          )}
                        >
                          <span>{emoji}</span>
                          {userIds.length > 1 && (
                            <span className="text-[10px]">
                              {userIds.length}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* React + Reply triggers — hover on desktop, tap on mobile */}
                <div
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 items-center gap-0.5 transition-opacity hidden sm:flex",
                    isMine ? "-left-16" : "-right-16",
                    "opacity-0 group-hover:opacity-100",
                  )}
                >
                  <button
                    onClick={() =>
                      setReactionPickerFor(isPickerOpen ? null : msg.id)
                    }
                    title="React"
                    className="size-7 rounded-full bg-muted/80 backdrop-blur text-muted-foreground flex items-center justify-center hover:bg-muted hover:text-foreground"
                  >
                    <Smile className="size-4" />
                  </button>
                  <button
                    onClick={() => {
                      setReplyingTo(msg)
                      textareaRef.current?.focus()
                      setActiveActions(null)
                    }}
                    title="Reply"
                    className="size-7 rounded-full bg-muted/80 backdrop-blur text-muted-foreground flex items-center justify-center hover:bg-muted hover:text-foreground"
                  >
                    <Reply className="size-4" />
                  </button>
                </div>
              </motion.div>

              {/* Mobile action bar — shown on tap, above or below the bubble */}
              <AnimatePresence>
                {activeActions?.id === msg.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.12 }}
                    className={cn(
                      "flex items-center gap-1 sm:hidden select-none",
                      activeActions.above ? "order-first mb-1" : "mt-1",
                      isMine ? "justify-end" : "justify-start",
                    )}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setReactionPickerFor(isPickerOpen ? null : msg.id)
                        setActiveActions(null)
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-muted/80 text-muted-foreground text-xs"
                    >
                      <Smile className="size-3.5" />
                      React
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setReplyingTo(msg)
                        textareaRef.current?.focus()
                        setActiveActions(null)
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-muted/80 text-muted-foreground text-xs"
                    >
                      <Reply className="size-3.5" />
                      Reply
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
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

      {/* Reply-to bar */}
      {replyingTo && (
        <div className="px-3 py-2 border-t border-border bg-muted/50 flex items-center gap-2">
          <div className="flex-1 min-w-0 border-l-2 border-primary pl-2">
            <p className="text-[11px] font-medium text-primary truncate">
              {replyingTo.from_name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {replyingTo.body}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 shrink-0"
            onClick={() => setReplyingTo(null)}
          >
            <X className="size-3" />
          </Button>
        </div>
      )}

      {/* Input */}
      <div className="px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] border-t border-border bg-card">
        {/* Image preview */}
        {pendingImage && (
          <div className="relative mb-2 inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pendingImage.previewUrl}
              alt="preview"
              className="max-h-24 rounded-lg object-contain border border-border"
            />
            <button
              title="Remove image"
              onClick={() => {
                URL.revokeObjectURL(pendingImage.previewUrl)
                setPendingImage(null)
              }}
              className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"
            >
              <X className="size-3" />
            </button>
          </div>
        )}
        <div className="flex gap-2 items-end">
          {/* Hidden file input */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            aria-label="Attach image"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="size-9 shrink-0 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Attach image"
          >
            <ImageIcon className="size-4" />
          </button>
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
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
            disabled={!input.trim() && !pendingImage}
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
  const [drafts, setDrafts] = useState<Record<number, string>>({})
  const chatWindowRef = useRef<HTMLDivElement>(null)
  // Prevent SSR/client hydration mismatch (Zustand reads localStorage on client)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Listen for push notification open-chat requests
  const { openWithUserId, clearOpenChat } = useChatStore()

  // Only available for admin, manager, clerk
  const canChat = role === "admin" || role === "manager" || role === "clerk"

  const {
    connected,
    chatUsers,
    messages,
    typingFrom,
    loadingHistory,
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

  // Open chat when triggered from push notification
  useEffect(() => {
    if (openWithUserId && canChat && connected) {
      setIsOpen(true)
      setActiveChat(openWithUserId)
      loadHistory(openWithUserId)
      markRead(openWithUserId)
      clearOpenChat()
    }
  }, [openWithUserId, canChat, connected, loadHistory, markRead, clearOpenChat])

  // Listen for hash param (when app opened from notification with no existing tab)
  useEffect(() => {
    const hash = window.location.hash
    const match = hash.match(/^#chat=(\d+)$/)
    if (match) {
      const senderId = parseInt(match[1], 10)
      useChatStore.getState().openChat(senderId)
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      )
    }
  }, [])

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
    (
      body: string,
      replyTo?: { id: string; body: string; from_name: string },
      imageUrl?: string,
    ) => {
      if (activeChat) {
        sendMessage(activeChat, body, replyTo, imageUrl)
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

  // Lock body scroll on mobile when chat is open (iOS-safe)
  useEffect(() => {
    if (!isOpen) return
    const isMobile = window.matchMedia("(max-width: 639px)").matches
    if (!isMobile) return
    const scrollY = window.scrollY
    document.body.style.position = "fixed"
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = "100%"
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.position = ""
      document.body.style.top = ""
      document.body.style.width = ""
      document.body.style.overflow = ""
      window.scrollTo(0, scrollY)
    }
  }, [isOpen])

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
                loadingHistory={loadingHistory}
                draft={drafts[activeChat] ?? ""}
                onDraftChange={(value) =>
                  setDrafts((prev) => ({ ...prev, [activeChat]: value }))
                }
                onSend={handleSend}
                onTyping={handleTyping}
                onReact={handleReact}
                onBack={handleBack}
                onClose={handleClose}
              />
            ) : (
              <UserList
                users={chatUsers}
                currentUserId={user_id || 0}
                seenBy={seenBy}
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
    const vol = getSoundVolume()

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
      gain.gain.linearRampToValueAtTime(0.25 * vol, start + 0.01)
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
    const vol = getSoundVolume()

    // Quick ascending swoosh (like iMessage send)
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = "sine"
    osc.frequency.setValueAtTime(800, t)
    osc.frequency.linearRampToValueAtTime(1200, t + 0.1)
    gain.gain.setValueAtTime(0.18 * vol, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12)
    osc.start(t)
    osc.stop(t + 0.12)
  } catch {
    // Audio not available
  }
}
