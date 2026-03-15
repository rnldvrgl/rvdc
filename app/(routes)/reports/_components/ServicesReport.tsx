"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Service } from "@/lib/constants/interface"
import { useDateParamsFromForm } from "@/lib/hooks/useDateParamsFromForm"
import { useServices } from "@/lib/queries/services/useServices"
import { ExportColumn, exportToCSV } from "@/lib/utils/export"
import { Download } from "lucide-react"
import { useMemo } from "react"

function peso(v: string | number) {
  return `₱${Number(v).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function ServicesReport() {
  const { start_date, end_date, stall } = useDateParamsFromForm()
  const { data: serviceData, isLoading } = useServices({
    limit: 100,
    start_date,
    end_date,
    filter: stall ? { main_stall: String(stall) } : undefined,
  })

  const services = useMemo(() => serviceData?.results ?? [], [serviceData])

  const {
    totalRevenue,
    totalMainRevenue,
    totalSubRevenue,
    totalCost,
    totalPaid,
    byStatus,
  } = useMemo(() => {
    const totalRevenue = services.reduce(
      (s, svc) => s + Number(svc.total_revenue ?? 0),
      0,
    )
    const totalMainRevenue = services.reduce(
      (s, svc) => s + Number(svc.main_stall_revenue ?? 0),
      0,
    )
    const totalSubRevenue = services.reduce(
      (s, svc) => s + Number(svc.sub_stall_revenue ?? 0),
      0,
    )
    const totalCost = services.reduce(
      (s, svc) => s + Number(svc.total_cost ?? 0),
      0,
    )
    const totalPaid = services.reduce(
      (s, svc) => s + Number(svc.total_paid ?? 0),
      0,
    )
    const byStatus = services.reduce(
      (acc, svc) => {
        const st = svc.status ?? "unknown"
        acc[st] = (acc[st] ?? 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )
    return {
      totalRevenue,
      totalMainRevenue,
      totalSubRevenue,
      totalCost,
      totalPaid,
      byStatus,
    }
  }, [services])

  const handleExport = () => {
    const cols: ExportColumn<Service>[] = [
      { header: "ID", accessor: (r) => r.id },
      { header: "Client", accessor: (r) => r.client?.full_name ?? "" },
      { header: "Type", accessor: (r) => r.service_type ?? "" },
      { header: "Mode", accessor: (r) => r.service_mode ?? "" },
      { header: "Status", accessor: (r) => r.status ?? "" },
      {
        header: "Main Stall",
        accessor: (r) => Number(r.main_stall_revenue ?? 0),
      },
      {
        header: "Sub Stall",
        accessor: (r) => Number(r.sub_stall_revenue ?? 0),
      },
      { header: "Revenue", accessor: (r) => Number(r.total_revenue ?? 0) },
      { header: "Cost", accessor: (r) => Number(r.total_cost ?? 0) },
      { header: "Paid", accessor: (r) => Number(r.total_paid ?? 0) },
      { header: "Balance Due", accessor: (r) => Number(r.balance_due ?? 0) },
      {
        header: "Payment Status",
        accessor: (r) => r.payment_status ?? "",
      },
    ]
    exportToCSV(services, cols, `services-report-${start_date}-${end_date}`)
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total Services</p>
            <p className="text-2xl font-bold">{services.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Revenue</p>
            <p className="text-2xl font-bold text-success">
              {peso(totalRevenue)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Main Stall</p>
            <p className="text-xl font-bold">{peso(totalMainRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Sub Stall</p>
            <p className="text-xl font-bold">{peso(totalSubRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Costs</p>
            <p className="text-2xl font-bold text-rose-600">
              {peso(totalCost)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Collected</p>
            <p className="text-2xl font-bold">{peso(totalPaid)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Status breakdown */}
      {Object.keys(byStatus).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(byStatus)
            .sort((a, b) => b[1] - a[1])
            .map(([status, count]) => (
              <Badge
                key={status}
                variant="outline"
                className="text-sm py-1"
              >
                {status}: {count}
              </Badge>
            ))}
        </div>
      )}

      {/* Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">
            Service Records ({services.length})
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={!services.length}
          >
            <Download className="size-4 mr-1.5" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-10 bg-muted rounded animate-pulse"
                />
              ))}
            </div>
          ) : services.length ? (
            <div className="border rounded-lg overflow-x-auto max-h-96">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>ID</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Main</TableHead>
                    <TableHead className="text-right">Sub</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead>Payment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((svc) => (
                    <TableRow key={svc.id}>
                      <TableCell className="font-mono text-sm">
                        #{String(svc.id).padStart(4, "0")}
                      </TableCell>
                      <TableCell className="text-sm">
                        {svc.client?.full_name ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm capitalize">
                        {svc.service_type ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-xs capitalize"
                        >
                          {svc.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {Number(svc.main_stall_revenue ?? 0) > 0
                          ? peso(svc.main_stall_revenue ?? 0)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {Number(svc.sub_stall_revenue ?? 0) > 0
                          ? peso(svc.sub_stall_revenue ?? 0)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm font-semibold">
                        {peso(svc.total_revenue ?? 0)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {peso(svc.total_paid ?? 0)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            svc.payment_status === "paid"
                              ? "success"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {svc.payment_status?.toUpperCase() ?? "—"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No services found for this period.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
