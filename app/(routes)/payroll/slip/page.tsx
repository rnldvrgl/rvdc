"use client"

import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { StatusBadge } from "@/components/details/payroll/StatusBadge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PayrollStatus } from "@/lib/constants/types"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useWeeklyPayrolls } from "@/lib/queries/usePayroll"
import { formatCurrency } from "@/lib/utils/currency"
import { format } from "date-fns"
import {
  ArrowRight,
  Calendar,
  Loader2,
  Minus,
  PhilippinePesoIcon,
  Plus,
} from "lucide-react"
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
            icon={PhilippinePesoIcon}
          />
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </Wrapper>
    )
  }

  const payrolls = data?.results || []

  // Summary stats
  const totalNetPay = payrolls.reduce(
    (sum, p) => sum + Number(p.net_pay || 0),
    0,
  )
  const paidCount = payrolls.filter((p) => p.status === "paid").length

  return (
    <Wrapper>
      <div className="space-y-4 md:space-y-6">
        <PageHeader
          title="My Payroll"
          description="View your payroll history and payment details"
          icon={PhilippinePesoIcon}
        />

        {/* Quick Stats */}
        {payrolls.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="size-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                  <PhilippinePesoIcon className="size-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Total Earned</p>
                  <p className="text-lg font-bold truncate">
                    ₱{formatCurrency(totalNetPay)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="size-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                  <Calendar className="size-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Paid Slips</p>
                  <p className="text-lg font-bold">
                    {paidCount}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      / {payrolls.length}
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Payroll List */}
        {payrolls.length > 0 ? (
          <div className="space-y-2">
            {payrolls.map((payroll) => {
              const gross = Number(payroll.gross_pay || 0)
              const deductions = Number(payroll.total_deductions || 0)
              const net = Number(payroll.net_pay || 0)

              return (
                <Card
                  key={payroll.id}
                  className="group cursor-pointer hover:shadow-md hover:border-primary/40 transition-all py-0"
                  onClick={() => router.push(`/payroll/slip/${payroll.id}`)}
                >
                  <CardContent className="p-4">
                    {/* Top Row: Period + Status */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Calendar className="size-4 text-muted-foreground shrink-0" />
                        <span className="font-semibold text-sm">
                          {format(new Date(payroll.week_start), "MMM dd")} -{" "}
                          {payroll.week_end
                            ? format(
                                new Date(payroll.week_end),
                                "MMM dd, yyyy",
                              )
                            : ""}
                        </span>
                      </div>
                      <StatusBadge status={payroll.status as PayrollStatus} />
                    </div>

                    {/* Pay Breakdown Row */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4 sm:gap-6">
                        <div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Plus className="size-3" />
                            <span className="text-xs">Gross</span>
                          </div>
                          <p className="font-medium">
                            ₱{formatCurrency(gross)}
                          </p>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Minus className="size-3" />
                            <span className="text-xs">Deductions</span>
                          </div>
                          <p className="font-medium text-red-600 dark:text-red-400">
                            ₱{formatCurrency(deductions)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          Net Pay
                        </p>
                        <p className="text-base font-bold text-green-600 dark:text-green-400">
                          ₱{formatCurrency(net)}
                        </p>
                      </div>
                    </div>

                    {/* View Arrow */}
                    <div className="flex justify-end mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground group-hover:text-primary"
                      >
                        View Payslip
                        <ArrowRight className="size-3 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center justify-center size-14 rounded-xl bg-muted/60 text-muted-foreground">
                  <PhilippinePesoIcon className="size-7" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-medium text-foreground">
                    No payroll records found
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Payroll records will appear here once generated by
                    management
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Wrapper>
  )
}
