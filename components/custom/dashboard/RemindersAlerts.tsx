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
          <div className="space-y-3">
            {pendingLeaves && pendingLeaves.length > 0 && (
              <Link
                href="/attendance/leaves"
                className="block group"
              >
                <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/50 dark:to-amber-900/20 hover:shadow-md transition-all duration-200 group-hover:border-amber-300 dark:group-hover:border-amber-800">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50 shrink-0">
                      <CalendarDays className="size-4 text-amber-700 dark:text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                          Pending Leave Approvals
                        </p>
                        <ArrowRight className="size-4 text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p
                        className="text-xs text-amber-700 dark:text-amber-300 mb-2"
                        suppressHydrationWarning
                      >
                        {pendingLeaves.length} leave request
                        {pendingLeaves.length > 1 ? "s" : ""} awaiting approval
                      </p>
                      <div className="space-y-1.5">
                        {pendingLeaves.slice(0, 3).map((leave) => (
                          <div
                            key={leave.id}
                            className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400"
                          >
                            <div className="size-1 rounded-full bg-amber-600" />
                            <p className="truncate">
                              <span className="font-medium">
                                {leave.employee_name}
                              </span>{" "}
                              — {leave.leave_type_display || leave.leave_type} (
                              {leave.days_count} day
                              {parseFloat(leave.days_count) !== 1 ? "s" : ""})
                            </p>
                          </div>
                        ))}
                        {pendingLeaves.length > 3 && (
                          <p className="text-xs text-amber-600 dark:text-amber-500 font-medium pl-3">
                            +{pendingLeaves.length - 3} more...
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {overdueServices.length > 0 && (
              <Link
                href="/services"
                className="block group"
              >
                <div className="p-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/50 dark:to-red-900/20 hover:shadow-md transition-all duration-200 group-hover:border-red-300 dark:group-hover:border-red-800">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/50 shrink-0">
                      <TimerOff className="size-4 text-red-700 dark:text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-sm font-semibold text-red-900 dark:text-red-100">
                          Overdue Services
                        </p>
                        <ArrowRight className="size-4 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p
                        className="text-xs text-red-700 dark:text-red-300 mb-2"
                        suppressHydrationWarning
                      >
                        {overdueServices.length} service
                        {overdueServices.length > 1 ? "s" : ""} past target
                        completion date
                      </p>
                      <div className="space-y-1.5">
                        {overdueServices.slice(0, 3).map((service) => (
                          <div
                            key={service.id}
                            className="flex items-center gap-2 text-xs text-red-700 dark:text-red-400"
                          >
                            <div className="size-1 rounded-full bg-red-600" />
                            <p className="truncate">
                              <span className="font-medium">#{service.id}</span>
                              {service.client?.full_name
                                ? ` — ${service.client.full_name}`
                                : ""}
                            </p>
                          </div>
                        ))}
                        {overdueServices.length > 3 && (
                          <p className="text-xs text-red-600 dark:text-red-500 font-medium pl-3">
                            +{overdueServices.length - 3} more...
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {unpaidServices.length > 0 && (
              <Link
                href="/services"
                className="block group"
              >
                <div className="p-4 rounded-xl border border-orange-200 dark:border-orange-900/50 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/50 dark:to-orange-900/20 hover:shadow-md transition-all duration-200 group-hover:border-orange-300 dark:group-hover:border-orange-800">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/50 shrink-0">
                      <CreditCard className="size-4 text-orange-700 dark:text-orange-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">
                          Unpaid Services
                        </p>
                        <ArrowRight className="size-4 text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p
                        className="text-xs text-orange-700 dark:text-orange-300 mb-2"
                        suppressHydrationWarning
                      >
                        {unpaidServices.length} completed service
                        {unpaidServices.length > 1 ? "s" : ""} awaiting payment
                      </p>
                      <div className="space-y-1.5">
                        {unpaidServices.slice(0, 3).map((service) => (
                          <div
                            key={service.id}
                            className="flex items-center gap-2 text-xs text-orange-700 dark:text-orange-400"
                          >
                            <div className="size-1 rounded-full bg-orange-600" />
                            <p className="truncate">
                              <span className="font-medium">#{service.id}</span>
                              {service.client?.full_name
                                ? ` — ${service.client.full_name}`
                                : ""}
                              {service.payment_status === "partial"
                                ? " (Partial)"
                                : " (Unpaid)"}
                            </p>
                          </div>
                        ))}
                        {unpaidServices.length > 3 && (
                          <p className="text-xs text-orange-600 dark:text-orange-500 font-medium pl-3">
                            +{unpaidServices.length - 3} more...
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
