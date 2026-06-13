"use client"

import { BirthdayGreeting } from "@/components/custom/dashboard/BirthdayGreeting"
import { BirthdayReminders } from "@/components/custom/dashboard/BirthdayReminders"
import { EmployeePerformanceStats } from "@/components/custom/dashboard/EmployeePerformanceStats"
import { InventoryReorderAlerts } from "@/components/custom/dashboard/InventoryReorderAlerts"
import { LeaveBalanceSummary } from "@/components/custom/dashboard/LeaveBalanceSummary"
import { PendingItemsAlert } from "@/components/custom/dashboard/PendingItemsAlert"
import { QuickClockInOut } from "@/components/custom/dashboard/QuickClockInOut"
import { RemindersAlerts } from "@/components/custom/dashboard/RemindersAlerts"
import { SubStallSettlement } from "@/components/custom/dashboard/SubStallSettlement"
import { SubStallSettlementStatCard } from "@/components/custom/dashboard/SubStallSettlementStatCard"
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
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useGetSummary } from "@/lib/queries/analytics/useGetAnalytics"
import { BarChart3 } from "lucide-react"
import { FormProvider, useForm } from "react-hook-form"

type DashboardFormValues = {
    range?: {
        from?: Date | null
        to?: Date | null
    }
    stall?: number
}

const DashboardPage = () => {
    const { refetch } = useGetSummary({})
    const { role, userProfile, payrollIncluded } = useCurrentUser()
    const stallId = userProfile?.assigned_stall?.id || undefined

    // Default to last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const form = useForm<DashboardFormValues>({
        defaultValues: {
            range: {
                from: thirtyDaysAgo,
                to: new Date(),
            },
            stall: role !== "technician" ? stallId : undefined,
        },
    })

    const description = {
        admin:
            "Monitor your business performance with real-time analytics, sales metrics, and operational insights.",
        manager:
            "View key performance indicators and metrics to help manage your team's productivity and efficiency.",
        technician:
            "Access your personal performance metrics and stay updated with your tasks and schedules.",
        clerk:
            "Access essential business metrics and reports to assist in daily operations and record-keeping.",
        guest:
            "Welcome to the dashboard. Please contact your administrator for access.",
    }

    return (
        <FormProvider {...form}>
            <Wrapper>
                {/* Birthday Greeting Modal */}
                <BirthdayGreeting />

                <PageHeader
                    icon={BarChart3}
                    title="Dashboard Overview"
                    description={description[role || "guest"]}
                    breadcrumbs={["Dashboard"]}
                    onRefresh={
                        role === "admin" || role === "manager" ? () => refetch() : undefined
                    }
                    actionButton={
                        role !== "technician" ? (
                            <DateRangePicker classNames="mx-auto" />
                        ) : undefined
                    }
                />

                <div className="space-y-6">
                    {/* Employee Section (technician, clerk, manager) */}
                    {(role === "technician" ||
                        role === "clerk" ||
                        role === "manager") && (
                            <div className="space-y-6">
                                {payrollIncluded && (
                                    <SectionReveal delay={0.05}>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                                            {/* Clock In/Out */}
                                            <QuickClockInOut />

                                            {/* Pending Items for Clerk */}
                                            {role === "clerk" && (
                                                <WidgetErrorBoundary fallbackTitle="Pending items failed to load">
                                                    <PendingItemsAlert />
                                                </WidgetErrorBoundary>
                                            )}

                                            {/* Sub Stall Settlement for Manager */}
                                            {["manager", "clerk"].includes(role) && (
                                                <WidgetErrorBoundary fallbackTitle="Sub stall settlement failed to load">
                                                    <SubStallSettlement />
                                                </WidgetErrorBoundary>
                                            )}

                                            {/* Unclaimed Appliance Alerts for Manager */}
                                            {role === "manager" && (
                                                <WidgetErrorBoundary fallbackTitle="Unclaimed alerts failed to load">
                                                    <UnclaimedApplianceAlerts />
                                                </WidgetErrorBoundary>
                                            )}

                                            {/* Leave Balance */}
                                            <LeaveBalanceSummary />

                                            {/* Inventory Alerts for Clerk */}
                                            {role === "clerk" && (
                                                <WidgetErrorBoundary fallbackTitle="Inventory alerts failed to load">
                                                    <InventoryReorderAlerts stallOnly />
                                                </WidgetErrorBoundary>
                                            )}

                                            {/* Birthday Reminders for Technician */}
                                            {role === "technician" && (
                                                <BirthdayReminders className="lg:col-span-2" />
                                            )}
                                        </div>
                                    </SectionReveal>
                                )}

                                {(role === "manager" || role === "clerk") && (
                                    <SectionReveal delay={0.1}>
                                        <BirthdayReminders />
                                    </SectionReveal>
                                )}
                            </div>
                        )}

                    {/* Admin Dashboard */}
                    {role === "admin" && (
                        <div className="space-y-6">
                            <SectionReveal delay={0.05}>
                                {/* Calendar */}
                                <DashboardCalendar />
                            </SectionReveal>

                            <SectionReveal delay={0.1}>
                                {/* Hero Stats */}
                                <HeroStatsSection />
                            </SectionReveal>

                            {/* Colorful Gradient Metric Cards + Sub Stall Settlement */}
                            <SectionReveal delay={0.15}>
                                <GradientMetricCards>
                                    <WidgetErrorBoundary fallbackTitle="Sub stall settlement failed to load">
                                        <SubStallSettlementStatCard enableShortcut />
                                    </WidgetErrorBoundary>
                                </GradientMetricCards>
                            </SectionReveal>

                            {/* Charts: Cash Flow, Top Items, Top Clients */}
                            <SectionReveal delay={0.2}>
                                <DashboardCharts />
                            </SectionReveal>

                            {/* Bottom: Alerts + Employee Performance */}
                            <SectionReveal delay={0.25}>
                                <div className="space-y-6">
                                    {/* Alerts row */}
                                    <div className="grid gap-6 lg:grid-cols-2">
                                        <WidgetErrorBoundary fallbackTitle="Reminders failed to load">
                                            <RemindersAlerts />
                                        </WidgetErrorBoundary>
                                        <WidgetErrorBoundary fallbackTitle="Inventory alerts failed to load">
                                            <InventoryReorderAlerts />
                                        </WidgetErrorBoundary>
                                    </div>

                                    {/* Pending Items + Birthday Reminders + Unclaimed Alerts */}
                                    <div className="grid gap-6 lg:grid-cols-3">
                                        <WidgetErrorBoundary fallbackTitle="Pending items failed to load">
                                            <PendingItemsAlert />
                                        </WidgetErrorBoundary>
                                        <BirthdayReminders />
                                        <WidgetErrorBoundary fallbackTitle="Unclaimed alerts failed to load">
                                            <UnclaimedApplianceAlerts />
                                        </WidgetErrorBoundary>
                                    </div>

                                    {/* Employee Performance - full width */}
                                    <WidgetErrorBoundary fallbackTitle="Employee performance failed to load">
                                        <EmployeePerformanceStats />
                                    </WidgetErrorBoundary>
                                </div>
                            </SectionReveal>
                        </div>
                    )}

                    {/* Calendar for non-admin roles */}
                    {(role === "technician" || role === "clerk") && (
                        <SectionReveal delay={0.15}>
                            <DashboardCalendar
                                withSettings={false}
                                withRefresh={false}
                                eventTypes={[
                                    "birthday",
                                    "custom_event",
                                    "holiday",
                                    "half_day",
                                    "shop_closed",
                                    "leave",
                                ]}
                            />
                        </SectionReveal>
                    )}
                    {role === "manager" && (
                        <SectionReveal delay={0.15}>
                            <DashboardCalendar />
                        </SectionReveal>
                    )}
                </div>
            </Wrapper>
        </FormProvider>
    )
}

export default DashboardPage
