"use client"

import { BirthdayGreeting } from "@/components/custom/dashboard/BirthdayGreeting"
import { BirthdayReminders } from "@/components/custom/dashboard/BirthdayReminders"
import { EmployeePerformanceStats } from "@/components/custom/dashboard/EmployeePerformanceStats"
import { InventoryReorderAlerts } from "@/components/custom/dashboard/InventoryReorderAlerts"
import { LeaveBalanceSummary } from "@/components/custom/dashboard/LeaveBalanceSummary"
import { QuickClockInOut } from "@/components/custom/dashboard/QuickClockInOut"
import { RecentTransactions } from "@/components/custom/dashboard/RecentTransactions"
import { RemindersAlerts } from "@/components/custom/dashboard/RemindersAlerts"
import { SalesSummary } from "@/components/custom/dashboard/SalesSummary"
import { WarrantyExpirationAlerts } from "@/components/custom/dashboard/WarrantyExpirationAlerts"
import DateRangePicker from "@/components/custom/inputs/DateRangePicker"
import DashboardCalendar from "@/components/custom/shared/calendar/DashboardCalendar"
import DashboardCharts from "@/components/custom/shared/charts/DashboardCharts"
import SummaryCards from "@/components/custom/shared/charts/SummaryCards"
import PageHeader from "@/components/custom/shared/PageHeader"
import { WidgetErrorBoundary } from "@/components/custom/shared/WidgetErrorBoundary"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useGetSummary } from "@/lib/queries/analytics/useGetAnalytics"
import { BarChart3, TrendingUp } from "lucide-react"
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
          {/* Role-Based Dashboard Components */}
          {role === "technician" && (
            <div className="space-y-6">
              {payrollIncluded && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <QuickClockInOut />
                  <LeaveBalanceSummary />
                </div>
              )}
              <BirthdayReminders />
            </div>
          )}

          {role === "clerk" && (
            <div className="space-y-6">
              {/* Top Row - Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <div className="xl:col-span-2">
                  <QuickClockInOut />
                </div>
                <div className="xl:col-span-2">
                  <LeaveBalanceSummary />
                </div>
              </div>

              {/* Middle Row - Transactions & Sales */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <RecentTransactions />
                <SalesSummary />
              </div>

              {/* Bottom Row - Birthdays */}
              <BirthdayReminders />
            </div>
          )}

          {role === "manager" && (
            <div className="space-y-6">
              {/* Top Row - Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <div className="xl:col-span-2">
                  <QuickClockInOut />
                </div>
                <div className="xl:col-span-2">
                  <LeaveBalanceSummary />
                </div>
              </div>

              {/* Bottom Row - Birthdays */}
              <BirthdayReminders />
            </div>
          )}

          {role === "admin" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <WidgetErrorBoundary fallbackTitle="Reminders failed to load">
                <RemindersAlerts />
              </WidgetErrorBoundary>
              <WidgetErrorBoundary fallbackTitle="Birthdays failed to load">
                <BirthdayReminders />
              </WidgetErrorBoundary>
              <WidgetErrorBoundary fallbackTitle="Inventory alerts failed to load">
                <InventoryReorderAlerts />
              </WidgetErrorBoundary>
              <WidgetErrorBoundary fallbackTitle="Warranty alerts failed to load">
                <WarrantyExpirationAlerts />
              </WidgetErrorBoundary>
            </div>
          )}

          {(role === "technician" || role === "clerk") && (
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
          )}
          {(role === "admin" || role === "manager") && <DashboardCalendar />}

          {/* Analytics - Admin & Manager Only */}
          {role === "admin" && (
            <div className="space-y-8">
              {/* Section Header */}
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="size-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Analytics & Metrics</h2>
                  <p className="text-sm text-muted-foreground">
                    Track your business performance and growth
                  </p>
                </div>
              </div>

              {/* Summary Cards */}
              <SummaryCards />

              {/* Charts */}
              <DashboardCharts />

              {/* Employee Performance */}
              <WidgetErrorBoundary fallbackTitle="Employee performance failed to load">
                <EmployeePerformanceStats />
              </WidgetErrorBoundary>
            </div>
          )}
        </div>
      </Wrapper>
    </FormProvider>
  )
}

export default DashboardPage
