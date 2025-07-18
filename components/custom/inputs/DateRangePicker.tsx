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
import { useEffect, useState } from 'react'
import { DateRange } from 'react-day-picker'
import { useFormContext, useWatch } from 'react-hook-form'

interface DateRangePickerProps {
  name?: string
  onChange?: (range: DateRange) => void
}

const presets: { label: string; range: DateRange }[] = [
  { label: 'Today', range: { from: startOfToday(), to: startOfToday() } },
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

export const DateRangePicker = ({
  name = 'range',
  onChange,
}: DateRangePickerProps) => {
  const { setValue } = useFormContext()
  const formRange = useWatch<{ [key: string]: DateRange }>({ name })

  const defaultRange: DateRange = {
    from: subDays(startOfToday(), 30),
    to: startOfToday(),
  }

  const [open, setOpen] = useState(false)
  const [date, setDate] = useState<DateRange>(
    formRange?.from ? formRange : defaultRange,
  )

  useEffect(() => {
    if (date.from) {
      setValue(name, date, { shouldDirty: true, shouldValidate: true })
      if (onChange) onChange(date)
    }
  }, [date, name, onChange, setValue])

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
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
            onSelect={(range) => {
              if (range?.from) {
                setDate(range)
              }
            }}
          />
          <div className="w-[150px] space-y-2">
            <p className="text-sm font-semibold text-muted-foreground">
              Presets
            </p>
            {presets.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                className={cn(
                  'w-full justify-start text-sm',
                  date.from?.toDateString() ===
                    preset.range.from?.toDateString() &&
                    date.to?.toDateString() ===
                      preset.range.to?.toDateString() &&
                    'bg-muted',
                )}
                onClick={() => {
                  setDate(preset.range)
                  setOpen(false)
                }}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default DateRangePicker
