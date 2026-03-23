"use client"

import DateRangePicker from "@/components/custom/inputs/DateRangePicker"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useStalls } from "@/lib/queries/inventory/useStalls"

import { Download, FileSpreadsheet, Store } from "lucide-react"
import { FormProvider, useForm, useFormContext } from "react-hook-form"

import { ExportCenter } from "@/app/(routes)/reports/_components/ExportCenter"
import { ExpensesReport } from "./_components/ExpensesReport"
import { SalesReport } from "./_components/SalesReport"
import { ServicesReport } from "./_components/ServicesReport"
import { SummaryReport } from "./_components/SummaryReport"

// ── Stall Filter ───────────────────────────────────────

function StallFilter({ stalls }: { stalls: { id: number; name: string }[] }) {
  const form = useFormContext()

  return (
    <Select
      onValueChange={(v) =>
        form.setValue("stall", v === "all" ? undefined : Number(v))
      }
    >
      <SelectTrigger className="w-[180px]">
        <Store className="size-4 mr-2 text-muted-foreground" />
        <SelectValue placeholder="All Stalls" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Stalls</SelectItem>
        {stalls.map((s) => (
          <SelectItem
            key={s.id}
            value={String(s.id)}
          >
            {s.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// ── Page ───────────────────────────────────────────────

/** Name of the stall that owns services (case-insensitive match) */
const SERVICES_STALL_NAME = "main"

export default function ReportsPage() {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: stallData } = useStalls({ limit: 50 })
  const stalls = stallData?.results ?? []

  const form = useForm({
    defaultValues: {
      range: { from: thirtyDaysAgo, to: new Date() },
      stall: undefined as number | undefined,
    },
  })

  const selectedStallId = form.watch("stall")
  const selectedStallName = stalls.find((s) => s.id === selectedStallId)?.name
  const showServicesTab =
    selectedStallId === undefined ||
    selectedStallName?.toLowerCase() === SERVICES_STALL_NAME

  return (
    <FormProvider {...form}>
      <Wrapper>
        <PageHeader
          icon={FileSpreadsheet}
          title="Reports & Export"
          description="View financial reports, performance analytics, and export data to CSV."
          breadcrumbs={["Dashboard", "Reports"]}
          actionButton={
            <div className="flex flex-col xl:flex-row items-center gap-4">
              <StallFilter stalls={stalls} />
              <DateRangePicker classNames="mx-auto" />
            </div>
          }
        />

        <Tabs
          defaultValue="summary"
          className="space-y-6"
        >
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            {showServicesTab ? (
              <TabsTrigger value="services">Services</TabsTrigger>
            ) : null}
            <TabsTrigger
              value="export"
              className="gap-1.5"
            >
              <Download className="size-3.5" />
              Export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <SummaryReport />
          </TabsContent>
          <TabsContent value="sales">
            <SalesReport />
          </TabsContent>
          <TabsContent value="expenses">
            <ExpensesReport />
          </TabsContent>
          <TabsContent value="services">
            <ServicesReport />
          </TabsContent>
          <TabsContent value="export">
            <ExportCenter />
          </TabsContent>
        </Tabs>
      </Wrapper>
    </FormProvider>
  )
}
