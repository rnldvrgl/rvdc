"use client"

import { EmptyState } from "@/components/custom/EmptyState"
import { ListCardSkeleton } from "@/components/custom/shared/skeletons"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCalendarEvents } from "@/lib/queries/calendar/useCalendarEvents"
import { cn, formatDateToYMD } from "@/lib/utils/helpers"
import { format } from "date-fns"
import { Cake, Sparkles } from "lucide-react"

export function BirthdayReminders({ className }: { className?: string }) {
    const today = new Date()
    const nextWeek = new Date()
    nextWeek.setDate(today.getDate() + 7)

    const { data: events, isLoading } = useCalendarEvents({
        start: formatDateToYMD(today),
        end: formatDateToYMD(nextWeek),
    })

    const birthdays =
        events
            ?.filter((event) => event.extendedProps.type === "birthday")
            .sort((a, b) => {
                const dateA = new Date(a.start).getTime()
                const dateB = new Date(b.start).getTime()
                return dateA - dateB
            }) || []

    if (isLoading) {
        return <ListCardSkeleton rows={3} />
    }

    if (birthdays.length === 0) {
        return (
            <EmptyState
                title="No upcoming birthdays"
                description="There are no birthdays in the next 7 days."
                icon={Cake}
                className={cn("h-full", className)}
            />
        )
    }

    return (
        <Card className={cn("h-full", className)}>
            <CardHeader>
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-950 shrink-0">
                        <Cake className="size-4 text-pink-600 dark:text-pink-400" />
                    </div>
                    <span className="truncate">Upcoming Birthdays</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {birthdays.map((birthday, index) => {
                    const birthdayDate = new Date(birthday.start)
                    const isToday = birthdayDate.toDateString() === today.toDateString()

                    return (
                        <div
                            key={index}
                            className="flex items-center gap-3 p-3 rounded-lg border transition-colors hover:bg-accent/50 border-pink-200/50 dark:border-pink-900/30"
                        >
                            <div className="size-9 shrink-0 rounded-full bg-linear-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                                {birthday.extendedProps.user_name?.[0]?.toUpperCase() || "?"}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">
                                    {birthday.extendedProps.user_name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {isToday ? (
                                        <span className="text-pink-600 dark:text-pink-400 font-medium">
                                            Today 🎉
                                        </span>
                                    ) : (
                                        format(birthdayDate, "MMM dd")
                                    )}
                                </p>
                            </div>
                            {isToday && (
                                <Sparkles className="size-4 text-pink-500 animate-pulse shrink-0" />
                            )}
                        </div>
                    )
                })}
            </CardContent>
        </Card>
    )
}
