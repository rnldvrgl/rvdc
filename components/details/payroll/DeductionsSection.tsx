import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { formatCurrency, toNumber } from "@/lib/utils/currency"
import { cn } from "@/lib/utils/helpers"
import { Minus, X } from "lucide-react"

const CATEGORY_COLOR_MAP: Record<string, string> = {
  late_penalty:
    "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-300 dark:border-red-600",
  government:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border-orange-300 dark:border-orange-600",
  manual:
    "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-green-300 dark:border-green-600",
  other:
    "bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300 border-gray-300 dark:border-gray-600",
}

const getCategoryBadgeColor = (category?: string): string => {
  if (!category) return CATEGORY_COLOR_MAP.other
  const key = category.toLowerCase()
  return (
    Object.entries(CATEGORY_COLOR_MAP).find(([k]) => key === k)?.[1] ||
    CATEGORY_COLOR_MAP.other
  )
}

interface DeductionMetadata {
  category?: string
  source_type?: string
  source_id?: number
}

interface DeductionsSectionProps {
  deductions: Record<string, string | number>
  deductionMetadata?: Record<string, DeductionMetadata>
  totalDeductions: number
  canDelete: boolean
  canManage: boolean
  onDeleteDeduction: (id: number) => void
}

export function DeductionsSection({
  deductions,
  deductionMetadata,
  totalDeductions,
  canDelete,
  canManage,
  onDeleteDeduction,
}: DeductionsSectionProps) {
  const sortedDeductions = Object.entries(deductions).sort(([keyA], [keyB]) => {
    const catA = deductionMetadata?.[keyA]?.category ?? ""
    const catB = deductionMetadata?.[keyB]?.category ?? ""
    return catA.localeCompare(catB)
  })

  return (
    <div className="rounded-lg border border-red-200/60 dark:border-red-900/40 bg-linear-to-br from-red-50/30 to-rose-50/30 dark:from-red-950/10 dark:to-rose-950/10 p-3 flex flex-col">
      <div className="flex items-center gap-2 mb-2.5">
        <Minus className="h-4 w-4 text-red-600 dark:text-red-400" />
        <h3 className="text-sm sm:text-base font-semibold text-red-700 dark:text-red-400">
          Deductions
        </h3>
      </div>
      {totalDeductions > 0 ? (
        <div className="space-y-1.5">
          {sortedDeductions.map(([key, value]) => {
            const amount = toNumber(value)
            if (amount <= 0) return null

            const metadata = deductionMetadata?.[key]
            const isManualDeduction =
              metadata?.source_type === "ManualDeduction" && metadata?.source_id
            const canDeleteItem = canDelete && isManualDeduction

            const label = key
              .split("_")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")
              .replace("_", " ")

            return (
              <div
                key={key}
                className="flex justify-between items-center text-xs sm:text-sm group"
              >
                <span
                  className={cn(
                    "text-muted-foreground flex items-center gap-1.5",
                    label === "Sss" && "uppercase",
                  )}
                >
                  {metadata?.category && canManage && (
                    <Badge
                      className={cn(
                        "text-xs sm:text-sm px-1.5 py-0 border",
                        getCategoryBadgeColor(metadata.category),
                      )}
                    >
                      {metadata.category.replace(/_/g, " ")}
                    </Badge>
                  )}
                  {label}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">₱{formatCurrency(amount)}</span>
                  {canDeleteItem && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-6 w-6 p-0 print:hidden"
                      onClick={() => onDeleteDeduction(metadata.source_id!)}
                    >
                      <X className="size-3" />
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex items-center justify-center grow">
          <p className="text-xs text-muted-foreground">No deductions</p>
        </div>
      )}
      {totalDeductions > 0 && (
        <>
          <Separator className="my-2" />
          <div className="flex justify-between font-semibold text-red-700 dark:text-red-400 text-xs sm:text-sm">
            <span>Total Deductions</span>
            <span>₱{formatCurrency(totalDeductions)}</span>
          </div>
        </>
      )}
    </div>
  )
}
