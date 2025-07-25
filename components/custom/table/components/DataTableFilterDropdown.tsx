'use client'

import { Filter as FilterIcon, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { FilterDefinition } from '@/lib/constants/interface'
import { useNavigation } from '@/lib/hooks/useNavigation'
import useSearchParameters from '@/lib/hooks/useSearchParameters'
import { cn } from '@/lib/utils/helpers'

const EXCLUDED_KEYS = new Set(['start_date', 'end_date'])

interface Props {
  filters: FilterDefinition[]
}

export function DataTableFilterDropdown({ filters }: Props) {
  const { push } = useNavigation()
  const { filter = {}, ...rest } = useSearchParameters()

  const [open, setOpen] = useState(false)
  const [entries, setEntries] = useState<{ key: string; value: string }[]>([])

  const triggerChange = (next: { key: string; value: string }[]) => {
    const newFilters = Object.fromEntries(next.map((e) => [e.key, e.value]))
    const preserved = Object.fromEntries(
      Object.entries(filter).filter(([key]) => EXCLUDED_KEYS.has(key)),
    )
    push({ ...rest, filter: { ...preserved, ...newFilters } })
    setEntries(next)
  }

  const handleKeyChange = (index: number, newKey: string) => {
    const next = [...entries]
    const defaultValue =
      filters.find((f) => f.key === newKey)?.options[0]?.value ?? ''
    next[index] = { key: newKey, value: defaultValue }
    triggerChange(next)
  }

  const handleValueChange = (index: number, newValue: string) => {
    const next = [...entries]
    next[index] = { ...next[index], value: newValue }
    triggerChange(next)
  }

  const handleRemove = (index: number) => {
    const next = [...entries]
    next.splice(index, 1)
    triggerChange(next)
  }

  const handleAdd = () => {
    const usedKeys = new Set(entries.map((e) => e.key))
    const firstUnused = filters.find((f) => !usedKeys.has(f.key))
    if (!firstUnused) return
    const newEntry = {
      key: firstUnused.key,
      value: firstUnused.options[0]?.value ?? '',
    }
    triggerChange([...entries, newEntry])
  }

  const handleReset = () => {
    const preserved = Object.fromEntries(
      Object.entries(filter).filter(([key]) => EXCLUDED_KEYS.has(key)),
    )
    push({ ...rest, filter: preserved })
    setEntries([])
  }

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <Button variant="outline">
          <FilterIcon className="mr-1.5 h-4 w-4" />
          Filter
          {entries.length > 0 && (
            <Badge
              variant="secondary"
              className="ml-2 h-[18px] rounded px-[6px] font-mono text-[10px]"
            >
              {entries.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="flex w-full flex-col gap-3.5 p-4 sm:min-w-[380px]"
        align="start"
      >
        <div className="flex flex-col gap-1">
          <h4 className="font-medium leading-none">
            {entries.length > 0 ? 'Filter by' : 'No filters applied'}
          </h4>
          <p
            className={cn(
              'text-muted-foreground text-sm',
              entries.length > 0 && 'sr-only',
            )}
          >
            {entries.length > 0
              ? 'Modify filters to narrow down results.'
              : 'Add filters to narrow down results.'}
          </p>
        </div>

        <ul className="flex max-h-[300px] flex-col gap-2 overflow-y-auto">
          {entries.map((entry, index) => {
            const currentField = filters.find((f) => f.key === entry.key)

            return (
              <div
                key={index}
                className="flex items-center gap-1"
              >
                {/* Field Selector */}
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
                        entries.findIndex(
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

                {/* Value Selector */}
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

                {/* Remove Filter */}
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
            disabled={entries.length >= filters.length}
          >
            Add Filter
          </Button>

          {entries.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="rounded"
              onClick={handleReset}
            >
              Reset filters
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
