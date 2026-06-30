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
import { useMemo, useState } from "react"
import BarChart from "./BarChart"
import TimeSeriesChart from "./TimeSeriesChart"
import { CHART_SERIES_COLORS } from "@/lib/constants/theme"

const ChartCard = ({
    title,
    isLoading,
    children,
    icon: Icon,
    description,
}: {
    title: string
    isLoading: boolean
    children: React.ReactNode
    icon?: React.ElementType
    description?: string
}) => (
    <motion.div
        whileHover={{ y: -4, transition: { duration: 0.2, ease: "easeOut" } }}
    >
        <Card className="overflow-hidden border border-border shadow-sm hover:shadow-md transition-shadow duration-300 bg-card h-full">
            <CardHeader className="border-b border-border ">
                <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-3">
                    {Icon && (
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Icon className="size-4 text-primary" />
                        </div>
                    )}
                    <div className="space-y-0.5">
                        <span className="text-foreground">{title}</span>
                        {description && (
                            <p className="text-xs font-normal text-muted-foreground">
                                {description}
                            </p>
                        )}
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="h-80">
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
        <StaggerGrid className="grid gap-6 lg:gap-8 xl:grid-cols-2">
            <FadeUpItem className="xl:col-span-2">
                <motion.div
                    whileHover={{ y: -4, transition: { duration: 0.2, ease: "easeOut" } }}
                >
                    <Card className="overflow-hidden border border-border shadow-sm hover:shadow-md transition-shadow duration-300 h-full">
                        <CardHeader className="pb-4 border-b border-border px-4 sm:px-6">
                            <CardTitle className="text-sm sm:text-base font-semibold flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                                        <DollarSign className="size-4 text-primary" />
                                    </div>
                                    <div className="space-y-0.5 min-w-0">
                                        <span className="text-foreground">Cash Flow Analysis</span>
                                        <p className="text-xs font-normal text-muted-foreground">
                                            Income vs expenses over time
                                        </p>
                                    </div>
                                </div>
                                <Tabs
                                    value={cashFlowStallTab}
                                    onValueChange={setCashFlowStallTab}
                                >
                                    <TabsList className="h-8">
                                        <TabsTrigger
                                            value="all"
                                            className="text-xs px-3 h-7"
                                        >
                                            All
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="main"
                                            className="text-xs px-3 h-7"
                                        >
                                            Main
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="sub"
                                            className="text-xs px-3 h-7"
                                        >
                                            Sub
                                        </TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-80 p-4 sm:p-5">
                            <AnimatePresence mode="wait">
                                {cashFlowLoading ? (
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
                                        transition={{
                                            duration: 0.4,
                                            ease: [0.25, 0.46, 0.45, 0.94],
                                        }}
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
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </CardContent>
                    </Card>
                </motion.div>
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
