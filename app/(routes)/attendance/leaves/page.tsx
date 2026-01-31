"use client"

import { LeaveOverview } from "@/components/custom/attendance/LeaveOverview"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { Plane } from "lucide-react"

/**
 * Leave Overview Page
 * Shows different views based on user role:
 * - Admin/Manager: Pending leave approvals + all leave requests
 * - Employee: Personal leave balance + own leave requests
 */
export default function LeavesPage() {
  return (
    <Wrapper>
      <div className="space-y-4 md:space-y-6">
        <PageHeader
          icon={Plane}
          title="My Leaves"
          description="View your leave balance and requests"
          breadcrumbs={["Attendance", "Leaves"]}
        />

        <LeaveOverview />
      </div>
    </Wrapper>
  )
}
