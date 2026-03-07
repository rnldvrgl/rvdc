"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
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
import {
  HalfDayScheduleCreate,
  useCreateHalfDaySchedule,
  useUpdateHalfDaySchedule,
} from "@/lib/queries/useHalfDaySchedules"
import { cn } from "@/lib/utils/helpers"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { CalendarIcon, Loader2 } from "lucide-react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"

const halfDaySchema = z.object({
  date: z.string().min(1, "Date is required"),
  schedule_type: z.enum(["half_day", "shop_closed"]),
  reason: z.string().optional(),
})

type HalfDayFormValues = z.infer<typeof halfDaySchema>

interface HalfDayScheduleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  schedule?: {
    id: number
    date: string
    schedule_type?: "half_day" | "shop_closed"
    reason?: string
  } | null
  defaultScheduleType?: "half_day" | "shop_closed"
}

export function HalfDayScheduleDialog({
  open,
  onOpenChange,
  schedule,
  defaultScheduleType = "half_day",
}: HalfDayScheduleDialogProps) {
  const createMutation = useCreateHalfDaySchedule()
  const updateMutation = useUpdateHalfDaySchedule()

  const form = useForm<HalfDayFormValues>({
    resolver: zodResolver(halfDaySchema),
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      schedule_type: defaultScheduleType,
      reason: "",
    },
  })

  const scheduleType = form.watch("schedule_type")

  // Update form when schedule changes
  useEffect(() => {
    if (schedule) {
      form.reset({
        date: schedule.date,
        schedule_type: schedule.schedule_type || "half_day",
        reason: schedule.reason || "",
      })
    } else {
      form.reset({
        date: format(new Date(), "yyyy-MM-dd"),
        schedule_type: defaultScheduleType,
        reason: "",
      })
    }
  }, [schedule, form, defaultScheduleType])

  const onSubmit = async (data: HalfDayFormValues) => {
    try {
      if (schedule) {
        await updateMutation.mutateAsync({ id: schedule.id, data })
      } else {
        await createMutation.mutateAsync(data as HalfDayScheduleCreate)
      }
      onOpenChange(false)
      form.reset()
    } catch {
      // Error handling is done in the mutation
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{schedule ? "Edit" : "Add"} Day Schedule</DialogTitle>
          <DialogDescription>
            {schedule
              ? "Update the day schedule details."
              : "Mark a date as half-day or shop closed. This applies to all employees automatically."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="schedule_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Schedule Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="half_day">Half Day</SelectItem>
                      <SelectItem value="shop_closed">Shop Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {scheduleType === "shop_closed"
                      ? "All employees will be marked as Shop Closed with 0 paid hours"
                      : "All employees will be capped at 4 paid hours"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {field.value ? (
                            format(new Date(field.value), "MMMM dd, yyyy")
                          ) : (
                            <span>Pick a date</span>
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
                        selected={
                          field.value ? new Date(field.value) : undefined
                        }
                        onSelect={(date) => {
                          if (date) {
                            field.onChange(format(date, "yyyy-MM-dd"))
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Select the date for this schedule
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Company event, Holiday eve, Inventory day"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Brief reason for this schedule
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {schedule ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
