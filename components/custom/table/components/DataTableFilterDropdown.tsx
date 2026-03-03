"use client"

import { Filter as FilterIcon, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { FilterDefinition } from "@/lib/constants/interface"
import { useNavigation } from "@/lib/hooks/useNavigation"
import useSearchParameters from "@/lib/hooks/useSearchParameters"
import { cn } from "@/lib/utils/helpers"

const EXCLUDED_KEYS = new Set(["start_date", "end_date"])

interface Props {
  filters: FilterDefinition[]
  className?: string
}

export function DataTableFilterDropdown({ filters, className }: Props) {
  const { push } = useNavigation()
  const { filter = {}, ...rest } = useSearchParameters()

  const [open, setOpen] = useState(false)
  const [entries, setEntries] = useState<{ key: string; value: string }[]>([])
  const [draft, setDraft] = useState<{ key: string; value: string }[]>([])

  useEffect(() => {
    const initial = Object.entries(filter)
      .filter(([key]) => !EXCLUDED_KEYS.has(key))
      .map(([key, value]) => ({ key, value }))

    const initialJSON = JSON.stringify(initial)
    const entriesJSON = JSON.stringify(entries)

    if (initialJSON !== entriesJSON) {
      setEntries(initial)
      setDraft(initial)
    }
  }, [filter, entries])

  const applyFilters = () => {
    const newFilters = Object.fromEntries(draft.map((e) => [e.key, e.value]))
    const preserved = Object.fromEntries(
      Object.entries(filter).filter(([key]) => EXCLUDED_KEYS.has(key)),
    )
    push({ ...rest, filter: { ...preserved, ...newFilters } })
    setEntries(draft)
    setOpen(false)
  }

  const handleKeyChange = (index: number, newKey: string) => {
    const next = [...draft]
    const defaultValue =
      filters.find((f) => f.key === newKey)?.options[0]?.value ?? ""
    next[index] = { key: newKey, value: defaultValue }
    setDraft(next)
  }

  const handleValueChange = (index: number, newValue: string) => {
    const next = [...draft]
    next[index] = { ...next[index], value: newValue }
    setDraft(next)
  }

  const handleRemove = (index: number) => {
    const next = [...draft]
    next.splice(index, 1)
    setDraft(next)
  }

  const handleAdd = () => {
    const usedKeys = new Set(draft.map((e) => e.key))
    const firstUnused = filters.find((f) => !usedKeys.has(f.key))
    if (!firstUnused) return
    const newEntry = {
      key: firstUnused.key,
      value: firstUnused.options[0]?.value ?? "",
    }
    setDraft([...draft, newEntry])
  }

  const handleReset = () => {
    const preserved = Object.fromEntries(
      Object.entries(filter).filter(([key]) => EXCLUDED_KEYS.has(key)),
    )
    setDraft([])
    setEntries([])
    push({ ...rest, filter: preserved })
    setOpen(false)
  }

  const isDirty = JSON.stringify(entries) !== JSON.stringify(draft)

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "bg-white dark:bg-transparent border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-accent text-slate-900 dark:text-slate-50",
            className,
          )}
        >
          <FilterIcon className="mr-1.5 h-4 w-4" />
          Filter
          {entries.length > 0 && (
            <Badge
              variant="default"
              className="ml-2 h-[18px] rounded px-1.5 font-mono text-[10px] bg-purple-500 hover:bg-purple-600"
            >
              {entries.length}
            </Badge>
          )}
          {isDirty && (
            <span className="ml-2 size-2 rounded-full bg-yellow-500" />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="flex w-full flex-col gap-3.5 p-4 sm:min-w-[380px]"
        align="start"
      >
        <div className="flex flex-col gap-1">
          <h4 className="font-medium leading-none">
            {draft.length > 0 ? "Filter by" : "No filters applied"}
          </h4>
          <p
            className={cn(
              "text-muted-foreground text-sm",
              draft.length > 0 && "sr-only",
            )}
          >
            {draft.length > 0
              ? "Modify filters to narrow down results."
              : "Add filters to narrow down results."}
          </p>
        </div>

        <ul className="flex max-h-[300px] flex-col gap-2 overflow-y-auto">
          {draft.map((entry, index) => {
            const currentField = filters.find((f) => f.key === entry.key)

            return (
              <div
                key={index}
                className="flex items-center gap-1"
              >
                <Select
                  value={entry.key}
                  onValueChange={(val) => handleKeyChange(index, val)}
                >
                  <SelectTrigger className="flex-1 min-w-0 h-8">
                    <SelectValue placeholder="Field" />
                  </SelectTrigger>
                  <SelectContent>
                    {filters.map((f) => {
                      const isUsedElsewhere =
                        draft.findIndex(
                          (e, i) => e.key === f.key && i !== index,
                        ) !== -1
                      return (
                        <SelectItem
                          key={f.key}
                          value={f.key}
                          disabled={isUsedElsewhere}
                        >
                          {f.label}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>

                <Select
                  value={entry.value}
                  onValueChange={(val) => handleValueChange(index, val)}
                >
                  <SelectTrigger className="w-[140px] h-8">
                    <SelectValue placeholder="Value" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentField?.options.map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  size="icon"
                  variant="plain"
                  className="size-8 text-destructive"
                  onClick={() => handleRemove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )
          })}
        </ul>

        <div className="flex w-full items-center gap-2">
          <Button
            size="sm"
            className="rounded"
            onClick={handleAdd}
            disabled={draft.length >= filters.length}
          >
            Add Filter
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="rounded"
            onClick={handleReset}
            disabled={draft.length === 0}
          >
            Reset filters
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="rounded ml-auto"
            onClick={applyFilters}
            disabled={!isDirty}
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
