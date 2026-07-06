"use client"

import {
    FadeUpItem,
    StaggerGrid,
} from "@/components/custom/shared/charts/MotionWrappers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDateParamsFromForm } from "@/lib/hooks/useDateParamsFromForm"
import {
    useCashFlow,
    useTopClients,
    useTopSellingItems,
} from "@/lib/queries/analytics/useGetAnalytics"
import { useStalls } from "@/lib/queries/inventory/useStalls"
import { AnimatePresence, motion } from "framer-motion"
import { DollarSign, Package, Users } from "lucide-react"
import { useMemo, useState, type ReactNode } from "react"
import BarChart from "./BarChart"
import TimeSeriesChart from "./TimeSeriesChart"
import { CHART_SERIES_COLORS } from "@/lib/constants/theme"

const ChartCard = ({
    title,
    description,
    icon: Icon,
    headerAction,
    isLoading,
    height = "h-80",
    children,
}: {
    title: string
    description?: string
    icon?: React.ElementType
    headerAction?: ReactNode
    isLoading: boolean
    height?: string
    children: ReactNode
}) => (
    <motion.div
        whileHover={{ y: -4, transition: { duration: 0.2, ease: "easeOut" } }}
        // @container: header/padding below respond to THIS card's own
        // rendered width, not the viewport — so a card squeezed by the
        // attention rail stacks its header even at a wide xl viewport.
        className="@container h-full"
    >
        <Card className="overflow-hidden border border-border shadow-sm hover:shadow-md transition-shadow duration-300 bg-card h-full">
            <CardHeader className="border-b border-border px-4 @md:px-6">
                <CardTitle className="text-sm @lg:text-base font-semibold flex flex-col @md:flex-row @md:items-center @md:justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        {Icon && (
                            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                                <Icon className="size-4 text-primary" />
                            </div>
                        )}
                        <div className="space-y-0.5 min-w-0">
                            <span className="text-foreground">{title}</span>
                            {description && (
                                <p className="text-xs font-normal text-muted-foreground">
                                    {description}
                                </p>
                            )}
                        </div>
                    </div>
                    {headerAction}
                </CardTitle>
            </CardHeader>
            <CardContent className={`${height} p-4 @md:p-5`}>
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div
                            key="skeleton"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Skeleton className="w-full h-full rounded-lg" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="chart"
                            className="w-full h-full"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                        >
                            {children}
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    </motion.div>
)

function CashFlowStallTabs({
    value,
    onChange,
}: {
    value: string
    onChange: (value: string) => void
}) {
    return (
        <Tabs value={value} onValueChange={onChange}>
            <TabsList className="h-8">
                <TabsTrigger value="all" className="text-xs px-3 h-7">
                    All
                </TabsTrigger>
                <TabsTrigger value="main" className="text-xs px-3 h-7">
                    Main
                </TabsTrigger>
                <TabsTrigger value="sub" className="text-xs px-3 h-7">
                    Sub
                </TabsTrigger>
            </TabsList>
        </Tabs>
    )
}

export default function DashboardCharts() {
    const { start_date, end_date, stall } = useDateParamsFromForm()
    const [cashFlowStallTab, setCashFlowStallTab] = useState<string>("all")

    const { data: stallsData } = useStalls({ limit: 50 })
    const stalls = stallsData?.results ?? []
    const mainStall = stalls.find((s) => s.stall_type === "main")
    const subStall = stalls.find((s) => s.stall_type === "sub")

    const cashFlowStall = useMemo(() => {
        if (cashFlowStallTab === "main" && mainStall) return mainStall.id
        if (cashFlowStallTab === "sub" && subStall) return subStall.id
        if (cashFlowStallTab === "all") return undefined
        return stall
    }, [cashFlowStallTab, mainStall, subStall, stall])

    const { data: topSellingItems, isLoading: topSellingItemsLoading } =
        useTopSellingItems({ start_date, end_date, stall })
    const { data: cashFlow, isLoading: cashFlowLoading } = useCashFlow({
        start_date,
        end_date,
        stall: cashFlowStall,
    })
    const { data: topClients, isLoading: topClientsLoading } = useTopClients({
        start_date,
        end_date,
        stall,
    })

    return (
        // @container: the 1-vs-2-column split below is now driven by this
        // element's own rendered width (i.e. the primary column's width),
        // not the viewport. Previously `xl:grid-cols-2` fired at 1280px of
        // VIEWPORT width regardless of how much of that was eaten by the
        // sticky attention rail, so two charts could end up squeezed into
        // ~380px each on a wide screen. @4xl (896px) requires the column
        // itself to actually have room before splitting.
        <StaggerGrid className="@container grid gap-6 lg:gap-8 @4xl:grid-cols-2">
            <FadeUpItem className="@4xl:col-span-2">
                <ChartCard
                    title="Cash Flow Analysis"
                    description="Income vs expenses over time"
                    icon={DollarSign}
                    isLoading={cashFlowLoading}
                    headerAction={
                        <CashFlowStallTabs
                            value={cashFlowStallTab}
                            onChange={setCashFlowStallTab}
                        />
                    }
                >
                    <TimeSeriesChart
                        data={cashFlow || []}
                        lines={[
                            {
                                key: "income",
                                color: CHART_SERIES_COLORS.success,
                                label: "Income",
                                gradientId: "incomeGradient",
                            },
                            {
                                key: "expense",
                                color: CHART_SERIES_COLORS.warning,
                                label: "Expense",
                                gradientId: "expenseFlowGradient",
                            },
                        ]}
                        height={280}
                    />
                </ChartCard>
            </FadeUpItem>

            <FadeUpItem>
                <ChartCard
                    title="Top Selling Items"
                    icon={Package}
                    description="Best performing products"
                    isLoading={topSellingItemsLoading}
                >
                    <BarChart
                        data={topSellingItems || []}
                        xKey="item"
                        yKey="quantity"
                        color={CHART_SERIES_COLORS.quinary}
                        height={280}
                        gradientIntensity={0.4}
                    />
                </ChartCard>
            </FadeUpItem>

            <FadeUpItem>
                <ChartCard
                    title="Top Clients"
                    icon={Users}
                    description="Your most valuable customers"
                    isLoading={topClientsLoading}
                >
                    <BarChart
                        data={topClients || []}
                        xKey="client"
                        yKey="total_spent"
                        color={CHART_SERIES_COLORS.info}
                        height={280}
                        gradientIntensity={0.4}
                    />
                </ChartCard>
            </FadeUpItem>
        </StaggerGrid>
    )
}
