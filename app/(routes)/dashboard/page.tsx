"use client"

import { BirthdayGreeting } from "@/components/custom/dashboard/BirthdayGreeting"
import { BirthdayReminders } from "@/components/custom/dashboard/BirthdayReminders"
import { EmployeePerformanceStats } from "@/components/custom/dashboard/EmployeePerformanceStats"
import { InventoryReorderAlerts } from "@/components/custom/dashboard/InventoryReorderAlerts"
import { LeaveBalanceSummary } from "@/components/custom/dashboard/LeaveBalanceSummary"
import { PendingItemsAlert } from "@/components/custom/dashboard/PendingItemsAlert"
import { QuickClockInOut } from "@/components/custom/dashboard/QuickClockInOut"
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

type DashboardFormValues = {
    range?: { from?: Date | null; to?: Date | null }
    stall?: number
}
// ── Sub-sections ────────────────────────────────────────────────────────────

function AdminDashboard() {
    return (
        <div className="space-y-6">
            <SectionReveal delay={0.05}>
                <HeroStatsSection />
            </SectionReveal>

            <SectionReveal delay={0.1}>
                <GradientMetricCards>
                    <WidgetErrorBoundary fallbackTitle="Sub stall settlement failed to load">
                        <SubStallSettlement variant="summary" />
                    </WidgetErrorBoundary>
                </GradientMetricCards>
            </SectionReveal>

            <SectionReveal delay={0.15}>
                <DashboardCalendar />
            </SectionReveal>

            <SectionReveal delay={0.2}>
                <DashboardCharts />
            </SectionReveal>

            <SectionReveal delay={0.25}>
                <div className="space-y-6">
                    <div className="grid gap-6 lg:grid-cols-2">
                        <WidgetErrorBoundary fallbackTitle="Reminders failed to load">
                            <RemindersAlerts />
                        </WidgetErrorBoundary>
                        <WidgetErrorBoundary fallbackTitle="Inventory alerts failed to load">
                            <InventoryReorderAlerts />
                        </WidgetErrorBoundary>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-3">
                        <WidgetErrorBoundary fallbackTitle="Pending items failed to load">
                            <PendingItemsAlert />
                        </WidgetErrorBoundary>
                        <BirthdayReminders />
                        <WidgetErrorBoundary fallbackTitle="Unclaimed alerts failed to load">
                            <UnclaimedApplianceAlerts />
                        </WidgetErrorBoundary>
                    </div>

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

    return (
        <div className="space-y-6">
            {payrollIncluded && (
                <SectionReveal delay={0.05}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                        <QuickClockInOut />

                        {isClerk && (
                            <WidgetErrorBoundary fallbackTitle="Pending items failed to load">
                                <PendingItemsAlert />
                            </WidgetErrorBoundary>
                        )}

                        {(isManager || isClerk) && (
                            <WidgetErrorBoundary fallbackTitle="Sub stall settlement failed to load">
                                <SubStallSettlement enableShortcut={isManager} />
                            </WidgetErrorBoundary>
                        )}

                        {isManager && (
                            <WidgetErrorBoundary fallbackTitle="Unclaimed alerts failed to load">
                                <UnclaimedApplianceAlerts />
                            </WidgetErrorBoundary>
                        )}

                        <LeaveBalanceSummary />

                        {isClerk && (
                            <WidgetErrorBoundary fallbackTitle="Inventory alerts failed to load">
                                <InventoryReorderAlerts stallOnly />
                            </WidgetErrorBoundary>
                        )}

                        {isTechnician && (
                            <BirthdayReminders className="lg:col-span-2" />
                        )}
                    </div>
                </SectionReveal>
            )}

            {(isManager || isClerk) && (
                <SectionReveal delay={0.1}>
                    <BirthdayReminders />
                </SectionReveal>
            )}

            {showCalendarLimited && (
                <SectionReveal delay={0.15}>
                    <DashboardCalendar
                        withSettings={false}
                        withRefresh={false}
                        eventTypes={NON_ADMIN_CALENDAR_EVENTS}
                    />
                </SectionReveal>
            )}

            {showCalendarFull && (
                <SectionReveal delay={0.15}>
                    <DashboardCalendar />
                </SectionReveal>
            )}
        </div>
    )
}

// ── Page ────────────────────────────────────────────────────────────────────

const DashboardPage = () => {
    const { refetch } = useGetSummary({})
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
                    onRefresh={isAdmin || role === "manager" ? () => refetch() : undefined}
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
