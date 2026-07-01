"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnimatedNumber, AnimatedNumberGroup } from "@/components/custom/shared/AnimatedNumber"
import { useDateParamsFromForm } from "@/lib/hooks/useDateParamsFromForm"
import {
    useGetSummary,
    useSalesOverTime,
    useUnpaidSalesStatus,
} from "@/lib/queries/analytics/useGetAnalytics"
import { useStalls } from "@/lib/queries/inventory/useStalls"
import { AnimatePresence, motion } from "framer-motion"
import { DollarSign, ReceiptText, TrendingDown, TrendingUp, Wallet } from "lucide-react"
import { useMemo, useState } from "react"
import DonutChart from "./DonutChart"
import TimeSeriesChart from "./TimeSeriesChart"
import { formatDate } from "@/lib/utils/helpers/date"
import {
    differenceInCalendarDays,
    subDays,
    subMonths,
    startOfMonth,
    endOfMonth,
    isSameDay,
    format
} from "date-fns"
import { Format } from "@number-flow/react"

function pctChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / Math.abs(previous)) * 100)
}

function getPreviousPeriod(startDate?: string, endDate?: string) {
    if (!startDate || !endDate)
        return { prev_start: undefined, prev_end: undefined }

    const start = new Date(startDate)
    const end = new Date(endDate)

    const isFullMonth =
        isSameDay(start, startOfMonth(start)) && isSameDay(end, endOfMonth(end))

    if (isFullMonth) {
        const prevMonthStart = startOfMonth(subMonths(start, 1))
        const prevMonthEnd = endOfMonth(subMonths(start, 1))
        return {
            prev_start: format(prevMonthStart, "yyyy-MM-dd"),
            prev_end: format(prevMonthEnd, "yyyy-MM-dd"),
        }
    }

    // Otherwise, fall back to an equal-length preceding window.
    const spanDays = differenceInCalendarDays(end, start) + 1
    const prevEnd = subDays(start, 1)
    const prevStart = subDays(prevEnd, spanDays - 1)

    return {
        prev_start: format(prevStart, "yyyy-MM-dd"),
        prev_end: format(prevEnd, "yyyy-MM-dd"),
    }
}

const StallTabs = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <Tabs value={value} onValueChange={onChange} className="w-full">
        <TabsList className="h-8 bg-muted/60">
            <TabsTrigger value="all" className="text-xs px-3 h-7">All</TabsTrigger>
            <TabsTrigger value="main" className="text-xs px-3 h-7">Main</TabsTrigger>
            <TabsTrigger value="sub" className="text-xs px-3 h-7">Sub</TabsTrigger>
        </TabsList>
    </Tabs>
)

function TrendBadge({ value }: { value: number | null }) {
    if (value === null) return null
    const positive = value >= 0
    return (
        <span
            className="inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-0.5 font-mono"
            style={{
                color: positive ? "var(--success)" : "var(--destructive)",
                backgroundColor: positive
                    ? "color-mix(in srgb, var(--success) 12%, transparent)"
                    : "color-mix(in srgb, var(--destructive) 12%, transparent)",
            }}
        >
            {positive ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
            {positive ? "+" : ""}
            {value}%
        </span>
    )
}

function MiniStat({
    icon: Icon,
    label,
    value,
    loading,
    format,
    suffix,
}: {
    icon: React.ElementType
    label: string
    value: number
    loading: boolean
    format?: Format
    suffix?: string
}) {
    return (
        <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-3.5 py-3 min-w-0 border">
            <div className="flex items-center justify-center size-9 rounded-lg bg-background shrink-0 shadow-sm">
                <Icon className="size-4 text-primary" />
            </div>
            <div className="min-w-0">
                <p className="text-[11px] font-medium text-muted-foreground leading-none mb-1">{label}</p>
                {loading ? (
                    <Skeleton className="h-4 w-16" />
                ) : (
                    <AnimatedNumber
                        value={value}
                        format={format}
                        suffix={suffix}
                        className="text-sm font-semibold text-foreground truncate"
                    />
                )}
            </div>
        </div>
    )
}

export default function HeroStatsSection() {
    const { start_date, end_date, stall } = useDateParamsFromForm()
    const [stallTab, setStallTab] = useState<string>("all")

    const { data: stallsData } = useStalls({ limit: 50 })
    const stalls = stallsData?.results ?? []
    const mainStall = stalls.find((s) => s.stall_type === "main")
    const subStall = stalls.find((s) => s.stall_type === "sub")

    const effectiveStall = useMemo(() => {
        if (stallTab === "main" && mainStall) return mainStall.id
        if (stallTab === "sub" && subStall) return subStall.id
        if (stallTab === "all") return undefined
        return stall
    }, [stallTab, mainStall, subStall, stall])

    const { data: summary, isLoading: summaryLoading } = useGetSummary({
        start_date,
        end_date,
        stall: effectiveStall,
    })
    const { data: salesOvertime, isLoading: salesLoading } = useSalesOverTime({
        start_date,
        end_date,
        stall: effectiveStall,
    })
    const { data: unpaidStatus, isLoading: statusLoading } = useUnpaidSalesStatus(
        { start_date, end_date, stall: effectiveStall },
    )

    const { prev_start, prev_end } = useMemo(
        () => getPreviousPeriod(start_date, end_date),
        [start_date, end_date],
    )
    const { data: prevData } = useGetSummary({
        start_date: prev_start,
        end_date: prev_end,
        stall: effectiveStall,
        enabled: !!prev_start && !!prev_end,
    })

    const revenueTrend = useMemo(() => {
        if (!summary || !prevData) return null
        return pctChange(summary.total_revenue, prevData.total_revenue)
    }, [summary, prevData])

    return (
        <div className="grid gap-6 lg:grid-cols-3">
            {/* Revenue Overview + Chart */}
            <div className="lg:col-span-2">
                <Card className="overflow-hidden border border-border shadow-sm bg-card h-full relative gap-0 py-0">
                    {/* Top accent wash using theme primary, no fixed hex */}
                    <div
                        className="h-1 w-full"
                        style={{
                            background: "linear-gradient(90deg, var(--primary), color-mix(in srgb, var(--primary) 40%, transparent))",
                        }}
                    />
                    <CardContent className="p-4 sm:p-6">
                        <AnimatePresence mode="wait">
                            {summaryLoading ? (
                                <motion.div
                                    key="skeleton"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-4"
                                >
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-10 w-48" />
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {Array.from({ length: 3 }).map((_, i) => (
                                            <Skeleton key={i} className="h-14 rounded-xl" />
                                        ))}
                                    </div>
                                    <Skeleton className="h-44 w-full rounded-lg" />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="content"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
                                        <div className="space-y-1.5 min-w-0">
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                                Period Revenue
                                            </p>
                                            <div className="flex items-baseline gap-2 flex-wrap">
                                                <AnimatedNumber
                                                    value={summary?.total_revenue ?? 0}
                                                    className="text-2xl sm:text-3xl lg:text-[2.25rem] font-bold text-foreground tracking-tight leading-none"
                                                    format={{ style: "currency", currency: "PHP", minimumFractionDigits: 2, maximumFractionDigits: 2 }}
                                                />
                                                <TrendBadge value={revenueTrend} />
                                            </div>
                                            <p className="text-xs text-muted-foreground font-mono">vs {prev_start && prev_end ? `${formatDate(prev_start, 'MMM dd, yyyy')} - ${formatDate(prev_end, 'MMM dd, yyyy')}` : "previous period"}</p>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <StallTabs value={stallTab} onChange={setStallTab} />
                                            <div
                                                className="p-2.5 rounded-xl shrink-0"
                                                style={{ backgroundColor: "color-mix(in srgb, var(--primary) 12%, transparent)" }}
                                            >
                                                <DollarSign className="size-5" style={{ color: "var(--primary)" }} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-5">
                                        <AnimatedNumberGroup>
                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                                                <MiniStat
                                                    icon={Wallet}
                                                    label="Net Income"
                                                    value={summary?.net_income ?? 0}
                                                    loading={summaryLoading}
                                                    format={{ style: "currency", currency: "PHP", minimumFractionDigits: 2, maximumFractionDigits: 2 }}
                                                />
                                                <MiniStat
                                                    icon={ReceiptText}
                                                    label="Total Sales"
                                                    value={summary?.total_sales ?? 0}
                                                    loading={summaryLoading}
                                                    format={{ style: "currency", currency: "PHP", minimumFractionDigits: 2, maximumFractionDigits: 2 }}
                                                />
                                                <MiniStat
                                                    icon={DollarSign}
                                                    label="Avg. / Day"
                                                    value={salesOvertime?.length ? (summary?.total_sales ?? 0) / salesOvertime.length : 0}
                                                    loading={summaryLoading || salesLoading}
                                                    format={{ style: "currency", currency: "PHP", minimumFractionDigits: 2, maximumFractionDigits: 2 }}
                                                />
                                            </div>
                                        </AnimatedNumberGroup>
                                    </div>

                                    <div className="h-44">
                                        {salesLoading ? (
                                            <Skeleton className="w-full h-full rounded-lg" />
                                        ) : (
                                            <TimeSeriesChart
                                                data={salesOvertime || []}
                                                lines={[
                                                    {
                                                        key: "total_sales",
                                                        color: "var(--chart-2)",
                                                        label: "Sales",
                                                        gradientId: "heroSalesGrad",
                                                    },
                                                ]}
                                                height={176}
                                                showGrid={false}
                                            />
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </CardContent>
                </Card>
            </div>

            {/* Sales Status Donut */}
            <div className="lg:col-span-1">
                <Card className="overflow-hidden border border-border shadow-sm h-full">
                    <CardContent className="flex flex-col h-full">
                        <div className="flex items-center gap-3 mb-4">
                            <div
                                className="p-2 rounded-lg shrink-0"
                                style={{ backgroundColor: "color-mix(in srgb, var(--primary) 12%, transparent)" }}
                            >
                                <DollarSign className="size-4" style={{ color: "var(--primary)" }} />
                            </div>
                            <div>
                                <h3 className="text-sm sm:text-base font-semibold text-foreground">
                                    Sales Status
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Payment breakdown
                                </p>
                            </div>
                        </div>
                        <div className="flex-1 min-h-0">
                            <AnimatePresence mode="wait">
                                {statusLoading ? (
                                    <motion.div
                                        key="skeleton"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex items-center justify-center h-full"
                                    >
                                        <Skeleton className="size-40 rounded-full" />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="chart"
                                        className="h-full"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.5, ease: "easeOut" }}
                                    >
                                        <DonutChart
                                            data={unpaidStatus || []}
                                            nameKey="status"
                                            valueKey="count"
                                            height={280}
                                            innerRadius={55}
                                            outerRadius={85}
                                            showPercentage={true}
                                            showLegend={true}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
