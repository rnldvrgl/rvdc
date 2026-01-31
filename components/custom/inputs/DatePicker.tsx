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
import { cn } from "@/lib/utils/helpers"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { useState } from "react"

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
}: DatePickerProps) => {
  const [open, setOpen] = useState(false)

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
                format(field.value, "PPP")
              ) : (
                <span>{placeholder}</span>
              )}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0"
          align="start"
        >
          <Calendar
            mode="single"
            buttonVariant="default"
            weekStartsOn={1}
            selected={field.value}
            onSelect={(date) => {
              if (!date && field.value) {
                setOpen(false)
                return
              }
              field.onChange(date ?? undefined)
              setOpen(false)
            }}
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

              // Check if date is in disabledDates array
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
        </PopoverContent>
      </Popover>
      {description && <FormDescription>{description}</FormDescription>}
      {withMessage && <FormMessage />}
    </FormItem>
  )
}

export default DatePicker
