"use client"

import usePendingActionsStore, {
  type PendingAction,
} from "@/lib/store/usePendingActionsStore"
import { cn } from "@/lib/utils/helpers"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronDown, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

function formatElapsed(startedAt: Date) {
  const seconds = Math.floor((Date.now() - startedAt.getTime()) / 1000)
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}m ${secs}s`
}

function ActionItem({ action }: { action: PendingAction }) {
  const [elapsed, setElapsed] = useState(() => formatElapsed(action.startedAt))

  useEffect(() => {
    const interval = setInterval(
      () => setElapsed(formatElapsed(action.startedAt)),
      1000,
    )
    return () => clearInterval(interval)
  }, [action.startedAt])

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="flex items-center gap-2 px-3 py-2 text-sm"
    >
      <Loader2 className="size-3.5 shrink-0 animate-spin text-primary" />
      <span className="truncate flex-1 text-foreground/90">{action.label}</span>
      <span className="text-xs text-muted-foreground tabular-nums shrink-0">
        {elapsed}
      </span>
    </motion.div>
  )
}

export function PendingActions() {
  const actions = usePendingActionsStore((s) => s.actions)
  const [collapsed, setCollapsed] = useState(false)

  if (actions.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className={cn(
        "fixed bottom-20 sm:bottom-6 right-4 sm:right-24 z-50",
        "w-64 rounded-xl border border-border bg-card shadow-lg overflow-hidden",
      )}
    >
      {/* Header */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="flex w-full items-center gap-2 px-3 py-2 bg-primary/5 hover:bg-primary/10 transition-colors"
      >
        <span className="flex size-5 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
          {actions.length}
        </span>
        <span className="text-sm font-medium flex-1 text-left">
          Pending {actions.length === 1 ? "action" : "actions"}
        </span>
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground transition-transform",
            collapsed && "-rotate-180",
          )}
        />
      </button>

      {/* List */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="divide-y divide-border max-h-48 overflow-y-auto">
              <AnimatePresence mode="popLayout">
                {actions.map((action) => (
                  <ActionItem
                    key={action.id}
                    action={action}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
