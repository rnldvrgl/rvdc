"use client"

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
  ArrowRight,
  BookOpen,
  CheckCheck,
  Sparkles,
  X,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"

function DialogEntryCard({
  entry,
  isNew,
  isLast,
}: {
  entry: ChangelogEntry
  isNew: boolean
  isLast: boolean
}) {
  return (
    <div className="flex gap-4">
      {/* Timeline rail */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "size-2.5 rounded-full mt-1.5 shrink-0 ring-2",
            isNew
              ? "bg-primary ring-primary/30"
              : "bg-muted-foreground/30 ring-muted-foreground/10",
          )}
        />
        {!isLast && (
          <div className="w-px flex-1 bg-border mt-1.5" />
        )}
      </div>

      {/* Content */}
      <div className={cn("flex-1 pb-5", isLast && "pb-0")}>
        <div className="flex items-center gap-2 mb-2.5 flex-wrap">
          <span className="text-[10px] font-mono font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            v{entry.version}
          </span>
          {isNew && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/15 text-primary">
              NEW
            </span>
          )}
          <span className="text-sm font-semibold leading-tight">{entry.title}</span>
          <span className="ml-auto text-[10px] text-muted-foreground shrink-0">
            {new Date(entry.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>

        <ul className="space-y-1.5">
          {entry.items.map((item, idx) => {
            const meta = CATEGORY_META[item.category]
            return (
              <li key={idx} className="flex items-start gap-2 text-[13px]">
                <span
                  className={cn(
                    "mt-px shrink-0 rounded px-1.5 py-px text-[10px] font-semibold leading-tight",
                    meta.bg,
                    meta.color,
                  )}
                >
                  {meta.label}
                </span>
                <span className="text-muted-foreground leading-snug">{item.text}</span>
              </li>
            )
          })}
        </ul>
      </div>
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
      <DialogContent
        showCloseButton={false}
        className="max-w-md p-0 overflow-hidden gap-0"
      >
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <DialogTitle className="flex items-center gap-2 text-base">
                <div className="flex items-center justify-center size-7 rounded-lg bg-primary/10">
                  <BookOpen className="size-3.5 text-primary" />
                </div>
                What&apos;s New
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-1 ml-9">
                Updates and changes relevant to your role.
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {unseenVersions.size > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1 text-muted-foreground"
                  onClick={markAllRead}
                >
                  <CheckCheck className="size-3.5" />
                  Mark read
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
        </DialogHeader>

        <Separator />

        <ScrollArea className="max-h-[58vh]">
          <div className="px-5 py-5">
            {entries.length === 0 ? (
              <p className="text-sm text-center text-muted-foreground py-8">
                No changelog entries to show.
              </p>
            ) : (
              entries.map((entry, idx) => (
                <DialogEntryCard
                  key={entry.version}
                  entry={entry}
                  isNew={unseenVersions.has(entry.version)}
                  isLast={idx === entries.length - 1}
                />
              ))
            )}
          </div>
        </ScrollArea>

        <Separator />
        <div className="px-5 py-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full gap-1.5 text-xs text-muted-foreground justify-center"
            asChild
            onClick={handleClose}
          >
            <Link href="/changelog">
              View full changelog
              <ArrowRight className="size-3" />
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
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="mx-3 md:mx-4 mt-2"
          >
            <div className="relative flex items-center gap-3 rounded-xl border border-primary/25 bg-primary/5 dark:bg-primary/10 pl-4 pr-3 py-2.5">
              {/* Left accent line */}
              <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-primary/60" />

              <Sparkles className="size-4 text-primary shrink-0" />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground leading-tight truncate">
                  v{latestUnseen.version} — {latestUnseen.title}
                </p>
                {unseenCount > 1 ? (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    +{unseenCount - 1} more update{unseenCount - 1 > 1 ? "s" : ""}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {latestUnseen.items.length} change{latestUnseen.items.length !== 1 ? "s" : ""} in this release
                  </p>
                )}
              </div>

              <Button
                size="sm"
                className="h-7 text-xs shrink-0 gap-1"
                onClick={() => setDialogOpen(true)}
              >
                See what&apos;s new
                <ArrowRight className="size-3" />
              </Button>

              <button
                type="button"
                onClick={handleDismiss}
                className="flex items-center justify-center size-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                aria-label="Dismiss"
              >
                <X className="size-3.5" />
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
