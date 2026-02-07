"use client"

import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { StatusBadge } from "@/components/details/payroll/StatusBadge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { PayrollStatus } from "@/lib/constants/types"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useWeeklyPayrolls } from "@/lib/queries/usePayroll"
import { formatCurrency } from "@/lib/utils/currency"
import { format } from "date-fns"
import { Calendar, Eye, Loader2, TrendingDown, TrendingUp } from "lucide-react"
import { useRouter } from "next/navigation"

/**
 * Employee view of their own payroll records
 */
export default function MyPayrollPage() {
  const { user_id } = useCurrentUser()
  const router = useRouter()

  const { data, isLoading } = useWeeklyPayrolls({
    filter: { employee: user_id },
    ordering: "-week_start",
  })

  if (isLoading) {
    return (
      <Wrapper>
        <div className="space-y-4 md:space-y-6">
          <PageHeader
            title="My Payroll"
            description="View your payroll history and payment details"
            icon={Calendar}
          />
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </Wrapper>
    )
  }

  const payrolls = data?.results || []

  return (
    <Wrapper>
      <div className="space-y-4 md:space-y-6">
        <PageHeader
          title="My Payroll"
          description="View your payroll history and payment details"
          icon={Calendar}
        />

        {payrolls.length > 0 ? (
          <div className="grid gap-3 sm:gap-4">
            {payrolls.map((payroll) => (
              <Card
                key={payroll.id}
                className="hover:shadow-lg transition-all duration-200 hover:border-primary/50 py-2"
              >
                <CardContent className="p-4 sm:p-6">
                  {/* Header Section */}
                  <div className="flex flex-col gap-2 mb-4 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0 flex-1">
                        <Calendar className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <span className="font-semibold text-sm sm:text-base">
                          {format(new Date(payroll.week_start), "MMM dd")} -{" "}
                          {payroll.week_end
                            ? format(new Date(payroll.week_end), "MMM dd, yyyy")
                            : ""}
                        </span>
                      </div>
                      <div className="shrink-0">
                        <StatusBadge status={payroll.status as PayrollStatus} />
                      </div>
                    </div>
                  </div>

                  <Separator className="mb-4" />

                  {/* Payment Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                    {/* Gross Pay */}
                    <div className="text-center p-3 rounded-lg bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border border-blue-200/50 dark:border-blue-800/50">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <TrendingUp className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                          Gross Pay
                        </p>
                      </div>
                      <p className="text-base sm:text-lg font-bold text-blue-700 dark:text-blue-300">
                        ₱{formatCurrency(payroll.gross_pay)}
                      </p>
                    </div>

                    {/* Deductions */}
                    <div className="text-center p-3 rounded-lg bg-linear-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 border border-red-200/50 dark:border-red-800/50">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <TrendingDown className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                        <p className="text-xs text-red-700 dark:text-red-300 font-medium">
                          Deductions
                        </p>
                      </div>
                      <p className="text-base sm:text-lg font-bold text-red-700 dark:text-red-300">
                        ₱{formatCurrency(payroll.total_deductions)}
                      </p>
                    </div>

                    {/* Net Pay */}
                    <div className="text-center p-3 rounded-lg bg-linear-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border border-green-200/50 dark:border-green-800/50">
                      <p className="text-xs text-green-700 dark:text-green-300 font-medium mb-1">
                        Net Pay
                      </p>
                      <p className="text-base sm:text-lg font-bold text-green-700 dark:text-green-300">
                        ₱{formatCurrency(payroll.net_pay)}
                      </p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/payroll/slip/${payroll.id}`)}
                    className="w-full hover:bg-primary hover:text-primary-foreground transition-colors text-sm"
                  >
                    <Eye className="size-4 mr-2" />
                    <span className="hidden sm:inline">
                      View Detailed Payslip
                    </span>
                    <span className="sm:hidden">View Payslip</span>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-8 sm:py-12 px-4 text-center">
              <Calendar className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-muted-foreground/50" />
              <p className="text-sm sm:text-base text-muted-foreground font-medium mb-1">
                No payroll records found
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Payroll records will appear here once generated by management
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Wrapper>
  )
}
