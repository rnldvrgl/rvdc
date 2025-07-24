'use client'

import { FilterDefinition } from '@/lib/constants/types'
import { useNavigation } from '@/lib/hooks/useNavigation'
import useSearchParameters from '@/lib/hooks/useSearchParameters'
import { Filter as FilterIcon, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import { Label } from '@/components/ui/label'
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

type Props = {
  filters: FilterDefinition[]
}

export function DataTableFilterDropdown({ filters }: Props) {
  const [open, setOpen] = useState(false)
  const [selectedField, setSelectedField] = useState<FilterDefinition | null>(
    null,
  )
  const [inputValue, setInputValue] = useState('')

  const { push } = useNavigation()
  const { filter, ...rest } = useSearchParameters()

  useEffect(() => {
    setInputValue('')
  }, [selectedField])

  const applyFilter = () => {
    if (!selectedField || inputValue === '') return

    push({
      ...rest,
      filter: {
        ...filter,
        [selectedField.key]: inputValue,
      },
    })

    setInputValue('')
    setSelectedField(null)
    setOpen(false)
  }

  const renderSelectField = () => {
    if (!selectedField) return null

    return (
      <Select
        onValueChange={(val) => setInputValue(val)}
        value={inputValue}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select option" />
        </SelectTrigger>
        <SelectContent>
          {selectedField.options?.map((opt) => (
            <SelectItem
              key={opt.value}
              value={String(opt.value)}
            >
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  const EXCLUDED_KEYS = new Set(['start_date', 'end_date'])
  const activeFilterKeys = Object.keys(filter ?? {}).filter(
    (key) => !EXCLUDED_KEYS.has(key),
  )
  const showFilterLabel = activeFilterKeys.length === 0

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="gap-1"
        >
          <FilterIcon className="w-4 h-4" />
          {selectedField === null && showFilterLabel && 'Filter'}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-60  p-2">
        {!selectedField ? (
          <Command>
            <CommandInput placeholder="Search fields..." />
            <CommandGroup>
              {filters.map((f) => {
                const Icon = f.icon
                return (
                  <CommandItem
                    key={f.key}
                    onSelect={() => {
                      setSelectedField(f)
                      setInputValue('')
                    }}
                    className="cursor-pointer"
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    <span className="ml-2">{f.label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </Command>
        ) : (
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault()
              applyFilter()
            }}
          >
            <div className="flex justify-between items-center">
              <Label className="text-sm font-medium">
                {selectedField.label}
              </Label>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => {
                  setSelectedField(null)
                  setInputValue('')
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
            {renderSelectField()}
            <Button
              type="submit"
              className="w-full"
              disabled={inputValue === ''}
            >
              Apply Filter
            </Button>
          </form>
        )}
      </PopoverContent>
    </Popover>
  )
}
