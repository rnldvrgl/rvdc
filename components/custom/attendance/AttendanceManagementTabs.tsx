"use client"

import { AttendanceApproval } from "@/components/custom/attendance/AttendanceApproval"
import { LeaveOverview } from "@/components/custom/attendance/LeaveOverview"
import { RecentActivitySection } from "@/components/custom/attendance/RecentActivitySection"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DailyAttendance } from "@/lib/constants/types"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { usePendingAttendanceApprovals } from "@/lib/queries/useAttendance"
import { canApprove } from "@/lib/utils/attendance"
import { CheckCircle, Clock, Plane } from "lucide-react"

interface AttendanceManagementTabsProps {
  recentRecords: DailyAttendance[]
  isLoadingRecent: boolean
  showEmployeeCount: boolean
  filter?: Record<string, unknown>
}

export function AttendanceManagementTabs({
  recentRecords,
  isLoadingRecent,
  showEmployeeCount,
  filter = {},
}: AttendanceManagementTabsProps) {
  const { role } = useCurrentUser()
  const hasApprovalRights = canApprove(role || "")

  const { data: pendingApprovals } = usePendingAttendanceApprovals({ filter })
  const pendingCount = pendingApprovals?.length ?? 0

  return (
    <Tabs
      defaultValue="approvals"
      className="space-y-4"
    >
      <TabsList className="w-full md:w-auto">
        {hasApprovalRights && (
          <TabsTrigger
            value="approvals"
            className="gap-1.5 md:gap-2 min-h-11"
          >
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Approvals</span>
            {pendingCount > 0 && (
              <Badge
                variant="destructive"
                className="ml-1 h-5 min-w-5 px-1.5 text-[10px] font-bold"
              >
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
        )}
        <TabsTrigger
          value="leave"
          className="gap-1.5 md:gap-2 min-h-11"
        >
          <Plane className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Leave</span>
        </TabsTrigger>
        <TabsTrigger
          value="recent"
          className="gap-1.5 md:gap-2 min-h-11"
        >
          <Clock className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Recent Activity</span>
        </TabsTrigger>
      </TabsList>

      {hasApprovalRights && (
        <TabsContent
          value="approvals"
          className="mt-0"
        >
          <AttendanceApproval />
        </TabsContent>
      )}

      <TabsContent
        value="leave"
        className="mt-0"
      >
        <LeaveOverview />
      </TabsContent>

      <TabsContent
        value="recent"
        className="mt-0"
      >
        <RecentActivitySection
          records={recentRecords}
          isLoading={isLoadingRecent}
          showEmployeeCount={showEmployeeCount}
        />
      </TabsContent>
    </Tabs>
  )
}
