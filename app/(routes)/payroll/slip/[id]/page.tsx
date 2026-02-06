"use client"

import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { WeeklyPayrollSlip } from "@/components/details/WeeklyPayrollSlip"
import { Button } from "@/components/ui/button"
import { useWeeklyPayroll } from "@/lib/queries/usePayroll"
import api from "@/lib/utils/api"
import { ArrowLeft, Download, PhilippinePesoIcon } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"

/**
 * Individual payslip detail page
 */
export default function PayslipDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = parseInt(params?.id as string)

  const { data: payroll, isLoading } = useWeeklyPayroll(id)

  const handleDownloadPDF = async () => {
    try {
      const response = await api.get(
        `/payroll/weekly-payrolls/${id}/download-pdf/`,
        {
          responseType: "blob",
        },
      )

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url

      // Generate filename
      const fileName = payroll
        ? `payslip_${payroll.employee_name}_${payroll.week_start}.pdf`
        : `payslip_${id}.pdf`

      link.setAttribute("download", fileName)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      toast.success("Payslip downloaded successfully")
    } catch (error) {
      console.error("Failed to download payslip:", error)
      toast.error("Failed to download payslip")
    }
  }

  return (
    <Wrapper>
      <PageHeader
        title="Payslip Details"
        description="View detailed breakdown of your payslip"
        icon={PhilippinePesoIcon}
        actionButton={
          <>
            {payroll && (
              <Button
                variant="default"
                onClick={handleDownloadPDF}
              >
                <Download className="size-4 mr-2" />
                Download PDF
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => router.back()}
            >
              <ArrowLeft className="size-4 mr-2" />
              Back
            </Button>
          </>
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
