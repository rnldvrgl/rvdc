/**
 * Custom Calendar Event Dialog
 *
 * Dialog for creating and editing custom calendar events.
 */

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
import { Textarea } from "@/components/ui/textarea"
import {
  CustomCalendarEventCreate,
  useCreateCustomCalendarEvent,
  useUpdateCustomCalendarEvent,
} from "@/lib/queries/calendar/useCustomCalendarEvents"
import { cn } from "@/lib/utils/helpers"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { CalendarIcon, Loader2 } from "lucide-react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"

const eventSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  description: z.string().optional(),
  event_date: z.string().min(1, "Date is required"),
  event_type: z.enum([
    "birthday",
    "meeting",
    "maintenance",
    "training",
    "deadline",
    "other",
  ]),
})

type EventFormValues = z.infer<typeof eventSchema>

interface CustomCalendarEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event?: {
    id: number
    title: string
    description?: string
    event_date: string
    event_type: "birthday" | "meeting" | "maintenance" | "training" | "deadline" | "other"
  } | null
  defaultDate?: Date
}

export function CustomCalendarEventDialog({
  open,
  onOpenChange,
  event,
  defaultDate,
}: CustomCalendarEventDialogProps) {
  const createMutation = useCreateCustomCalendarEvent()
  const updateMutation = useUpdateCustomCalendarEvent()

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      event_date: defaultDate
        ? format(defaultDate, "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd"),
      event_type: "other",
    },
  })

  // Update form when event changes
  useEffect(() => {
    if (event) {
      form.reset({
        title: event.title,
        description: event.description || "",
        event_date: event.event_date,
        event_type: event.event_type,
      })
    } else {
      form.reset({
        title: "",
        description: "",
        event_date: defaultDate
          ? format(defaultDate, "yyyy-MM-dd")
          : format(new Date(), "yyyy-MM-dd"),
        event_type: "other",
      })
    }
  }, [event, defaultDate, form])

  const onSubmit = async (data: EventFormValues) => {
    try {
      if (event) {
        await updateMutation.mutateAsync({ id: event.id, data })
      } else {
        await createMutation.mutateAsync(data as CustomCalendarEventCreate)
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{event ? "Edit Event" : "Create Event"}</DialogTitle>
          <DialogDescription>
            {event
              ? "Update the event details below."
              : "Add a custom event to the calendar."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Event title"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="event_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="birthday">Birthday</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="training">Training</SelectItem>
                      <SelectItem value="deadline">Deadline</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="event_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {field.value ? (
                            format(new Date(field.value), "PPP")
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
                          field.onChange(date ? format(date, "yyyy-MM-dd") : "")
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Event description or notes"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Additional details about the event
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false)
                  form.reset()
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {event ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
