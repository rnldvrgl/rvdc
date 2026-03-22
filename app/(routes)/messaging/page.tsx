"use client"

import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Client,
  Conversation,
  ConversationDetail,
  FBMessage,
} from "@/lib/constants/types"
import { useApiQuery } from "@/lib/hooks/useApiQuery"
import { useMessagingMutations } from "@/lib/mutations/useMessagingMutations"
import {
  useConversationDetail,
  useConversations,
} from "@/lib/queries/useConversations"
import { cn } from "@/lib/utils/helpers"
import {
  Link2,
  Link2Off,
  MessageCircle,
  Search,
  Send,
  User,
} from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

// ─── Link Client Dialog ──────────────────────────────────────────────────────

function LinkClientDialog({
  open,
  onClose,
  conversation,
  onLink,
}: {
  open: boolean
  onClose: () => void
  conversation: Conversation | null
  onLink: (clientId: number | null) => void
}) {
  const [search, setSearch] = useState("")
  const { data: clients } = useApiQuery<{ results: Client[] }>({
    queryKey: ["clients-search", search],
    url: "/clients/",
    params: { search, limit: 10 },
    enabled: open && search.length > 0,
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Link to Client</DialogTitle>
          <DialogDescription>
            Search for a client to link to this conversation (
            {conversation?.fb_user_name}).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder="Search client name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="max-h-60 overflow-y-auto space-y-1">
            {clients?.results?.map((client) => (
              <button
                key={client.id}
                className="w-full text-left px-3 py-2 rounded-md hover:bg-muted text-sm flex justify-between items-center"
                onClick={() => {
                  onLink(client.id)
                  onClose()
                }}
              >
                <span className="font-medium">{client.full_name}</span>
                <span className="text-muted-foreground text-xs">
                  {client.contact_number || "No contact"}
                </span>
              </button>
            ))}
            {search.length > 0 && clients?.results?.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No clients found.
              </p>
            )}
          </div>
        </div>
        {conversation?.client && (
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onLink(null)
                onClose()
              }}
            >
              <Link2Off className="size-4 mr-2" />
              Unlink Client
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─── Conversation List ───────────────────────────────────────────────────────

function ConversationList({
  conversations,
  isLoading,
  selectedId,
  onSelect,
  search,
  onSearchChange,
}: {
  conversations: Conversation[]
  isLoading: boolean
  selectedId: number | null
  onSelect: (id: number) => void
  search: string
  onSearchChange: (v: string) => void
}) {
  if (isLoading) {
    return (
      <div className="space-y-2 p-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-16 w-full rounded-lg"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              <MessageCircle className="size-10 mx-auto mb-3 opacity-40" />
              <p>No conversations yet</p>
              <p className="text-xs mt-1">
                Messages from your Facebook Page will appear here.
              </p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-lg transition-colors",
                  "hover:bg-muted/50",
                  selectedId === conv.id && "bg-muted",
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="size-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm truncate">
                        {conv.fb_user_name || "Unknown User"}
                      </span>
                      {conv.unread_count > 0 && (
                        <Badge
                          variant="default"
                          className="text-[10px] px-1.5 py-0 min-w-5 justify-center"
                        >
                          {conv.unread_count}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {conv.client_name && (
                        <span className="text-xs text-primary/70 shrink-0">
                          [{conv.client_name}]
                        </span>
                      )}
                      <p className="text-xs text-muted-foreground truncate">
                        {conv.last_message_preview || "No messages"}
                      </p>
                    </div>
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

// ─── Chat Panel ──────────────────────────────────────────────────────────────

function ChatPanel({
  conversation,
  isLoading,
  onSend,
  isSending,
  onLinkClient,
}: {
  conversation: ConversationDetail | null
  isLoading: boolean
  onSend: (text: string) => void
  isSending: boolean
  onLinkClient: () => void
}) {
  const [text, setText] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [conversation?.messages, scrollToBottom])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    onSend(trimmed)
    setText("")
  }

  if (!conversation && !isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <MessageCircle className="size-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Select a conversation to start</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="border-b p-4">
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton
              key={i}
              className={cn(
                "h-10 rounded-lg",
                i % 2 === 0 ? "w-2/3" : "w-1/2 ml-auto",
              )}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="border-b px-4 py-3 flex items-center justify-between shrink-0">
        <div>
          <h3 className="font-semibold text-sm">
            {conversation!.fb_user_name || "Unknown User"}
          </h3>
          {conversation!.client_name ? (
            <p className="text-xs text-primary/70">
              Linked: {conversation!.client_name}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Not linked to client
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onLinkClient}
        >
          <Link2 className="size-4 mr-1.5" />
          {conversation!.client ? "Change Client" : "Link Client"}
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-3">
        <div className="space-y-3">
          {conversation!.messages.map((msg: FBMessage) => (
            <MessageBubble
              key={msg.id}
              message={msg}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Reply Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t px-4 py-3 flex gap-2 shrink-0"
      >
        <Input
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1"
          disabled={isSending}
        />
        <Button
          type="submit"
          size="icon"
          disabled={isSending || !text.trim()}
        >
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  )
}

function MessageBubble({ message }: { message: FBMessage }) {
  const isOutgoing = message.direction === "out"
  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <div className={cn("flex", isOutgoing ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-xl px-3 py-2",
          isOutgoing ? "bg-primary text-primary-foreground" : "bg-muted",
        )}
      >
        {message.text && (
          <p className="text-sm whitespace-pre-wrap wrap-break-word">
            {message.text}
          </p>
        )}
        {message.attachments?.length > 0 && (
          <div className="mt-1 space-y-1">
            {message.attachments.map((att, i) =>
              att.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={att.url}
                  alt="attachment"
                  className="rounded-lg max-w-full max-h-64"
                />
              ) : (
                <a
                  key={i}
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs underline"
                >
                  View attachment
                </a>
              ),
            )}
          </div>
        )}
        <div
          className={cn(
            "text-[10px] mt-1",
            isOutgoing ? "text-primary-foreground/70" : "text-muted-foreground",
          )}
        >
          {time}
          {isOutgoing && message.sent_by_name && (
            <span className="ml-1">· {message.sent_by_name}</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function MessagingPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [search, setSearch] = useState("")
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)

  const { data: conversations, isLoading, refetch } = useConversations(search)
  const { data: detail, isLoading: detailLoading } =
    useConversationDetail(selectedId)
  const { sendMessage, linkClient } = useMessagingMutations()

  const selectedConversation =
    conversations?.find((c) => c.id === selectedId) ?? null

  const handleSend = (text: string) => {
    if (!selectedId) return
    sendMessage.mutate({ conversationId: selectedId, text })
  }

  const handleLink = (clientId: number | null) => {
    if (!selectedId) return
    linkClient.mutate({ conversationId: selectedId, clientId })
  }

  return (
    <Wrapper>
      <PageHeader
        icon={MessageCircle}
        title="Messaging"
        description="View and reply to Facebook Page messages from your customers."
        breadcrumbs={["Dashboard", "Messaging"]}
        onRefresh={refetch}
      />

      <Card className="h-[calc(100vh-220px)] flex overflow-hidden">
        {/* Left: Conversation List */}
        <div className="w-80 border-r shrink-0 flex flex-col">
          <ConversationList
            conversations={conversations || []}
            isLoading={isLoading}
            selectedId={selectedId}
            onSelect={setSelectedId}
            search={search}
            onSearchChange={setSearch}
          />
        </div>

        {/* Right: Chat Panel */}
        <div className="flex-1 flex flex-col">
          <ChatPanel
            conversation={detail || null}
            isLoading={detailLoading && selectedId !== null}
            onSend={handleSend}
            isSending={sendMessage.isPending}
            onLinkClient={() => setLinkDialogOpen(true)}
          />
        </div>
      </Card>

      <LinkClientDialog
        open={linkDialogOpen}
        onClose={() => setLinkDialogOpen(false)}
        conversation={selectedConversation}
        onLink={handleLink}
      />
    </Wrapper>
  )
}
