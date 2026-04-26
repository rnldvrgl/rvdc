import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils/helpers"
import { format, getMonth, getYear } from "date-fns"
import { CalendarIcon, Clock3, ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"

type DatePickerMode = "date" | "datetime" | "time" | "month"

type DatePickerProps = {
  field: {
    value: Date | undefined
    onChange: (date: Date | undefined) => void
  }
  withMinMaxDate?: boolean
  label?: string
  description?: string
  minDate?: Date
  maxDate?: Date
  placeholder?: string
  className?: string
  disabled?: boolean
  withoutLabel?: boolean
  required?: boolean
  disablePastDates?: boolean
  disabledDates?: Date[]
  withMessage?: boolean
  captionLayout?: "dropdown" | "dropdown-months"
  mode?: DatePickerMode
  minuteStep?: number
  standalone?: boolean
}

const MONTHS = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December",
] as const

const QUICK_TIME_PRESETS = [
  { label: "8:00 AM", value: "08:00" },
  { label: "9:00 AM", value: "09:00" },
  { label: "12:00 PM", value: "12:00" },
  { label: "1:00 PM", value: "13:00" },
  { label: "5:00 PM", value: "17:00" },
  { label: "6:00 PM", value: "18:00" },
] as const

const clampMinuteStep = (step: number) => {
  if (step <= 0 || step > 60) return 5
  return step
}

const formatTimeValue = (date: Date) => {
  const hour = String(date.getHours()).padStart(2, "0")
  const minute = String(date.getMinutes()).padStart(2, "0")
  return `${hour}:${minute}`
}

const mergeDateAndTime = (baseDate: Date, timeDate: Date) => {
  const merged = new Date(baseDate)
  merged.setHours(
    timeDate.getHours(),
    timeDate.getMinutes(),
    timeDate.getSeconds(),
    timeDate.getMilliseconds(),
  )
  return merged
}

// ─── Month picker sub-component ───────────────────────────────────────────────

function MonthYearPicker({
  value,
  onChange,
  onClose,
}: {
  value: Date | undefined
  onChange: (date: Date) => void
  onClose: () => void
}) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(value ? getYear(value) : getYear(today))

  const selectedMonth = value ? getMonth(value) : null
  const selectedYear = value ? getYear(value) : null

  const handleSelect = (monthIndex: number) => {
    // Build a date at the 1st of the chosen month/year, noon to avoid tz shifts
    const next = new Date(viewYear, monthIndex, 1, 12, 0, 0, 0)
    onChange(next)
    onClose()
  }

  return (
    <div className="w-[280px] p-3 space-y-3">
      {/* Year navigation */}
      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          onClick={() => setViewYear((y) => y - 1)}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="text-sm font-semibold tabular-nums">{viewYear}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          onClick={() => setViewYear((y) => y + 1)}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {/* Month grid */}
      <div className="grid grid-cols-3 gap-1.5">
        {MONTHS.map((name, idx) => {
          const isSelected = selectedMonth === idx && selectedYear === viewYear
          const isToday = getMonth(today) === idx && getYear(today) === viewYear

          return (
            <Button
              key={name}
              type="button"
              variant={isSelected ? "default" : "ghost"}
              size="sm"
              onClick={() => handleSelect(idx)}
              className={cn(
                "h-9 rounded-lg text-xs font-medium transition-colors",
                !isSelected && isToday && "border border-primary/40 text-primary",
              )}
            >
              {name.slice(0, 3)}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main DatePicker ──────────────────────────────────────────────────────────

const DatePicker = ({
  field,
  label = "Select date",
  description,
  minDate = new Date("1900-01-01"),
  maxDate = new Date(),
  placeholder = "Pick a date",
  disabled,
  className,
  disablePastDates,
  disabledDates = [],
  withMinMaxDate,
  captionLayout = "dropdown",
  required,
  withoutLabel,
  withMessage,
  mode = "date",
  minuteStep = 5,
  standalone = false,
}: DatePickerProps) => {
  const [open, setOpen] = useState(false)

  const isMonthMode = mode === "month"

  const displayFormat = isMonthMode
    ? "MMMM yyyy"
    : mode === "datetime"
      ? "PPP p"
      : mode === "time"
        ? "hh:mm aa"
        : "PPP"

  const safeMinuteStep = clampMinuteStep(minuteStep)

  const getOrCreateValue = () => {
    if (field.value) return new Date(field.value)
    const fallback = new Date()
    fallback.setSeconds(0, 0)
    return fallback
  }

  const setTimeFromString = (timeValue: string) => {
    const [hoursText, minutesText] = timeValue.split(":")
    const parsedHours = Number.parseInt(hoursText, 10)
    const parsedMinutes = Number.parseInt(minutesText, 10)
    if (Number.isNaN(parsedHours) || Number.isNaN(parsedMinutes)) return
    const next = getOrCreateValue()
    next.setHours(parsedHours, parsedMinutes, 0, 0)
    field.onChange(next)
  }

  const onSelectDate = (date: Date | undefined) => {
    if (!date) { field.onChange(undefined); setOpen(false); return }
    if (mode === "date") {
      date.setHours(12, 0, 0, 0)
      field.onChange(date)
      setOpen(false)
      return
    }
    const current = getOrCreateValue()
    const merged = mergeDateAndTime(date, current)
    merged.setSeconds(0, 0)
    field.onChange(merged)
  }

  const selectedTimeValue = field.value ? formatTimeValue(field.value) : ""

  const triggerButton = (
    <Button
      disabled={disabled}
      variant="outline"
      className={cn(
        "w-full pl-3 text-left font-normal",
        !field.value && "text-muted-foreground",
      )}
    >
      {field.value ? format(field.value, displayFormat) : <span>{placeholder}</span>}
      {mode === "time" ? (
        <Clock3 className="ml-auto h-4 w-4 opacity-50" />
      ) : (
        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
      )}
    </Button>
  )

  const picker = (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>

      <PopoverContent
        className={cn(
          "w-auto p-0",
          isMonthMode && "w-auto",
          mode === "time" && "min-w-[260px]",
        )}
        align="start"
      >
        {/* ── Month-only picker ── */}
        {isMonthMode ? (
          <MonthYearPicker
            value={field.value}
            onChange={(date) => field.onChange(date)}
            onClose={() => setOpen(false)}
          />
        ) : (
          /* ── date / datetime / time pickers (unchanged) ── */
          <div className={cn(mode === "datetime" && "md:flex")}>
            {mode !== "time" && (
              <Calendar
                mode="single"
                buttonVariant="default"
                weekStartsOn={1}
                selected={field.value}
                onSelect={onSelectDate}
                modifiers={{ booked: disabledDates }}
                className="rounded-lg border [--cell-size:--spacing(11)] md:[--cell-size:--spacing(12)]"
                formatters={{
                  formatMonthDropdown: (date) =>
                    date.toLocaleString("default", { month: "long" }),
                }}
                modifiersClassNames={{
                  booked: "[&>button]:line-through opacity-100",
                }}
                disabled={(date: Date) => {
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  const isDisabledDate = disabledDates.some(
                    (d) =>
                      d.getFullYear() === date.getFullYear() &&
                      d.getMonth() === date.getMonth() &&
                      d.getDate() === date.getDate(),
                  )
                  return !!(
                    (disablePastDates && date < today) ||
                    (withMinMaxDate && minDate && date < minDate) ||
                    (withMinMaxDate && maxDate && date > maxDate) ||
                    isDisabledDate
                  )
                }}
                captionLayout={captionLayout}
                defaultMonth={field.value}
              />
            )}

            {mode !== "date" && (
              <div
                className={cn(
                  "space-y-3 p-3",
                  mode === "datetime" && "border-t md:w-[230px] md:border-l md:border-t-0",
                )}
              >
                <p className="text-xs font-medium text-muted-foreground">Select time</p>
                <Input
                  type="time"
                  step={safeMinuteStep * 60}
                  value={selectedTimeValue}
                  onChange={(e) => setTimeFromString(e.target.value)}
                  className="h-10"
                />
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_TIME_PRESETS.map((preset) => (
                    <Button
                      key={preset.value}
                      type="button"
                      variant={selectedTimeValue === preset.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTimeFromString(preset.value)}
                      className="justify-start"
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
                {(mode === "time" || mode === "datetime") && (
                  <div className="flex justify-end">
                    <Button type="button" size="sm" onClick={() => setOpen(false)}>
                      Done
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )

  if (standalone) {
    return (
      <div className={cn("flex flex-col gap-1.5", className)}>
        {!withoutLabel && label && (
          <label className="text-xs font-semibold uppercase tracking-wide sm:text-sm">
            {label}
            {required && <span className="ml-0.5 text-destructive">*</span>}
          </label>
        )}
        {picker}
        {description && (
          <p className="text-xs text-muted-foreground sm:text-sm">{description}</p>
        )}
      </div>
    )
  }

  return (
    <FormItem className={cn("flex flex-col", className)}>
      {!withoutLabel && label && <FormLabel required={required}>{label}</FormLabel>}
      <FormControl>{picker}</FormControl>
      {description && <FormDescription>{description}</FormDescription>}
      {withMessage && <FormMessage />}
    </FormItem>
  )
}

export default DatePicker
