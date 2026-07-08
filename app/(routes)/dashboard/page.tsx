"use client"

import { BirthdayGreeting } from "@/components/custom/dashboard/BirthdayGreeting"
import { BirthdayReminders } from "@/components/custom/dashboard/BirthdayReminders"
import { EmployeePerformanceStats } from "@/components/custom/dashboard/EmployeePerformanceStats"
import { InventoryReorderAlerts } from "@/components/custom/dashboard/InventoryReorderAlerts"
import { LeaveBalanceSummary } from "@/components/custom/dashboard/LeaveBalanceSummary"
import { PendingItemsAlert } from "@/components/custom/dashboard/PendingItemsAlert"
import { RemindersAlerts } from "@/components/custom/dashboard/RemindersAlerts"
import { SubStallSettlement } from "../../../components/custom/dashboard/SubStallSettlement"
import { UnclaimedApplianceAlerts } from "@/components/custom/dashboard/UnclaimedApplianceAlerts"
import DateRangePicker from "@/components/custom/inputs/DateRangePicker"
import DashboardCalendar from "@/components/custom/shared/calendar/DashboardCalendar"
import DashboardCharts from "@/components/custom/shared/charts/DashboardCharts"
import GradientMetricCards from "@/components/custom/shared/charts/GradientMetricCards"
import HeroStatsSection from "@/components/custom/shared/charts/HeroStatsSection"
import { SectionReveal } from "@/components/custom/shared/charts/MotionWrappers"
import PageHeader from "@/components/custom/shared/PageHeader"
import { WidgetErrorBoundary } from "@/components/custom/shared/WidgetErrorBoundary"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { NON_ADMIN_CALENDAR_EVENTS, ROLE_DESCRIPTIONS } from "@/lib/constants/general"
import { Roles } from "@/lib/constants/types"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useGetSummary } from "@/lib/queries/analytics/useGetAnalytics"
import { BarChart3 } from "lucide-react"
import { FormProvider, useForm } from "react-hook-form"
import { cn } from "@/lib/utils/helpers"
import { TimetableStatsCard } from "@/components/custom/attendance/TimetableStatsCard"
import { ClockInOut } from "@/components/custom/attendance/ClockInOut"

type DashboardFormValues = {
    range?: { from?: Date | null; to?: Date | null }
    stall?: number
}

// ── Sub-sections ────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <p className="mb-4 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {children}
        </p>
    )
}

function AttentionRail() {
    return (
        <div className="flex flex-col">
            <SectionLabel>Needs attention</SectionLabel>

            <div className="space-y-4">
                <WidgetErrorBoundary fallbackTitle="Reminders failed to load">
                    <RemindersAlerts />
                </WidgetErrorBoundary>
                <WidgetErrorBoundary fallbackTitle="Pending items failed to load">
                    <PendingItemsAlert />
                </WidgetErrorBoundary>
                <WidgetErrorBoundary fallbackTitle="Inventory alerts failed to load">
                    <InventoryReorderAlerts />
                </WidgetErrorBoundary>
                <WidgetErrorBoundary fallbackTitle="Unclaimed alerts failed to load">
                    <UnclaimedApplianceAlerts />
                </WidgetErrorBoundary>
                <BirthdayReminders />
            </div>
        </div>
    )
}

function AdminDashboard() {
    return (
        <div className="space-y-6">
            <SectionReveal delay={0.05}>
                <HeroStatsSection />
            </SectionReveal>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]">
                <div className="min-w-0 space-y-6">
                    <SectionReveal delay={0.1}>
                        <div>
                            <SectionLabel>Schedule</SectionLabel>
                            <DashboardCalendar />
                        </div>
                    </SectionReveal>

                    <SectionReveal delay={0.15} >
                        <GradientMetricCards>
                            <WidgetErrorBoundary fallbackTitle="Sub stall settlement failed to load">
                                <SubStallSettlement />
                            </WidgetErrorBoundary>
                        </GradientMetricCards>
                    </SectionReveal>

                    <SectionReveal delay={0.2}>
                        <DashboardCharts />
                    </SectionReveal>
                </div>

                <SectionReveal delay={0.1} className="order-first lg:order-0 min-w-0">
                    <div className="lg:sticky lg:top-14">
                        <AttentionRail />
                    </div>
                </SectionReveal>
            </div>

            <SectionReveal delay={0.3}>
                <div>
                    <SectionLabel>Performance</SectionLabel>
                    <WidgetErrorBoundary fallbackTitle="Employee performance failed to load">
                        <EmployeePerformanceStats />
                    </WidgetErrorBoundary>
                </div>
            </SectionReveal>
        </div>
    )
}

function EmployeeDashboard({
    role,
    payrollIncluded,
}: {
    role: Roles
    payrollIncluded: boolean
}) {
    const isManager = role === "manager"
    const isClerk = role === "clerk"
    const isTechnician = role === "technician"
    const showCalendarFull = isManager
    const showCalendarLimited = isTechnician || isClerk
    const hasAttentionItems = isManager || isClerk

    return (
        <div className="space-y-6">
            {showCalendarFull && (
                <SectionReveal delay={0.05}>
                    <DashboardCalendar />
                </SectionReveal>
            )}

            {payrollIncluded && (
                <SectionReveal delay={0.1}>
                    <div className="grid gap-4 xl:grid-cols-2 xl:gap-6 min-w-0">
                        <div className="min-w-0"><ClockInOut variant="compact" /></div>
                        <div className="min-w-0"><TimetableStatsCard /></div>
                    </div>
                </SectionReveal>
            )}

            {payrollIncluded && (
                <SectionReveal delay={0.12}>
                    <LeaveBalanceSummary />
                </SectionReveal>
            )}

            {payrollIncluded && hasAttentionItems && (
                <SectionReveal delay={0.15}>
                    {/* sm:grid-cols-2 lg:grid-cols-3 */}
                    <div className={cn("grid gap-4", isManager ? "lg:grid-cols-2" : "xl:grid-cols-3")}>
                        {isClerk && (
                            <WidgetErrorBoundary fallbackTitle="Pending items failed to load">
                                <PendingItemsAlert />
                            </WidgetErrorBoundary>
                        )}
                        {isManager && (
                            <WidgetErrorBoundary fallbackTitle="Unclaimed alerts failed to load">
                                <UnclaimedApplianceAlerts />
                            </WidgetErrorBoundary>
                        )}
                        {isClerk && (
                            <WidgetErrorBoundary fallbackTitle="Inventory alerts failed to load">
                                <InventoryReorderAlerts stallOnly />
                            </WidgetErrorBoundary>
                        )}
                        <WidgetErrorBoundary fallbackTitle="Sub stall settlement failed to load">
                            <SubStallSettlement enableShortcut={true} />
                        </WidgetErrorBoundary>
                    </div>
                </SectionReveal>
            )}

            {(isTechnician || isManager || isClerk) && (
                <SectionReveal delay={0.2}>
                    <BirthdayReminders />
                </SectionReveal>
            )}

            {showCalendarLimited && (
                <SectionReveal delay={0.05}>
                    <DashboardCalendar
                        withSettings={false}
                        withRefresh={false}
                        eventTypes={NON_ADMIN_CALENDAR_EVENTS}
                    />
                </SectionReveal>
            )}
        </div>
    )
}

// ── Page ────────────────────────────────────────────────────────────────────

const DashboardPage = () => {
    const { role, userProfile, payrollIncluded } = useCurrentUser()

    const stallId = userProfile?.assigned_stall?.id ?? undefined
    const isAdmin = role === "admin"
    const isEmployee = role === "technician" || role === "clerk" || role === "manager"

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const form = useForm<DashboardFormValues>({
        defaultValues: {
            range: { from: thirtyDaysAgo, to: new Date() },
            stall: role !== "technician" ? stallId : undefined,
        },
    })

    return (
        <FormProvider {...form}>
            <Wrapper>
                <BirthdayGreeting />

                <PageHeader
                    icon={BarChart3}
                    title="Dashboard Overview"
                    description={ROLE_DESCRIPTIONS[role ?? "guest"]}
                    breadcrumbs={["Dashboard"]}
                    variant="compact"
                    actionButton={
                        role !== "technician" ? (
                            <DateRangePicker classNames="mx-auto" />
                        ) : undefined
                    }
                />

                <div className="space-y-6">
                    {isAdmin && <AdminDashboard />}
                    {isEmployee && (
                        <EmployeeDashboard
                            role={role as Roles}
                            payrollIncluded={payrollIncluded}
                        />
                    )}
                </div>
            </Wrapper>
        </FormProvider>
    )
}

export default DashboardPage
