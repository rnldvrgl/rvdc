"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils/helpers"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import React from "react"

interface DateTimePickerProps {
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  disabled?: boolean
  placeholder?: string
  disablePastDates?: boolean
}

export function DateTimePicker({
  value,
  onChange,
  disabled = false,
  placeholder = "MM/DD/YYYY hh:mm aa",
  disablePastDates = true,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [hasDate, setHasDate] = React.useState(false)
  const [hasTime, setHasTime] = React.useState(false)
  const hourScrollRef = React.useRef<HTMLDivElement>(null)
  const minuteScrollRef = React.useRef<HTMLDivElement>(null)
  const ampmScrollRef = React.useRef<HTMLDivElement>(null)

  // Check if value has both date and time
  React.useEffect(() => {
    if (value) {
      setHasDate(true)
      setHasTime(true)
    }
  }, [value])

  function handleDateSelect(date: Date | undefined) {
    if (date) {
      // If we have an existing time, preserve it
      if (value) {
        const newDate = new Date(date)
        newDate.setHours(value.getHours())
        newDate.setMinutes(value.getMinutes())
        onChange(newDate)
        setHasDate(true)

        // If we already have time selected, close the popover
        if (hasTime) {
          setOpen(false)
        }
      } else {
        // Set default time to 8:00 AM
        const newDate = new Date(date)
        newDate.setHours(8)
        newDate.setMinutes(0)
        onChange(newDate)
        setHasDate(true)
        setHasTime(true) // Default time counts as selected
      }
    } else {
      onChange(undefined)
      setHasDate(false)
      setHasTime(false)
    }
  }

  function handleTimeChange(type: "hour" | "minute" | "ampm", val: string) {
    const currentDate = value || new Date()
    const newDate = new Date(currentDate)

    if (type === "hour") {
      const hour = parseInt(val, 10)
      const currentHours = newDate.getHours()
      const isPM = currentHours >= 12

      if (isPM) {
        newDate.setHours(hour === 12 ? 12 : hour + 12)
      } else {
        newDate.setHours(hour === 12 ? 0 : hour)
      }
    } else if (type === "minute") {
      newDate.setMinutes(parseInt(val, 10))
    } else if (type === "ampm") {
      const hours = newDate.getHours()
      if (val === "AM" && hours >= 12) {
        newDate.setHours(hours - 12)
      } else if (val === "PM" && hours < 12) {
        newDate.setHours(hours + 12)
      }
    }

    onChange(newDate)
    setHasTime(true)

    // Auto-close if we have both date and time
    if (hasDate && type !== "hour") {
      // Close after minute or AM/PM selection (not hour to allow adjustment)
      setTimeout(() => setOpen(false), 200)
    }
  }

  function handleScrollWheel(
    e: React.WheelEvent,
    scrollRef: React.RefObject<HTMLDivElement | null>,
  ) {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      )
      if (viewport) {
        viewport.scrollTop += e.deltaY
      }
    }
  }

  // Get today at midnight for comparison
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
          )}
          disabled={disabled}
        >
          {value ? (
            <span className="truncate text-xs sm:text-sm">
              {format(value, "MM/dd/yyyy hh:mm aa")}
            </span>
          ) : (
            <span className="truncate text-xs sm:text-sm">{placeholder}</span>
          )}
          <CalendarIcon className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[calc(100vw-2rem)] sm:w-auto max-w-[calc(100vw-2rem)] p-0 overflow-x-auto"
        align="start"
      >
        <div className="sm:flex">
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleDateSelect}
            disabled={disablePastDates ? (date) => date < today : undefined}
            autoFocus
            weekStartsOn={1}
            className="[--cell-size:--spacing(9)] md:[--cell-size:--spacing(10)]"
            buttonVariant="default"
            formatters={{
              formatMonthDropdown: (date) => {
                return date.toLocaleString("default", { month: "long" })
              },
            }}
          />
          <div className="flex flex-col sm:flex-row sm:h-[340px] divide-y sm:divide-y-0 sm:divide-x">
            {/* Hours */}
            <ScrollArea
              className="w-64 sm:w-auto"
              ref={hourScrollRef}
            >
              <div
                className="flex sm:flex-col p-2"
                onWheel={(e) => handleScrollWheel(e, hourScrollRef)}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1)
                  .reverse()
                  .map((hour) => (
                    <Button
                      key={hour}
                      size="icon"
                      variant={
                        value && value.getHours() % 12 === hour % 12
                          ? "default"
                          : "ghost"
                      }
                      className="sm:w-full shrink-0 aspect-square size-9 md:size-10"
                      onClick={() => handleTimeChange("hour", hour.toString())}
                      type="button"
                    >
                      {hour}
                    </Button>
                  ))}
              </div>
              <ScrollBar
                orientation="horizontal"
                className="sm:hidden"
              />
            </ScrollArea>

            {/* Minutes - 10 minute intervals */}
            <ScrollArea
              className="w-64 sm:w-auto"
              ref={minuteScrollRef}
            >
              <div
                className="flex sm:flex-col p-2"
                onWheel={(e) => handleScrollWheel(e, minuteScrollRef)}
              >
                {Array.from({ length: 6 }, (_, i) => i * 10).map((minute) => (
                  <Button
                    key={minute}
                    size="icon"
                    variant={
                      value && value.getMinutes() === minute
                        ? "default"
                        : "ghost"
                    }
                    className="sm:w-full shrink-0 aspect-square size-9 md:size-10"
                    onClick={() =>
                      handleTimeChange("minute", minute.toString())
                    }
                    type="button"
                  >
                    {minute.toString().padStart(2, "0")}
                  </Button>
                ))}
              </div>
              <ScrollBar
                orientation="horizontal"
                className="sm:hidden"
              />
            </ScrollArea>

            {/* AM/PM */}
            <ScrollArea
              className=""
              ref={ampmScrollRef}
            >
              <div
                className="flex sm:flex-col p-2"
                onWheel={(e) => handleScrollWheel(e, ampmScrollRef)}
              >
                {["AM", "PM"].map((ampm) => (
                  <Button
                    key={ampm}
                    size="icon"
                    variant={
                      value &&
                      ((ampm === "AM" && value.getHours() < 12) ||
                        (ampm === "PM" && value.getHours() >= 12))
                        ? "default"
                        : "ghost"
                    }
                    className="sm:w-full shrink-0 aspect-square size-9 md:size-10"
                    onClick={() => handleTimeChange("ampm", ampm)}
                    type="button"
                  >
                    {ampm}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
