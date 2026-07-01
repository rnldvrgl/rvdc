"use client"

import { EmptyState } from "@/components/custom/EmptyState"
import { AnimatedNumber } from "@/components/custom/shared/AnimatedNumber"
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
    <Card className="h-full min-w-0">
      <CardHeader className="pb-3 px-4 sm:px-6">
        <div className="flex items-center justify-between min-w-0 gap-2">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2 min-w-0">
            <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 shrink-0">
              <Bell className="size-4 text-primary" />
            </div>
            <span className="truncate">Reminders & Alerts</span>
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
      <CardContent className="px-4 sm:px-6">
        {totalAlerts === 0 ? (
          <EmptyState
            title="No Reminders or Alerts"
            description="You have no pending leave approvals, overdue services, or unpaid services at the moment."
            icon={Bell}
            className="py-6"
          />
        ) : (
          <div className="space-y-2">
            {pendingLeaves && pendingLeaves.length > 0 && (
              <Link
                href="/attendance/leaves"
                className="group block"
              >
                <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-lg border hover:bg-muted/50 transition-all">
                  <div className="p-1.5 rounded-md bg-amber-100 dark:bg-amber-950/50 shrink-0">
                    <CalendarDays className="size-3.5 text-warning" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
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
                     <AnimatedNumber value={pendingLeaves.length} prefix=" + " className="text-xs text-muted-foreground" />
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="shrink-0 text-xs border-amber-200 text-warning dark:border-amber-800"
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
                <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-lg border hover:bg-muted/50 transition-all">
                  <div className="p-1.5 rounded-md bg-red-100 dark:bg-red-950/50 shrink-0">
                    <TimerOff className="size-3.5 text-destructive" />
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
                      <AnimatedNumber value={overdueServices.length} prefix=" + " className="text-xs text-muted-foreground" />
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="shrink-0 text-xs border-red-200 text-destructive dark:border-red-800"
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
                <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-lg border hover:bg-muted/50 transition-all">
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
                      <AnimatedNumber value={unpaidServices.length} prefix=" + " className="text-xs text-muted-foreground" />
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
