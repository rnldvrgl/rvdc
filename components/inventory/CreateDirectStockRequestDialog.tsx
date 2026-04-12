"use client"

import { ComboBox } from "@/components/custom/inputs/ComboBox"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Item, Stall } from "@/lib/constants/interface"
import { useCreateDirectStockBatch } from "@/lib/mutations/useStockRequestMutations"
import { useItemChoices } from "@/lib/queries/useChoices"
import { useStalls } from "@/lib/queries/inventory/useStalls"
import { PackagePlus, Plus, Trash2 } from "lucide-react"
import { useMemo, useState } from "react"

interface RequestLine {
  id: number
  item: Item | null
  stall: Stall | null
  requested_quantity: string
  notes: string
}

let _lineId = 0
const nextLineId = () => ++_lineId

function emptyLine(): RequestLine {
  return {
    id: nextLineId(),
    item: null,
    stall: null,
    requested_quantity: "",
    notes: "",
  }
}

interface Props {
  open: boolean
  onClose: () => void
}

export default function CreateDirectStockRequestDialog({ open, onClose }: Props) {
  const [lines, setLines] = useState<RequestLine[]>([emptyLine()])
  const [batchNotes, setBatchNotes] = useState("")

  const { data: items = [] } = useItemChoices()
  const { data: stallsData } = useStalls({ limit: 100 })
  const stalls = useMemo(() => stallsData?.results ?? [], [stallsData])
  const createBatch = useCreateDirectStockBatch()

  const itemOptions = useMemo(
    () =>
      (items as Item[]).map((it) => ({
        value: it.id,
        label: `${it.name} (${it.sku})`,
      })),
    [items],
  )

  const stallOptions = useMemo(
    () => stalls.map((s) => ({ value: s.id, label: s.name })),
    [stalls],
  )

  function updateLine(id: number, patch: Partial<RequestLine>) {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  }

  function removeLine(id: number) {
    setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.id !== id) : prev))
  }

  function addLine() {
    setLines((prev) => [...prev, emptyLine()])
  }

  function handleClose() {
    setLines([emptyLine()])
    setBatchNotes("")
    onClose()
  }

  const isValid = lines.every(
    (l) => l.item && l.stall && Number(l.requested_quantity) > 0,
  )

  async function handleSubmit() {
    if (!isValid) return
    await createBatch.mutateAsync({
      notes: batchNotes,
      items: lines.map((l) => ({
        item: l.item!.id,
        stall: l.stall!.id,
        requested_quantity: Number(l.requested_quantity),
        notes: l.notes,
      })),
    })
    handleClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackagePlus className="h-5 w-5" />
            New Direct Stock Request
          </DialogTitle>
          <DialogDescription>
            Select items and quantities you need restocked. Admin will review and approve each item.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Batch notes */}
          <div className="space-y-1.5">
            <Label>Batch Notes <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Textarea
              value={batchNotes}
              onChange={(e) => setBatchNotes(e.target.value)}
              placeholder="Reason for requesting stock, or any other notes..."
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Header row */}
          <div className="grid grid-cols-[1fr_1fr_100px_28px] gap-2 px-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Item</span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Stall</span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Qty</span>
            <span />
          </div>

          {/* Item lines */}
          <div className="space-y-2">
            {lines.map((line) => (
              <div key={line.id} className="grid grid-cols-[1fr_1fr_100px_28px] gap-2 items-center">
                <ComboBox
                  options={itemOptions}
                  value={line.item?.id ?? null}
                  onChange={(val) => {
                    const found = (items as Item[]).find((i) => i.id === val)
                    updateLine(line.id, { item: found ?? null })
                  }}
                  placeholder="Select item..."
                  searchPlaceholder="Search items..."
                />
                <ComboBox
                  options={stallOptions}
                  value={line.stall?.id ?? null}
                  onChange={(val) => {
                    const found = stalls.find((s) => s.id === val)
                    updateLine(line.id, { stall: found ?? null })
                  }}
                  placeholder="Select stall..."
                  searchPlaceholder="Search stalls..."
                />
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={line.requested_quantity}
                  onChange={(e) => updateLine(line.id, { requested_quantity: e.target.value })}
                  placeholder="0"
                  className="h-9"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => removeLine(line.id)}
                  disabled={lines.length === 1}
                  title="Remove row"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addLine}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Another Item
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={createBatch.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || createBatch.isPending}
          >
            {createBatch.isPending ? "Submitting..." : "Submit Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
