import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils/helpers'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { useState } from 'react'

type DatePickerProps = {
  field: {
    value: Date | undefined
    onChange: (date: Date | undefined) => void
  }
  label?: string
  description?: string
  minDate?: Date
  maxDate?: Date
  placeholder?: string
  className?: string
}

const DatePicker = ({
  field,
  label = 'Select date',
  description,
  minDate = new Date('1900-01-01'),
  maxDate = new Date(),
  placeholder = 'Pick a date',
  className,
}: DatePickerProps) => {
  const [open, setOpen] = useState(false)

  return (
    <FormItem className={cn('flex flex-col', className)}>
      {label && <FormLabel>{label}</FormLabel>}
      <Popover
        open={open}
        onOpenChange={setOpen}
      >
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              variant="outline"
              className={cn(
                'w-full pl-3 text-left font-normal bg-transparent',
                !field.value && 'text-muted-foreground',
              )}
            >
              {field.value ? (
                format(field.value, 'PPP')
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
            selected={field.value}
            onSelect={(date) => {
              field.onChange(date ?? undefined)
              setOpen(false) // close popover on select
            }}
            disabled={(date: Date) =>
              (minDate && date < minDate) || (maxDate && date > maxDate)
            }
            captionLayout="dropdown"
            defaultMonth={field.value}
          />
        </PopoverContent>
      </Popover>
      {description && <FormDescription>{description}</FormDescription>}
      <FormMessage />
    </FormItem>
  )
}

export default DatePicker
