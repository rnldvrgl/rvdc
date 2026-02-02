"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCalendarEvents } from "@/lib/queries/calendar/useCalendarEvents"
import { format } from "date-fns"
import { Cake } from "lucide-react"

export function BirthdayReminders() {
  const today = new Date()
  const nextWeek = new Date()
  nextWeek.setDate(today.getDate() + 7)

  const { data: events, isLoading } = useCalendarEvents({
    start: today.toISOString().split("T")[0],
    end: nextWeek.toISOString().split("T")[0],
  })

  const birthdays =
    events?.filter((event) => event.extendedProps.type === "birthday") || []

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Cake className="size-5 text-green-600" />
            Upcoming Birthdays
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

  if (birthdays.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Cake className="size-5 text-green-600" />
            Upcoming Birthdays
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No birthdays in the next 7 days
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Cake className="size-5 text-green-600" />
          Upcoming Birthdays
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {birthdays.map((birthday, index) => {
            const birthdayDate = new Date(birthday.start)
            const isToday = birthdayDate.toDateString() === today.toDateString()

            return (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg border bg-green-50/50 dark:bg-green-900/10"
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Cake className="size-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {birthday.extendedProps.user_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isToday ? "Today" : format(birthdayDate, "MMM dd")}
                      {isToday && " 🎉"}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
