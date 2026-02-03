"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCalendarEvents } from "@/lib/queries/calendar/useCalendarEvents"
import { format } from "date-fns"
import { CalendarDays, MapPin } from "lucide-react"

export function TodayScheduleCard() {
  const today = new Date()
  const { data: events, isLoading } = useCalendarEvents({
    start: today.toISOString().split("T")[0],
    end: today.toISOString().split("T")[0],
  })

  const schedules =
    events?.filter((event) => event.extendedProps.type === "schedule") || []

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="size-5" />
            Today&apos;s Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (schedules.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="size-5" />
            Today&apos;s Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No schedules for today
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarDays className="size-5" />
          Today&apos;s Schedule
          <Badge
            variant="secondary"
            className="ml-auto"
          >
            {schedules.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {schedules.map((schedule, index) => (
            <div
              key={index}
              className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {schedule.extendedProps.schedule_type_display}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="size-3" />
                    {schedule.extendedProps.client_name}
                  </p>
                </div>
                {schedule.extendedProps.service_type_display && (
                  <Badge
                    variant="outline"
                    className="text-xs"
                  >
                    {schedule.extendedProps.service_type_display}
                  </Badge>
                )}
              </div>
              {!schedule.allDay && (
                <p className="text-xs text-muted-foreground">
                  {format(new Date(schedule.start), "hh:mm a")}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
