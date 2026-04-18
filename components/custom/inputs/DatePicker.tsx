import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils/helpers"
import { format } from "date-fns"
import { CalendarIcon, Clock3 } from "lucide-react"
import { useState } from "react"

type DatePickerMode = "date" | "datetime" | "time"

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
}

const TIME_HOURS = Array.from({ length: 12 }, (_, i) => i + 1)

const clampMinuteStep = (step: number) => {
  if (step <= 0 || step > 60) return 5
  return step
}

const minuteOptions = (step: number) => {
  const safeStep = clampMinuteStep(step)
  return Array.from({ length: Math.ceil(60 / safeStep) }, (_, i) => i * safeStep)
    .filter((minute) => minute < 60)
}

const hour12FromDate = (date: Date) => {
  const hours = date.getHours()
  return hours % 12 === 0 ? 12 : hours % 12
}

const ampmFromDate = (date: Date) => (date.getHours() >= 12 ? "PM" : "AM")

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
}: DatePickerProps) => {
  const [open, setOpen] = useState(false)
  const displayFormat =
    mode === "datetime" ? "PPP p" : mode === "time" ? "hh:mm aa" : "PPP"

  const getOrCreateValue = () => {
    if (field.value) return new Date(field.value)
    const fallback = new Date()
    fallback.setSeconds(0, 0)
    return fallback
  }

  const setTimePart = (
    type: "hour" | "minute" | "ampm",
    rawValue: string,
  ) => {
    const next = getOrCreateValue()

    if (type === "hour") {
      const nextHour12 = Number.parseInt(rawValue, 10)
      const isPm = ampmFromDate(next) === "PM"
      if (isPm) {
        next.setHours(nextHour12 === 12 ? 12 : nextHour12 + 12)
      } else {
        next.setHours(nextHour12 === 12 ? 0 : nextHour12)
      }
    }

    if (type === "minute") {
      next.setMinutes(Number.parseInt(rawValue, 10))
    }

    if (type === "ampm") {
      const currentHours = next.getHours()
      const isCurrentlyPm = currentHours >= 12
      if (rawValue === "PM" && !isCurrentlyPm) {
        next.setHours(currentHours + 12)
      } else if (rawValue === "AM" && isCurrentlyPm) {
        next.setHours(currentHours - 12)
      }
    }

    field.onChange(next)
  }

  const onSelectDate = (date: Date | undefined) => {
    if (!date) {
      field.onChange(undefined)
      setOpen(false)
      return
    }

    if (mode === "date") {
      // Set to noon to avoid timezone date-shifting on serialization.
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

  const selectedHour12 = field.value ? hour12FromDate(field.value) : 8
  const selectedMinute = field.value ? field.value.getMinutes() : 0
  const selectedAmPm = field.value ? ampmFromDate(field.value) : "AM"
  const minuteValues = minuteOptions(minuteStep)
  const selectedMinuteForList = minuteValues.includes(selectedMinute)
    ? selectedMinute
    : minuteValues[0]

  return (
    <FormItem className={cn("flex flex-col", className)}>
      {!withoutLabel && label && (
        <FormLabel required={required}>{label}</FormLabel>
      )}
      <Popover
        open={open}
        onOpenChange={setOpen}
      >
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              disabled={disabled}
              variant="outline"
              className={cn(
                "w-full pl-3 text-left font-normal",
                !field.value && "text-muted-foreground",
              )}
            >
              {field.value ? (
                format(field.value, displayFormat)
              ) : (
                <span>{placeholder}</span>
              )}
              {mode === "time" ? (
                <Clock3 className="ml-auto h-4 w-4 opacity-50" />
              ) : (
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              )}
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent
          className={cn("w-auto p-0", mode === "time" && "min-w-[260px]")}
          align="start"
        >
          <div className={cn(mode === "datetime" && "md:flex")}> 
            {mode !== "time" && (
              <Calendar
                mode="single"
                buttonVariant="default"
                weekStartsOn={1}
                selected={field.value}
                onSelect={onSelectDate}
                modifiers={{
                  booked: disabledDates,
                }}
                className="rounded-lg border [--cell-size:--spacing(11)] md:[--cell-size:--spacing(12)]"
                formatters={{
                  formatMonthDropdown: (date) => {
                    return date.toLocaleString("default", { month: "long" })
                  },
                }}
                modifiersClassNames={{
                  booked: "[&>button]:line-through opacity-100",
                }}
                disabled={(date: Date) => {
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)

                  const isDisabledDate = disabledDates.some(
                    (disabledDate) =>
                      disabledDate.getFullYear() === date.getFullYear() &&
                      disabledDate.getMonth() === date.getMonth() &&
                      disabledDate.getDate() === date.getDate(),
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
                  "space-y-2 p-3",
                  mode === "datetime" &&
                    "border-t md:w-[230px] md:border-l md:border-t-0",
                )}
              >
                <p className="text-xs font-medium text-muted-foreground">
                  Select time
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <Select
                    value={String(selectedHour12)}
                    onValueChange={(value) => setTimePart("hour", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_HOURS.map((hour) => (
                        <SelectItem
                          key={hour}
                          value={String(hour)}
                        >
                          {hour}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={String(selectedMinuteForList)}
                    onValueChange={(value) => setTimePart("minute", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {minuteValues.map((minute) => (
                        <SelectItem
                          key={minute}
                          value={String(minute)}
                        >
                          {String(minute).padStart(2, "0")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={selectedAmPm}
                    onValueChange={(value) => setTimePart("ampm", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AM">AM</SelectItem>
                      <SelectItem value="PM">PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {mode === "time" && (
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setOpen(false)}
                    >
                      Done
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
      {description && <FormDescription>{description}</FormDescription>}
      {withMessage && <FormMessage />}
    </FormItem>
  )
}

export default DatePicker
