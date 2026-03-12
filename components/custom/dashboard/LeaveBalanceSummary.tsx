"use client"

import RedirectRoute from "@/components/custom/navigation/RedirectRoute"
import { StatCardSkeleton } from "@/components/custom/shared/skeletons"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useMyLeaveBalance } from "@/lib/queries/useAttendance"
import { Plane } from "lucide-react"

export function LeaveBalanceSummary() {
  const { data: balance, isLoading } = useMyLeaveBalance()

  if (isLoading) {
    return <StatCardSkeleton rows={2} />
  }

  return (
    <Card className="relative h-full">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Plane className="size-5" />
          Leave Balance
          <RedirectRoute href="/attendance/leaves" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <p className="text-sm font-medium">Sick Leave</p>
              <p className="text-xs text-muted-foreground">
                {balance?.sick_leave_used || 0} used /{" "}
                {balance?.sick_leave_total || 0} total
              </p>
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {balance?.sick_leave_remaining || 0}
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <p className="text-sm font-medium">Emergency Leave</p>
              <p className="text-xs text-muted-foreground">
                {balance?.emergency_leave_used || 0} used /{" "}
                {balance?.emergency_leave_total || 0} total
              </p>
            </div>
            <div className="text-2xl font-bold text-amber-600">
              {balance?.emergency_leave_remaining || 0}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
