"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { CATEGORY_META, ChangelogEntry } from "@/lib/constants/changelog"
import { useChangelog } from "@/lib/hooks/useChangelog"
import { cn } from "@/lib/utils/helpers"
import { AnimatePresence, motion } from "framer-motion"
import {
  BookOpen,
  CheckCheck,
  ExternalLink,
  Sparkles,
  X,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"

function EntryCard({
  entry,
  isNew,
}: {
  entry: ChangelogEntry
  isNew: boolean
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-mono font-bold text-muted-foreground">
          v{entry.version}
        </span>
        {isNew && (
          <Badge className="text-[10px] px-1.5 py-0 bg-primary/15 text-primary border-primary/20 font-semibold">
            NEW
          </Badge>
        )}
        <span className="text-sm font-semibold">{entry.title}</span>
        <span className="ml-auto text-[11px] text-muted-foreground">
          {new Date(entry.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      </div>

      <ul className="space-y-2">
        {entry.items.map((item, idx) => {
          const meta = CATEGORY_META[item.category]
          return (
            <li
              key={idx}
              className="flex items-start gap-2.5 text-sm"
            >
              <span
                className={cn(
                  "mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold leading-tight",
                  meta.bg,
                  meta.color,
                )}
              >
                {meta.label}
              </span>
              <span className="text-muted-foreground leading-snug">
                {item.text}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function ChangelogDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const { entries, unseenEntries, markAllRead } = useChangelog()
  const unseenVersions = new Set(unseenEntries.map((e) => e.version))

  function handleClose() {
    markAllRead()
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose()
        else onOpenChange(true)
      }}
    >
      <DialogContent className="max-w-lg p-0 overflow-hidden gap-0">
        <DialogHeader className="px-5 pt-5 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-base">
              <BookOpen className="size-4 text-primary" />
              What&apos;s New
            </DialogTitle>
            <div className="flex items-center gap-2">
              {unseenVersions.size > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1.5 text-muted-foreground"
                  onClick={markAllRead}
                >
                  <CheckCheck className="size-3.5" />
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={handleClose}
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Updates and changes relevant to your role.
          </p>
        </DialogHeader>

        <Separator className="mt-4" />

        <ScrollArea className="max-h-[60vh]">
          <div className="px-5 py-4 space-y-5">
            {entries.length === 0 ? (
              <p className="text-sm text-center text-muted-foreground py-8">
                No changelog entries to show.
              </p>
            ) : (
              entries.map((entry, idx) => (
                <div key={entry.version}>
                  <EntryCard
                    entry={entry}
                    isNew={unseenVersions.has(entry.version)}
                  />
                  {idx < entries.length - 1 && <Separator className="mt-5" />}
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <Separator />
        <div className="px-5 py-3 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs"
            asChild
            onClick={handleClose}
          >
            <Link href="/changelog">
              View full changelog
              <ExternalLink className="size-3" />
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function ChangelogBanner() {
  const { latestUnseen, unseenCount, mounted, markAllRead } = useChangelog()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  if (!mounted || !latestUnseen || dismissed) return null

  function handleDismiss() {
    markAllRead()
    setDismissed(true)
  }

  return (
    <>
      <AnimatePresence>
        {!dismissed && latestUnseen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="mx-3 md:mx-4 mt-2"
          >
            <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm">
              <Sparkles className="size-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-foreground">
                  v{latestUnseen.version} — {latestUnseen.title}
                </span>
                {unseenCount > 1 && (
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    +{unseenCount - 1} more update
                    {unseenCount - 1 > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs shrink-0"
                onClick={() => setDialogOpen(true)}
              >
                See what&apos;s new
              </Button>
              <button
                type="button"
                onClick={handleDismiss}
                className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                aria-label="Dismiss changelog banner"
              >
                <X className="size-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ChangelogDialog
        open={dialogOpen}
        onOpenChange={(v) => {
          setDialogOpen(v)
          if (!v) setDismissed(true)
        }}
      />
    </>
  )
}

/** Small dot badge showing unseen count — used in nav/sidebar */
export function ChangelogUnseenBadge({ className }: { className?: string }) {
  const { unseenCount, mounted } = useChangelog()
  if (!mounted || unseenCount === 0) return null
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-primary text-[10px] font-bold text-primary-foreground px-1",
        className,
      )}
    >
      {unseenCount > 9 ? "9+" : unseenCount}
    </span>
  )
}
