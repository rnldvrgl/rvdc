"use client"

import { BirthdayGreeting } from "@/components/custom/dashboard/BirthdayGreeting"
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
  const { role, userProfile } = useCurrentUser()
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <QuickClockInOut />
              <LeaveBalanceSummary />
              <RecentTransactions />
              <SalesSummary />
              <div className="col-span-full">
                <BirthdayReminders />
              </div>
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
            <div className="grid lg:grid-cols-2  gap-6">
              <RemindersAlerts />
              <BirthdayReminders />
            </div>
          )}

          {(role === "technician" || role === "clerk") && (
            <DashboardCalendar
              withSettings={false}
              withRefresh={false}
            />
          )}
          {(role === "admin" || role === "manager") && <DashboardCalendar />}

          {/* Analytics - Admin & Manager Only */}
          {(role === "admin" || role === "manager") && (
            <div className="space-y-6">
              {/* Date Range Controls */}
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="size-5" />
                Analytics & Metrics
              </h2>
              {/* Summary Cards */}
              <SummaryCards />

              {/* Charts */}
              <DashboardCharts />
            </div>
          )}
        </div>
      </Wrapper>
    </FormProvider>
  )
}

export default DashboardPage
