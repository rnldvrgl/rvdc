"use client"

import { ListCardSkeleton } from "@/components/custom/shared/skeletons"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useServices } from "@/lib/queries/services/useServices"
import { usePendingLeaveApprovals } from "@/lib/queries/useAttendance"
import {
  ArrowRight,
  Bell,
  CalendarDays,
  CreditCard,
  TimerOff,
} from "lucide-react"
import Link from "next/link"

export function RemindersAlerts() {
  const { data: pendingLeaves, isLoading: loadingLeaves } =
    usePendingLeaveApprovals()
  const { data: servicesData, isLoading: loadingServices } = useServices({
    limit: 50,
    filter: { status: "in_progress" },
  })
  const services = servicesData?.results || []

  // Services needing attention
  const overdueServices =
    services?.filter((s) => {
      if (
        !s.scheduled_end_time ||
        s.status === "completed" ||
        s.status === "cancelled"
      )
        return false
      return new Date(s.scheduled_end_time) < new Date()
    }) || []

  const unpaidServices =
    services?.filter(
      (s) =>
        (s.payment_status === "unpaid" || s.payment_status === "partial") &&
        s.status === "completed",
    ) || []

  const totalAlerts =
    (pendingLeaves?.length || 0) +
    overdueServices.length +
    unpaidServices.length

  if (loadingLeaves || loadingServices) {
    return <ListCardSkeleton rows={3} />
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Bell className="size-4 text-primary" />
            </div>
            Reminders & Alerts
          </CardTitle>
          {totalAlerts > 0 && (
            <Badge
              variant="destructive"
              className="h-6 min-w-6 px-2"
              suppressHydrationWarning
            >
              {totalAlerts}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {totalAlerts === 0 ? (
          <div className="flex items-center justify-center gap-3 py-4 text-center">
            <Bell className="size-5 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No pending alerts or reminders
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingLeaves && pendingLeaves.length > 0 && (
              <Link
                href="/attendance/leaves"
                className="group block"
              >
                <div className="flex items-center gap-3 p-2.5 rounded-lg border hover:bg-muted/50 transition-all">
                  <div className="p-1.5 rounded-md bg-amber-100 dark:bg-amber-950/50 shrink-0">
                    <CalendarDays className="size-3.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      Pending Leave Approvals
                    </p>
                    <p
                      className="text-xs text-muted-foreground mt-0.5 truncate"
                      suppressHydrationWarning
                    >
                      {pendingLeaves
                        .slice(0, 2)
                        .map((l) => l.employee_name)
                        .join(", ")}
                      {pendingLeaves.length > 2 &&
                        ` +${pendingLeaves.length - 2} more`}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="shrink-0 text-xs border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-400"
                  >
                    {pendingLeaves.length}
                  </Badge>
                  <ArrowRight className="size-3.5 text-muted-foreground shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
                </div>
              </Link>
            )}

            {overdueServices.length > 0 && (
              <Link
                href="/services"
                className="group block"
              >
                <div className="flex items-center gap-3 p-2.5 rounded-lg border hover:bg-muted/50 transition-all">
                  <div className="p-1.5 rounded-md bg-red-100 dark:bg-red-950/50 shrink-0">
                    <TimerOff className="size-3.5 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Overdue Services</p>
                    <p
                      className="text-xs text-muted-foreground mt-0.5 truncate"
                      suppressHydrationWarning
                    >
                      {overdueServices
                        .slice(0, 2)
                        .map((s) =>
                          s.client?.full_name
                            ? `#${s.id} ${s.client.full_name}`
                            : `#${s.id}`,
                        )
                        .join(", ")}
                      {overdueServices.length > 2 &&
                        ` +${overdueServices.length - 2} more`}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="shrink-0 text-xs border-red-200 text-red-700 dark:border-red-800 dark:text-red-400"
                  >
                    {overdueServices.length}
                  </Badge>
                  <ArrowRight className="size-3.5 text-muted-foreground shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
                </div>
              </Link>
            )}

            {unpaidServices.length > 0 && (
              <Link
                href="/services"
                className="group block"
              >
                <div className="flex items-center gap-3 p-2.5 rounded-lg border hover:bg-muted/50 transition-all">
                  <div className="p-1.5 rounded-md bg-orange-100 dark:bg-orange-950/50 shrink-0">
                    <CreditCard className="size-3.5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Unpaid Services</p>
                    <p
                      className="text-xs text-muted-foreground mt-0.5 truncate"
                      suppressHydrationWarning
                    >
                      {unpaidServices
                        .slice(0, 2)
                        .map((s) =>
                          s.client?.full_name
                            ? `#${s.id} ${s.client.full_name}`
                            : `#${s.id}`,
                        )
                        .join(", ")}
                      {unpaidServices.length > 2 &&
                        ` +${unpaidServices.length - 2} more`}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="shrink-0 text-xs border-orange-200 text-orange-700 dark:border-orange-800 dark:text-orange-400"
                  >
                    {unpaidServices.length}
                  </Badge>
                  <ArrowRight className="size-3.5 text-muted-foreground shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
                </div>
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
