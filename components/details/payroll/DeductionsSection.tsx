import { AnimatedNumber } from "@/components/custom/shared/AnimatedNumber"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils/helpers"
import { Minus, X } from "lucide-react"

const CATEGORY_VARIANTS: Record<
    string,
    "destructive" | "warning" | "success" | "secondary" | "outline" | "default"
> = {
    late_penalty: "destructive",
    government: "warning",
    manual: "success",
    deduction: "secondary",
    other: "outline",
}

const getCategoryVariant = (category?: string) => {
    if (!category) return "outline" as const
    return CATEGORY_VARIANTS[category.toLowerCase()] ?? ("outline" as const)
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
        <div className="rounded-lg border border-red-200/60 dark:border-red-900/40 bg-linear-to-br from-red-50/30 to-rose-50/30 dark:from-red-950/10 dark:to-rose-950/10 p-2.5 flex flex-col">
            <div className="flex items-center gap-1.5 mb-2">
                <Minus className="h-3.5 w-3.5 text-destructive" />
                <h3 className="text-sm font-semibold text-destructive">
                    Deductions
                </h3>
            </div>
            {totalDeductions > 0 ? (
                <div className="space-y-1">
                    {sortedDeductions.map(([key, value]) => {
                        const amount = Number(value)
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
                                            variant={getCategoryVariant(metadata.category)}
                                            className="text-[10px] px-1.5 py-0 font-semibold"
                                        >
                                            {metadata.category.replace(/_/g, " ")}
                                        </Badge>
                                    )}
                                    {label}
                                </span>
                                <div className="flex items-center gap-2">
                                    <AnimatedNumber
                                        value={amount}
                                        className="font-medium font-mono tabular-nums"
                                        format={{
                                            style: "currency",
                                            currency: "PHP",
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        }}
                                    />
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
                    <Separator className="my-1.5" />
                    <div className="flex justify-between font-semibold text-destructive text-xs sm:text-sm">
                        <span>Total Deductions</span>
                        <AnimatedNumber
                            value={totalDeductions}
                            className="font-mono tabular-nums"
                            format={{
                                style: "currency",
                                currency: "PHP",
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            }}
                        />
                    </div>
                </>
            )}
        </div>
    )
}
