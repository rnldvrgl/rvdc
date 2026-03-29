"use client"

import { PageLoadingSkeleton } from "@/components/custom/shared/skeletons"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useNavigation } from "@/lib/hooks/useNavigation"
import { redirect } from "next/navigation"
import { useEffect } from "react"

/**
 * Main attendance page that redirects based on user role
 * - Admin/Manager -> Overview page (approvals and statistics)
 * - Other roles -> Timetable page (personal attendance)
 */
export default function AttendancePage() {
  const { role } = useCurrentUser()
  const { push } = useNavigation()

  useEffect(() => {
    if (role) {
      // Redirect based on role
      if (role === "admin") {
        redirect("/attendance/records")
      } else {
        redirect("/attendance/timetable")
      }
    }
  }, [role, push])

  return <PageLoadingSkeleton message="Redirecting..." />
}
