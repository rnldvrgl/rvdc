"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCalendarEvents } from "@/lib/queries/calendar/useCalendarEvents"
import { formatDateToYMD } from "@/lib/utils/helpers"
import { addDays, format } from "date-fns"
import { Calendar } from "lucide-react"

export function UpcomingScheduleCard() {
  const today = new Date()
  const nextWeek = addDays(today, 7)

  const { data: events, isLoading } = useCalendarEvents({
    start: formatDateToYMD(addDays(today, 1)),
    end: formatDateToYMD(nextWeek),
  })

  const schedules =
    events
      ?.filter((event) => event.extendedProps.type === "schedule")
      .sort((a, b) => {
        return new Date(a.start).getTime() - new Date(b.start).getTime()
      }) || []

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="size-5" />
            Upcoming Schedule
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
            <Calendar className="size-5" />
            Upcoming Schedule (Next 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No upcoming schedules</p>
        </CardContent>
      </Card>
    )
  }

  // Group schedules by date
  const schedulesByDate = schedules.reduce(
    (acc, schedule) => {
      const dateKey = new Date(schedule.start).toDateString()
      if (!acc[dateKey]) acc[dateKey] = []
      acc[dateKey].push(schedule)
      return acc
    },
    {} as Record<string, typeof schedules>,
  )

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="size-5" />
          Upcoming Schedule (Next 7 Days)
          <Badge
            variant="secondary"
            className="ml-auto"
            suppressHydrationWarning
          >
            {schedules.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(schedulesByDate)
            .sort(([dateA], [dateB]) => {
              return new Date(dateA).getTime() - new Date(dateB).getTime()
            })
            .slice(0, 5)
            .map(([dateKey, daySchedules]) => {
              const date = new Date(dateKey)
              return (
                <div
                  key={dateKey}
                  className="space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium">
                      {format(date, "EEE, MMM dd")}
                    </div>
                    <Badge
                      variant="outline"
                      className="text-xs"
                    >
                      {daySchedules.length}
                    </Badge>
                  </div>
                  <div className="space-y-1 pl-3 border-l-2">
                    {daySchedules.map((schedule, index) => (
                      <div
                        key={index}
                        className="text-xs text-muted-foreground"
                      >
                        <span className="font-medium">
                          {!schedule.allDay &&
                            format(new Date(schedule.start), "hh:mm a")}
                        </span>
                        {!schedule.allDay && " - "}
                        {schedule.extendedProps.schedule_type_display} (
                        {schedule.extendedProps.client_name})
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
        </div>
      </CardContent>
    </Card>
  )
}
