"use client"

import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useNavigation } from "@/lib/hooks/useNavigation"
import { Loader2 } from "lucide-react"
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
        redirect("/attendance/overview")
      } else {
        redirect("/attendance/timetable")
      }
    }
  }, [role, push])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  )
}
