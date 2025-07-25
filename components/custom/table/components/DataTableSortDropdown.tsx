'use client'

import { ArrowDownUp, Trash2 } from 'lucide-react'
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

import { SortOption } from '@/lib/constants/interface'
import { SortState } from '@/lib/constants/types'
import { useNavigation } from '@/lib/hooks/useNavigation'
import useSearchParameters from '@/lib/hooks/useSearchParameters'
import { cn } from '@/lib/utils/helpers'

interface DataTableSortDropdownProps {
  options: SortOption[]
  value: SortState[]
  onChange: (next: SortState[]) => void
}

export function DataTableSortDropdown({
  options,
  value,
  onChange,
}: DataTableSortDropdownProps) {
  const [open, setOpen] = useState(false)
  const { push } = useNavigation()
  const { limit, search, filter } = useSearchParameters()

  const triggerChange = (next: SortState[]) => {
    onChange(next)
    const ordering = next.map((s) => (s.desc ? `-${s.id}` : s.id)).join(',')
    push({
      page: 1,
      limit,
      ordering: ordering || undefined,
      search,
      filter,
    })
  }

  const handleFieldChange = (index: number, id: string) => {
    const next = [...value]
    next[index] = { ...next[index], id }
    triggerChange(next)
  }

  const handleDirectionChange = (index: number, desc: boolean) => {
    const next = [...value]
    next[index] = { ...next[index], desc }
    triggerChange(next)
  }

  const handleRemove = (index: number) => {
    const next = [...value]
    next.splice(index, 1)
    triggerChange(next)
  }

  const handleAdd = () => {
    const usedIds = new Set(value.map((v) => v.id))
    const firstUnused = options.find((opt) => !usedIds.has(opt.value))
    if (!firstUnused) return
    onChange([...value, { id: firstUnused.value, desc: false }])
  }

  const handleReset = () => {
    onChange([])
    push({
      page: 1,
      limit,
      ordering: undefined,
      search,
      filter,
    })
  }

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <Button variant="outline">
          <ArrowDownUp className="mr-1.5 h-4 w-4" />
          Sort
          {value.length > 0 && (
            <Badge
              variant="secondary"
              className="ml-2 h-[18px] rounded px-[6px] font-mono text-[10px]"
            >
              {value.length}
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
            {value.length > 0 ? 'Sort by' : 'No sorting applied'}
          </h4>
          <p
            className={cn(
              'text-muted-foreground text-sm',
              value.length > 0 && 'sr-only',
            )}
          >
            {value.length > 0
              ? 'Modify sorting to organize your rows.'
              : 'Add sorting to organize your rows.'}
          </p>
        </div>

        <ul className="flex max-h-[300px] flex-col gap-2 overflow-y-auto">
          {value.map((sort, index) => (
            <div
              key={index}
              className="flex items-center gap-1"
            >
              {/* Field Selector */}
              <Select
                value={sort.id}
                onValueChange={(val) => handleFieldChange(index, val)}
              >
                <SelectTrigger className="flex-1 min-w-0 h-8">
                  <SelectValue placeholder="Field" />
                </SelectTrigger>
                <SelectContent>
                  {options.map((opt) => {
                    const isUsedElsewhere =
                      value.findIndex(
                        (v, i) => v.id === opt.value && i !== index,
                      ) !== -1
                    return (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        disabled={isUsedElsewhere}
                      >
                        {opt.label}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>

              {/* Direction Selector */}
              <Select
                value={sort.desc ? 'desc' : 'asc'}
                onValueChange={(val) =>
                  handleDirectionChange(index, val === 'desc')
                }
              >
                <SelectTrigger className="w-[85px] h-8">
                  <SelectValue placeholder="Dir" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Asc</SelectItem>
                  <SelectItem value="desc">Desc</SelectItem>
                </SelectContent>
              </Select>

              {/* Remove Sort */}
              <Button
                size="icon"
                variant="plain"
                className="size-8 text-destructive"
                onClick={() => handleRemove(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </ul>

        <div className="flex w-full items-center gap-2">
          <Button
            size="sm"
            className="rounded"
            onClick={handleAdd}
            disabled={value.length >= options.length}
          >
            Add Sort
          </Button>

          {value.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="rounded"
              onClick={handleReset}
            >
              Reset sorting
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
