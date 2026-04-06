"use client"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Item } from "@/lib/constants/interface"
import { useItemMutations } from "@/lib/mutations/useItemMutations"
import { useItems } from "@/lib/queries/inventory/useItems"
import { AlertTriangle, ArrowRight, Check, Loader2, Merge } from "lucide-react"
import { useState } from "react"

interface MergeItemDialogProps {
  /** The item that will be KEPT (target). */
  open: boolean
  targetItem: Item | null
  onClose: () => void
}

export function MergeItemDialog({ open, targetItem, onClose }: MergeItemDialogProps) {
  const [search, setSearch] = useState("")
  const [selectedSource, setSelectedSource] = useState<Item | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  const { mergeItem } = useItemMutations()

  const { data, isLoading } = useItems({
    search,
    limit: 30,
    page: 1,
  })

  // Exclude the target item and already-merged items
  const candidates = (data?.results ?? []).filter(
    (item) => item.id !== targetItem?.id,
  )

  const handleClose = () => {
    setSearch("")
    setSelectedSource(null)
    setConfirmed(false)
    onClose()
  }

  const handleMerge = () => {
    if (!targetItem?.id || !selectedSource?.id) return
    mergeItem.mutate(
      { targetId: targetItem.id, sourceItemId: selectedSource.id },
      { onSuccess: handleClose },
    )
  }

  const isPending = mergeItem.isPending

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Merge className="size-4 text-primary" />
            Merge Duplicate Items
          </DialogTitle>
          <DialogDescription>
            Select the duplicate item to absorb into{" "}
            <span className="font-semibold text-foreground">{targetItem?.name}</span>.
            All transactions, stock quantities, and history from the selected item
            will be moved here. The duplicate will then be archived.
          </DialogDescription>
        </DialogHeader>

        {!confirmed ? (
          <div className="space-y-3">
            <Command className="rounded-lg border border-border/60 shadow-none" shouldFilter={false}>
              <CommandInput
                placeholder="Search items to merge into this one…"
                value={search}
                onValueChange={setSearch}
              />
              <CommandList className="max-h-56">
                {isLoading ? (
                  <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Searching…
                  </div>
                ) : (
                  <>
                    <CommandEmpty>No items found.</CommandEmpty>
                    <CommandGroup>
                      {candidates.map((item) => (
                        <CommandItem
                          key={item.id}
                          value={String(item.id)}
                          onSelect={() => setSelectedSource(item)}
                          className="flex items-center justify-between gap-3 cursor-pointer"
                        >
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium truncate text-sm">{item.name}</span>
                            <span className="text-xs text-muted-foreground font-mono">{item.sku}</span>
                          </div>
                          {selectedSource?.id === item.id && (
                            <Check className="size-4 text-primary shrink-0" />
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>

            {selectedSource && (
              <div className="rounded-lg border border-border/40 bg-muted/30 px-4 py-3">
                <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                  Merge preview
                </p>
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium text-muted-foreground truncate">
                      {selectedSource.name}
                    </span>
                    <span className="text-xs text-muted-foreground/60 font-mono">
                      {selectedSource.sku}
                    </span>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium text-foreground truncate">
                      {targetItem?.name}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {targetItem?.sku}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="size-4 shrink-0" />
              <span className="text-sm font-semibold">This cannot be undone</span>
            </div>
            <p className="text-sm text-amber-700/80 dark:text-amber-300/80">
              <strong>{selectedSource?.name}</strong> will be permanently merged into{" "}
              <strong>{targetItem?.name}</strong>. All sales, services, stock, and expenses
              will be re-linked. The duplicate will be archived.
            </p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          {!confirmed ? (
            <Button
              disabled={!selectedSource || isPending}
              onClick={() => setConfirmed(true)}
            >
              Continue
            </Button>
          ) : (
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={handleMerge}
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Merging…
                </>
              ) : (
                <>
                  <Merge className="size-4 mr-2" />
                  Merge Items
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
