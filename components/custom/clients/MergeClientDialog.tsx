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
import { Client } from "@/lib/constants/types"
import { useClientMutations } from "@/lib/mutations/useClientMutations"
import { useClients } from "@/lib/queries/clients/useClients"
import { AlertTriangle, ArrowRight, Check, Loader2, Merge } from "lucide-react"
import { useState } from "react"

interface MergeClientDialogProps {
  /** The client that will be KEPT (target). */
  open: boolean
  targetClient: Client | null
  onClose: () => void
}

export function MergeClientDialog({
  open,
  targetClient,
  onClose,
}: MergeClientDialogProps) {
  const [search, setSearch] = useState("")
  const [selectedSource, setSelectedSource] = useState<Client | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  const { mergeClient } = useClientMutations()

  const { data, isLoading } = useClients({
    search,
    limit: 30,
    page: 1,
  })

  const candidates = (data?.results ?? []).filter(
    (c) => c.id !== targetClient?.id,
  )

  const handleClose = () => {
    setSearch("")
    setSelectedSource(null)
    setConfirmed(false)
    onClose()
  }

  const handleMerge = () => {
    if (!targetClient?.id || !selectedSource?.id) return
    mergeClient.mutate(
      { targetId: targetClient.id, sourceClientId: selectedSource.id },
      { onSuccess: handleClose },
    )
  }

  const isPending = mergeClient.isPending

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Merge className="size-4 text-primary" />
            Merge Duplicate Clients
          </DialogTitle>
          <DialogDescription>
            Select the duplicate client to absorb into{" "}
            <span className="font-semibold text-foreground">
              {targetClient?.full_name}
            </span>
            . All sales, services, schedules, and records from the selected
            client will be moved here. The duplicate will then be archived.
          </DialogDescription>
        </DialogHeader>

        {!confirmed ? (
          <div className="space-y-3">
            <Command
              className="rounded-lg border border-border/60 shadow-none"
              shouldFilter={false}
            >
              <CommandInput
                placeholder="Search clients to merge into this one…"
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
                    <CommandEmpty>No clients found.</CommandEmpty>
                    <CommandGroup>
                      {candidates.map((client) => (
                        <CommandItem
                          key={client.id}
                          value={String(client.id)}
                          onSelect={() => setSelectedSource(client)}
                          className="flex items-center justify-between gap-3 cursor-pointer"
                        >
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium truncate text-sm">
                              {client.full_name}
                            </span>
                            {client.contact_number && (
                              <span className="text-xs text-muted-foreground">
                                {client.contact_number}
                              </span>
                            )}
                          </div>
                          {selectedSource?.id === client.id && (
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
                      {selectedSource.full_name}
                    </span>
                    {selectedSource.contact_number && (
                      <span className="text-xs text-muted-foreground/60">
                        {selectedSource.contact_number}
                      </span>
                    )}
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium text-foreground truncate">
                      {targetClient?.full_name}
                    </span>
                    {targetClient?.contact_number && (
                      <span className="text-xs text-muted-foreground">
                        {targetClient.contact_number}
                      </span>
                    )}
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
              <strong>{selectedSource?.full_name}</strong> will be permanently
              merged into <strong>{targetClient?.full_name}</strong>. All sales,
              services, schedules, and records will be re-linked. The duplicate
              will be archived.
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
                  Merge Clients
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
