"use client"

import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { WeeklyPayrollSlip } from "@/components/details/WeeklyPayrollSlip"
import { Button } from "@/components/ui/button"
import { useWeeklyPayroll } from "@/lib/queries/usePayroll"
import { ArrowLeft, PhilippinePesoIcon } from "lucide-react"
import { useParams, useRouter } from "next/navigation"

/**
 * Individual payslip detail page
 */
export default function PayslipDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = parseInt(params?.id as string)

  const { data: payroll, isLoading } = useWeeklyPayroll(id)

  return (
    <Wrapper>
      <PageHeader
        title="Payslip Details"
        description="View detailed breakdown of your payslip"
        icon={PhilippinePesoIcon}
        actionButton={
          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            <ArrowLeft className="size-4 mr-2" />
            Back
          </Button>
        }
      />

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading payslip...
        </div>
      ) : payroll ? (
        <WeeklyPayrollSlip payrollId={payroll.id} />
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          Payslip not found.
        </div>
      )}
    </Wrapper>
  )
}
