"use client"

import { ListCardSkeleton } from "@/components/custom/shared/skeletons"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useServices } from "@/lib/queries/services/useServices"
import { usePendingLeaveApprovals } from "@/lib/queries/useAttendance"
import { Bell, CalendarDays, CreditCard, TimerOff } from "lucide-react"
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
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="size-5" />
          Reminders & Alerts
          {totalAlerts > 0 && (
            <Badge
              variant="destructive"
              className="ml-auto"
              suppressHydrationWarning
            >
              {totalAlerts}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {totalAlerts === 0 ? (
          <p className="text-sm text-muted-foreground">
            No pending alerts or reminders
          </p>
        ) : (
          <div className="space-y-3">
            {pendingLeaves && pendingLeaves.length > 0 && (
              <Link href="/attendance/leaves">
                <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-900/10 hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-colors">
                  <div className="flex items-start gap-2">
                    <CalendarDays className="size-4 text-amber-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                        Pending Leave Approvals
                      </p>
                      <p
                        className="text-xs text-amber-700 dark:text-amber-300 mt-1"
                        suppressHydrationWarning
                      >
                        {pendingLeaves.length} leave request
                        {pendingLeaves.length > 1 ? "s" : ""} awaiting approval
                      </p>
                      <div className="mt-2 space-y-1">
                        {pendingLeaves.slice(0, 3).map((leave) => (
                          <p
                            key={leave.id}
                            className="text-xs text-amber-600 dark:text-amber-400 truncate"
                          >
                            • {leave.employee_name} —{" "}
                            {leave.leave_type_display || leave.leave_type} (
                            {leave.days_count} day
                            {parseFloat(leave.days_count) !== 1 ? "s" : ""})
                            {leave.start_date &&
                            leave.end_date &&
                            leave.start_date !== leave.end_date
                              ? ` (${leave.start_date} to ${leave.end_date})`
                              : leave.start_date
                                ? ` on ${leave.start_date}`
                                : ` on ${leave.date}`}
                          </p>
                        ))}
                        {pendingLeaves.length > 3 && (
                          <p className="text-xs text-amber-500 dark:text-amber-500">
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
              <Link href="/services">
                <div className="p-3 rounded-lg border border-red-200 bg-red-50/50 dark:bg-red-900/10 hover:bg-red-100/50 dark:hover:bg-red-900/20 transition-colors">
                  <div className="flex items-start gap-2">
                    <TimerOff className="size-4 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-900 dark:text-red-100">
                        Overdue Services
                      </p>
                      <p
                        className="text-xs text-red-700 dark:text-red-300 mt-1"
                        suppressHydrationWarning
                      >
                        {overdueServices.length} service
                        {overdueServices.length > 1 ? "s" : ""} past target
                        completion date
                      </p>
                      <div className="mt-2 space-y-1">
                        {overdueServices.slice(0, 3).map((service) => (
                          <p
                            key={service.id}
                            className="text-xs text-red-600 dark:text-red-400 truncate"
                          >
                            • #{service.id}
                            {service.client?.full_name
                              ? ` — ${service.client.full_name}`
                              : ""}
                          </p>
                        ))}
                        {overdueServices.length > 3 && (
                          <p className="text-xs text-red-500 dark:text-red-500">
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
              <Link href="/services">
                <div className="p-3 rounded-lg border border-orange-200 bg-orange-50/50 dark:bg-orange-900/10 hover:bg-orange-100/50 dark:hover:bg-orange-900/20 transition-colors">
                  <div className="flex items-start gap-2">
                    <CreditCard className="size-4 text-orange-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                        Unpaid Services
                      </p>
                      <p
                        className="text-xs text-orange-700 dark:text-orange-300 mt-1"
                        suppressHydrationWarning
                      >
                        {unpaidServices.length} completed service
                        {unpaidServices.length > 1 ? "s" : ""} awaiting payment
                      </p>
                      <div className="mt-2 space-y-1">
                        {unpaidServices.slice(0, 3).map((service) => (
                          <p
                            key={service.id}
                            className="text-xs text-orange-600 dark:text-orange-400 truncate"
                          >
                            • #{service.id}
                            {service.client?.full_name
                              ? ` — ${service.client.full_name}`
                              : ""}
                            {service.payment_status === "partial"
                              ? " (Partial)"
                              : " (Unpaid)"}
                          </p>
                        ))}
                        {unpaidServices.length > 3 && (
                          <p className="text-xs text-orange-500 dark:text-orange-500">
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
