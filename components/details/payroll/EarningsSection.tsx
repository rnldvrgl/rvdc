import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { formatCurrency, toNumber } from "@/lib/utils/currency"
import { format, parseISO } from "date-fns"
import { Plus, X } from "lucide-react"

interface AdditionalEarningDetail {
  id: number
  category: string
  amount: string | number
  description?: string
  reference?: string
}

interface HolidayDetail {
  date: string
  name: string
  kind: string
}

interface EarningsSectionProps {
  basicPay: number
  approvedOtPay: number
  holidayPayTotal: number
  nightDiffPay: number
  allowances: number
  additionalEarnings: number
  additionalEarningsDetails?: AdditionalEarningDetail[]
  totalEarnings: number
  canDelete: boolean
  canManage: boolean
  onDeleteEarning: (id: number) => void
  attendanceDates?: string[]
  holidayDetails?: HolidayDetail[]
}

export function EarningsSection({
  basicPay,
  approvedOtPay,
  holidayPayTotal,
  nightDiffPay,
  allowances,
  additionalEarnings,
  additionalEarningsDetails,
  totalEarnings,
  canDelete,
  canManage,
  onDeleteEarning,
  totalDays,
  dailyRate,
  attendanceDates,
  holidayDetails,
}: EarningsSectionProps & { totalDays?: number; dailyRate?: number }) {
  const formattedDates =
    attendanceDates && attendanceDates.length > 0
      ? attendanceDates.map((d) => format(parseISO(d), "MMM d")).join(", ")
      : null
  return (
    <div className="rounded-lg border border-green-200/60 dark:border-green-900/40 bg-linear-to-br from-green-50/30 to-emerald-50/30 dark:from-green-950/10 dark:to-emerald-950/10 p-3 flex flex-col">
      <div className="flex items-center gap-2 mb-2.5">
        <Plus className="h-4 w-4 text-success" />
        <h3 className="text-sm sm:text-base font-semibold text-success">
          Earnings
        </h3>
      </div>
      <div className="space-y-1.5">
        <div>
          <EarningItem
            label="Basic Pay"
            amount={basicPay}
          />
          {typeof totalDays === "number" && dailyRate ? (
            <div className="text-xs text-muted-foreground ml-2">
              ({totalDays.toFixed(2)} days × ₱
              {dailyRate.toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}
              )
            </div>
          ) : null}
          {formattedDates && (
            <div className="text-[10px] text-muted-foreground/70 ml-2 mt-0.5">
              {formattedDates}
            </div>
          )}
        </div>

        {approvedOtPay > 0 && (
          <EarningItem
            label="Overtime"
            amount={approvedOtPay}
          />
        )}

        {holidayPayTotal > 0 && (
          <div>
            <EarningItem
              label="Holiday"
              amount={holidayPayTotal}
            />
            {holidayDetails && holidayDetails.length > 0 && (
              <div className="ml-2 mt-0.5 space-y-0.5">
                {holidayDetails.map((h) => (
                  <div
                    key={h.date}
                    className="text-[10px] text-muted-foreground/70 flex items-center gap-1"
                  >
                    <span>{format(parseISO(h.date), "MMM d")}</span>
                    <span>—</span>
                    <span>{h.name}</span>
                    <Badge
                      variant="outline"
                      className="text-[9px] px-1 py-0 h-3.5"
                    >
                      {h.kind === "regular" ? "Regular" : "Special"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {nightDiffPay > 0 && (
          <EarningItem
            label="Night Diff"
            amount={nightDiffPay}
          />
        )}

        {allowances > 0 && (
          <EarningItem
            label="Allowances"
            amount={allowances}
          />
        )}

        {additionalEarnings > 0 && (
          <>
            {additionalEarningsDetails &&
            additionalEarningsDetails.length > 0 ? (
              additionalEarningsDetails.map((earning) => (
                <AdditionalEarningItem
                  key={earning.id}
                  earning={earning}
                  canDelete={canDelete}
                  canManage={canManage}
                  onDelete={onDeleteEarning}
                />
              ))
            ) : (
              <EarningItem
                label="Other"
                amount={additionalEarnings}
              />
            )}
          </>
        )}
      </div>
      <Separator className="my-2 mt-auto" />
      <div className="flex justify-between font-semibold text-success text-sm">
        <span>Total</span>
        <span>{formatCurrency(totalEarnings)}</span>
      </div>
    </div>
  )
}

interface EarningItemProps {
  label: string
  amount: number
}

function EarningItem({ label, amount }: EarningItemProps) {
  return (
    <div className="flex justify-between text-xs sm:text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{formatCurrency(amount)}</span>
    </div>
  )
}

interface AdditionalEarningItemProps {
  earning: AdditionalEarningDetail
  canDelete: boolean
  canManage: boolean
  onDelete: (id: number) => void
}

function AdditionalEarningItem({
  earning,
  canDelete,
  canManage,
  onDelete,
}: AdditionalEarningItemProps) {
  const earningAmount = toNumber(earning.amount)

  return (
    <div className="flex justify-between items-start text-xs sm:text-sm gap-2 group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {canManage && (
            <Badge
              variant="outline"
              className="text-xs px-1.5 py-0 capitalize"
            >
              {earning.category}
            </Badge>
          )}
          <span className="text-muted-foreground truncate">
            {earning.description || earning.reference || "Additional Earning"}
          </span>
        </div>
        {earning.description && earning.reference && (
          <p className="text-[10px] text-muted-foreground/70 mt-0.5">
            Ref: {earning.reference}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="font-medium">{formatCurrency(earningAmount)}</span>
        {canDelete && (
          <Button
            variant="destructive"
            size="sm"
            className="h-6 w-6 p-0 print:hidden opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onDelete(earning.id)}
          >
            <X className="size-3" />
          </Button>
        )}
      </div>
    </div>
  )
}
