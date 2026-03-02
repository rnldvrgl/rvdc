"use client"

import { PageLoadingSkeleton } from "@/components/custom/shared/skeletons"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { redirect } from "next/navigation"
import { useEffect } from "react"

/**
 * Main payroll page that redirects based on user role
 * - Admin/Manager -> Weekly payroll management (/payroll/weekly)
 * - Employees -> My payroll view (/payroll/slip)
 */
export default function PayrollPage() {
  const { isAdmin } = useCurrentUser()

  useEffect(() => {
    if (isAdmin) {
      redirect("/payroll/weekly")
    } else {
      redirect("/payroll/slip")
    }
  }, [isAdmin])

  return <PageLoadingSkeleton message="Redirecting..." />
}
