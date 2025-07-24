'use client'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils/helpers'
import { format, startOfToday, subDays } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { useState } from 'react'
import { DateRange } from 'react-day-picker'

interface DataTableDateRangePickerProps {
  defaultValue?: DateRange
  onChange?: (range: DateRange) => void
}

const presets: { label: string; range: DateRange }[] = [
  {
    label: 'Today',
    range: { from: startOfToday(), to: startOfToday() },
  },
  {
    label: 'Last 7 Days',
    range: { from: subDays(startOfToday(), 6), to: startOfToday() },
  },
  {
    label: 'Last 14 Days',
    range: { from: subDays(startOfToday(), 13), to: startOfToday() },
  },
  {
    label: 'Last 30 Days',
    range: { from: subDays(startOfToday(), 29), to: startOfToday() },
  },
]

export const DataTableDateRangePicker = ({
  defaultValue = { from: subDays(startOfToday(), 30), to: startOfToday() },
  onChange,
}: DataTableDateRangePickerProps) => {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState<DateRange>(defaultValue)

  const handleSelect = (range: DateRange | undefined) => {
    if (!range?.from) return
    setDate(range)
    onChange?.(range)
  }

  const handlePreset = (range: DateRange) => {
    setDate(range)
    onChange?.(range)
    setOpen(false)
  }

  const handleClear = () => {
    const emptyRange = { from: undefined, to: undefined }
    setDate(emptyRange)
    onChange?.(emptyRange)
    setOpen(false)
  }

  const isClearDisabled = !date.from && !date.to

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="max-w-[260px] justify-start text-left"
        >
          <CalendarIcon className="mr-2 size-4" />
          {date.from && date.to ? (
            <>
              {format(date.from, 'LLL dd, y')} – {format(date.to, 'LLL dd, y')}
            </>
          ) : (
            <span>Pick a date range</span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-auto p-4"
        align="end"
      >
        <div className="flex gap-4">
          <Calendar
            mode="range"
            numberOfMonths={2}
            selected={date}
            onSelect={handleSelect}
          />

          <div className="flex w-[150px] flex-col justify-between">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">
                Presets
              </p>
              {presets.map((preset) => {
                const isActive =
                  date.from?.toDateString() ===
                    preset.range.from?.toDateString() &&
                  date.to?.toDateString() === preset.range.to?.toDateString()

                return (
                  <Button
                    key={preset.label}
                    variant="ghost"
                    className={cn(
                      'w-full justify-start text-sm',
                      isActive && 'bg-secondary',
                    )}
                    onClick={() => handlePreset(preset.range)}
                  >
                    {preset.label}
                  </Button>
                )
              })}
            </div>

            <Button
              variant="link"
              className="mt-4 text-sm"
              disabled={isClearDisabled}
              onClick={handleClear}
            >
              Clear Filter
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default DataTableDateRangePicker
