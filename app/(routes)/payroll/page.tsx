"use client"

import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { Loader2 } from "lucide-react"
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

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  )
}
