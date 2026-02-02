"use client"

import { BirthdayReminders } from "@/components/custom/dashboard/BirthdayReminders"
import { LeaveBalanceSummary } from "@/components/custom/dashboard/LeaveBalanceSummary"
import { MyTasksCard } from "@/components/custom/dashboard/MyTasksCard"
import { QuickClockInOut } from "@/components/custom/dashboard/QuickClockInOut"
import { RecentTransactions } from "@/components/custom/dashboard/RecentTransactions"
import { RemindersAlerts } from "@/components/custom/dashboard/RemindersAlerts"
import { SalesSummary } from "@/components/custom/dashboard/SalesSummary"
import { TodayScheduleCard } from "@/components/custom/dashboard/TodayScheduleCard"
import { UpcomingScheduleCard } from "@/components/custom/dashboard/UpcomingScheduleCard"
import DateRangePicker from "@/components/custom/inputs/DateRangePicker"
import DashboardCalendar from "@/components/custom/shared/calendar/DashboardCalendar"
import DashboardCharts from "@/components/custom/shared/charts/DashboardCharts"
import SummaryCards from "@/components/custom/shared/charts/SummaryCards"
import PageHeader from "@/components/custom/shared/PageHeader"
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
  const { role } = useCurrentUser()

  const form = useForm<DashboardFormValues>({
    defaultValues: {
      range: {
        from: new Date(),
        to: new Date(),
      },
      stall: undefined,
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
    <Wrapper>
      <PageHeader
        icon={BarChart3}
        title="Dashboard Overview"
        description={description[role || "guest"]}
        breadcrumbs={["Dashboard"]}
        onRefresh={
          role === "admin" || role === "manager" ? () => refetch() : undefined
        }
      />

      <div className="space-y-6">
        {/* Role-Based Dashboard Components */}
        {role === "technician" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 grid-rows-[auto_auto] gap-6">
            <div className="row-span-2">
              <UpcomingScheduleCard />
            </div>
            <TodayScheduleCard />
            <QuickClockInOut />
            <MyTasksCard />
            <LeaveBalanceSummary />
            <div className="col-span-full">
              <BirthdayReminders />
            </div>
          </div>
        )}

        {role === "clerk" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <QuickClockInOut />
            <LeaveBalanceSummary />
            <RecentTransactions />
            <RemindersAlerts />
            <SalesSummary />
            <BirthdayReminders />
          </div>
        )}

        {role === "manager" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <QuickClockInOut />
            <LeaveBalanceSummary />
            <div className="col-span-full">
              <BirthdayReminders />
            </div>
          </div>
        )}

        {role === "admin" && (
          <div className="grid grid-cols-1  gap-6">
            <BirthdayReminders />
          </div>
        )}

        {/* Calendar - All Roles */}
        {(role === "technician" || role === "clerk") && (
          <DashboardCalendar withSettings={false} />
        )}
        {(role === "admin" || role === "manager") && (
          <DashboardCalendar withSettings={true} />
        )}

        {/* Analytics - Admin & Manager Only */}
        {(role === "admin" || role === "manager") && (
          <FormProvider {...form}>
            <div className="space-y-6">
              {/* Date Range Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <TrendingUp className="size-5" />
                    Analytics & Metrics
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Select a date range to view performance data
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <DateRangePicker />
                </div>
              </div>

              {/* Summary Cards */}
              <SummaryCards />

              {/* Charts */}
              <DashboardCharts />
            </div>
          </FormProvider>
        )}
      </div>
    </Wrapper>
  )
}

export default DashboardPage
