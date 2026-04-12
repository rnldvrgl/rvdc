"use client"

import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  ExportWSData,
  useNotificationWebSocket,
} from "@/lib/hooks/useNotificationWebSocket"
import { useAirconModelMutations } from "@/lib/mutations/installations/useAirconModelMutations"
import { useHolidayMutations } from "@/lib/mutations/payroll/holidays/useHolidayMutations"
import { useClientMutations } from "@/lib/mutations/useClientMutations"
import { useEmployeeMutations } from "@/lib/mutations/useEmployeeMutations"
import { useItemMutations } from "@/lib/mutations/useItemMutations"
import { useStallStockMutations } from "@/lib/mutations/useStallStockMutations"
import { useStockRoomStockMutations } from "@/lib/mutations/useStockRoomStockMutations"
import usePendingActionsStore, {
  type PendingActionType,
} from "@/lib/store/usePendingActionsStore"
import api from "@/lib/utils/api"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Download,
  Loader2,
  Package,
  Snowflake,
  TrendingDown,
  Upload,
  UserCog,
  Users,
  Warehouse,
  X,
} from "lucide-react"
import { useCallback, useRef, useState } from "react"
import { toast } from "sonner"

// -- Shared Types --
type BulkUpdateResult = {
  updated: number
  skipped: number
  created?: number
  deleted?: number
  errors: { row: number; sku?: string; error: string }[]
}

type BulkPreviewChange = {
  row: number
  sku: string
  name: string
  action?: "update" | "delete" | "create"
  changes: { field: string; old: string; new: string }[]
}

type BulkPreviewData = {
  changes: BulkPreviewChange[]
  skipped: number
  errors: { row: number; sku?: string; error: string }[]
  summary: string
}

// -- Stock Usage Export Section --
function StockUsageExportSection() {
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [includeSales, setIncludeSales] = useState(true)
  const [includeServices, setIncludeServices] = useState(true)
  const [downloading, setDownloading] = useState(false)

  const handleExport = async () => {
    if (!includeSales && !includeServices) {
      toast.error("Select at least one source (Sales or Services).")
      return
    }
    setDownloading(true)
    try {
      const params = new URLSearchParams()
      if (dateFrom) params.set("date_from", dateFrom)
      if (dateTo) params.set("date_to", dateTo)
      params.set("include_sales", String(includeSales))
      params.set("include_services", String(includeServices))

      const res = await api.get(`/inventory/stocks/usage-export/?${params}`, {
        responseType: "blob",
      })
      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      const label = dateFrom || dateTo ? `_${dateFrom || "start"}_${dateTo || "end"}` : ""
      link.setAttribute("download", `stocks_used${label}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => window.URL.revokeObjectURL(url), 1000)
      toast.success("Stock usage export downloaded.")
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "No data found for the selected filters."
      toast.error(msg)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="shrink-0 rounded-lg sm:rounded-xl p-1.5 sm:p-2.5 bg-linear-to-br from-amber-500 to-orange-600">
            <Download className="size-3.5 sm:size-5 text-white" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-sm sm:text-base">Stock Usage Export</CardTitle>
            <CardDescription className="text-[10px] sm:text-xs mt-0.5">
              Export an XLSX showing items consumed via sales and/or service
              parts within a date range. Use this file as input for Bulk Deduct
              Stock below.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-3 sm:px-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Date From</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="text-xs h-8"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Date To</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="text-xs h-8"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="include-sales"
              checked={includeSales}
              onCheckedChange={(v) => setIncludeSales(!!v)}
            />
            <Label htmlFor="include-sales" className="text-xs cursor-pointer">
              Include Sales Transactions
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="include-services"
              checked={includeServices}
              onCheckedChange={(v) => setIncludeServices(!!v)}
            />
            <Label htmlFor="include-services" className="text-xs cursor-pointer">
              Include Service Parts
            </Label>
          </div>
        </div>
        <Button
          size="sm"
          onClick={handleExport}
          disabled={downloading}
          className="gap-1.5 text-xs"
        >
          {downloading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Download className="size-3.5" />
          )}
          {downloading ? "Exporting..." : "Download Stocks Used"}
        </Button>
      </CardContent>
    </Card>
  )
}

// -- Generic Bulk Update Section --
function BulkUpdateSection({
  title,
  description,
  templateEndpoint,
  templateFilename,
  result,
  processing,
  onUploadStarted,
  previewMutation,
  updateMutation,
  accentFrom,
  accentTo,
  icon: Icon,
}: {
  title: string
  description: string
  templateEndpoint: string
  templateFilename: string
  result: BulkUpdateResult | null
  processing: boolean
  onUploadStarted: () => void
  previewMutation: {
    mutateAsync: (data: FormData) => Promise<unknown>
    isPending: boolean
  }
  updateMutation: {
    mutateAsync: (data: FormData) => Promise<unknown>
    isPending: boolean
  }
  accentFrom: string
  accentTo: string
  icon?: React.ElementType
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [downloading, setDownloading] = useState(false)
  const [preview, setPreview] = useState<BulkPreviewData | null>(null)
  const [pendingFile, setPendingFile] = useState<FormData | null>(null)
  const [excludedRows, setExcludedRows] = useState<Set<number>>(new Set())

  const removeRow = (row: number) => {
    setExcludedRows((prev) => new Set([...prev, row]))
  }

  const activeChanges = preview?.changes.filter((c) => !excludedRows.has(c.row)) ?? []

  const downloadTemplate = async () => {
    setDownloading(true)
    try {
      const res = await api.get(templateEndpoint, {
        responseType: "blob",
      })
      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = blobUrl
      link.setAttribute("download", templateFilename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000)
      toast.success("Template downloaded.")
    } catch {
      toast.error("Failed to download template.")
    } finally {
      setDownloading(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.endsWith(".xlsx")) {
      toast.error("Only .xlsx files are supported.")
      return
    }

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await previewMutation.mutateAsync(formData)
      const data = (res as { data: BulkPreviewData }).data
      if (data.changes.length === 0 && data.errors.length === 0) {
        toast.info(
          data.skipped > 0
            ? `All ${data.skipped} records are unchanged. No updates needed.`
            : "No changes detected in the uploaded file.",
        )
        return
      }
      toast.success("Preview ready. Please review the changes below.")
      setPreview(data)
      setExcludedRows(new Set())
      const updateForm = new FormData()
      updateForm.append("file", file)
      setPendingFile(updateForm)
    } catch {
      // Error handled by mutation toast
    } finally {
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  const handleConfirm = () => {
    if (!pendingFile) return
    if (excludedRows.size > 0) {
      pendingFile.set("excluded_rows", JSON.stringify([...excludedRows]))
    }
    updateMutation.mutateAsync(pendingFile).then(() => {
      onUploadStarted()
    })
    setPreview(null)
    setPendingFile(null)
    setExcludedRows(new Set())
  }

  const handleCancel = () => {
    setPreview(null)
    setPendingFile(null)
    setExcludedRows(new Set())
  }

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <div
                className={`shrink-0 rounded-lg sm:rounded-xl p-1.5 sm:p-2.5 bg-linear-to-br ${accentFrom} ${accentTo}`}
              >
                {Icon ? (
                  <Icon className="size-3.5 sm:size-5 text-white" />
                ) : (
                  <Upload className="size-3.5 sm:size-5 text-white" />
                )}
              </div>
              <div className="min-w-0">
                <CardTitle className="text-sm sm:text-base">{title}</CardTitle>
                <CardDescription className="text-[10px] sm:text-xs mt-0.5">
                  {description}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              disabled={downloading}
              className="gap-1.5 text-xs"
            >
              {downloading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Download className="size-3.5" />
              )}
              Download Template
            </Button>
            <div className="relative">
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx"
                onChange={handleUpload}
                className="sr-only"
                aria-label={`Upload XLSX file for ${title.toLowerCase()}`}
              />
              <Button
                size="sm"
                onClick={() => fileRef.current?.click()}
                disabled={
                  previewMutation.isPending ||
                  updateMutation.isPending ||
                  processing
                }
                className="gap-1.5 text-xs w-full sm:w-auto"
              >
                {previewMutation.isPending ||
                updateMutation.isPending ||
                processing ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Upload className="size-3.5" />
                )}
                {previewMutation.isPending
                  ? "Analyzing..."
                  : updateMutation.isPending
                    ? "Uploading..."
                    : processing
                      ? "Processing..."
                      : "Upload Updated File"}
              </Button>
            </div>
          </div>

          {result && (
            <>
              <Separator />
              <div className="space-y-2 text-xs">
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="default"
                    className="text-[10px] sm:text-xs"
                  >
                    {result.updated} updated
                  </Badge>
                  {(result.created ?? 0) > 0 && (
                    <Badge
                      variant="default"
                      className="text-[10px] sm:text-xs bg-emerald-600 hover:bg-emerald-600"
                    >
                      {result.created} created
                    </Badge>
                  )}
                  {(result.deleted ?? 0) > 0 && (
                    <Badge
                      variant="destructive"
                      className="text-[10px] sm:text-xs"
                    >
                      {result.deleted} deleted
                    </Badge>
                  )}
                  <Badge
                    variant="secondary"
                    className="text-[10px] sm:text-xs"
                  >
                    {result.skipped} unchanged
                  </Badge>
                  {result.errors.length > 0 && (
                    <Badge
                      variant="destructive"
                      className="text-[10px] sm:text-xs"
                    >
                      {result.errors.length} errors
                    </Badge>
                  )}
                </div>
                {result.errors.length > 0 && (
                  <div className="max-h-32 overflow-y-auto rounded border p-2 space-y-1 bg-muted/50">
                    {result.errors.map((err, i) => (
                      <p
                        key={i}
                        className="text-destructive text-[10px]"
                      >
                        Row {err.row}
                        {err.sku ? ` (${err.sku})` : ""}: {err.error}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Preview Confirmation Dialog */}
      <AlertDialog
        open={!!preview}
        onOpenChange={(o) => !o && handleCancel()}
      >
        <AlertDialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-sm sm:text-base">
              <AlertTriangle className="size-4 text-amber-500" />
              Review Changes Before Applying
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              {preview?.summary}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-3 py-2">
              {activeChanges.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Records to apply ({activeChanges.length}
                    {excludedRows.size > 0 && (
                      <span className="text-muted-foreground/70">
                        {" "}· {excludedRows.size} removed
                      </span>
                    )}
                    )
                  </p>
                  {activeChanges.map((item, i) => {
                    const isDelete = item.action === "delete"
                    const isCreate = item.action === "create"
                    return (
                      <div
                        key={i}
                        className={`rounded-lg border p-2.5 sm:p-3 space-y-1.5 ${
                          isDelete
                            ? "border-destructive/40 bg-destructive/5"
                            : isCreate
                              ? "border-emerald-500/40 bg-emerald-500/5"
                              : ""
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {item.sku ? (
                              <Badge
                                variant={isDelete ? "destructive" : "outline"}
                                className="text-[10px] font-mono shrink-0"
                              >
                                {item.sku}
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-[10px] font-mono shrink-0 border-emerald-500 text-emerald-600"
                              >
                                NEW
                              </Badge>
                            )}
                            <span
                              className={`text-xs font-medium truncate ${isDelete ? "line-through text-muted-foreground" : ""}`}
                            >
                              {item.name}
                            </span>
                            {isDelete && (
                              <Badge
                                variant="destructive"
                                className="text-[10px] shrink-0"
                              >
                                DELETE
                              </Badge>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeRow(item.row)}
                            className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Remove this row from update"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                        {!isDelete && item.changes.length > 0 && (
                          <div className="space-y-1">
                            {item.changes.map((change, j) => (
                              <div
                                key={j}
                                className="flex items-center gap-1.5 text-[10px] sm:text-xs"
                              >
                                <span className="text-muted-foreground min-w-[90px] sm:min-w-[110px]">
                                  {change.field}:
                                </span>
                                {change.old ? (
                                  <>
                                    <span className="text-destructive line-through">
                                      {change.old}
                                    </span>
                                    <ArrowRight className="size-3 text-muted-foreground shrink-0" />
                                  </>
                                ) : null}
                                <span className="text-success font-medium">
                                  {change.new}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {preview?.errors && preview.errors.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-destructive">
                    Errors ({preview.errors.length})
                  </p>
                  <div className="rounded border p-2 space-y-1 bg-destructive/5">
                    {preview.errors.map((err, i) => (
                      <p
                        key={i}
                        className="text-destructive text-[10px]"
                      >
                        Row {err.row}
                        {err.sku ? ` (${err.sku})` : ""}: {err.error}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {preview && (preview.skipped > 0 || excludedRows.size > 0) && (
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  {preview.skipped + excludedRows.size} records will be skipped (
                  {preview.skipped} unchanged
                  {excludedRows.size > 0 && `, ${excludedRows.size} removed`})
                </p>
              )}
            </div>
          </ScrollArea>

          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel
              className="text-xs"
              disabled={updateMutation.isPending}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={
                updateMutation.isPending ||
                activeChanges.length === 0
              }
              className="text-xs gap-1.5"
            >
              {updateMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="size-3.5" />
              )}
              {updateMutation.isPending
                ? "Applying..."
                : `Apply ${activeChanges.length} Operations`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// -- Category config --
type CategoryConfig = {
  key: string
  exportType: string
  pendingType: PendingActionType
  pendingLabel: string
  title: string
  description: string
  templateEndpoint: string
  templateFilename: string
  accentFrom: string
  accentTo: string
}

const CATEGORIES: CategoryConfig[] = [
  {
    key: "items",
    exportType: "bulk_update",
    pendingType: "bulk_update",
    pendingLabel: "Bulk Item Update",
    title: "Items",
    description:
      "Update item names and pricing columns (cost, retail, wholesale, technician).",
    templateEndpoint: "/inventory/items/bulk-template/",
    templateFilename: "item_pricing_template.xlsx",
    accentFrom: "from-cyan-500",
    accentTo: "to-blue-600",
  },
  {
    key: "clients",
    exportType: "client_bulk_update",
    pendingType: "client_bulk_update",
    pendingLabel: "Bulk Client Update",
    title: "Clients",
    description:
      "Update client contact info, province, city, barangay, and address.",
    templateEndpoint: "/clients/bulk-template/",
    templateFilename: "client_update_template.xlsx",
    accentFrom: "from-emerald-500",
    accentTo: "to-teal-600",
  },
  {
    key: "holidays",
    exportType: "holiday_bulk_update",
    pendingType: "holiday_bulk_update",
    pendingLabel: "Bulk Holiday Update",
    title: "Holidays",
    description:
      "Update holiday dates, names, and types (regular / special non-working).",
    templateEndpoint: "/payroll/holidays/bulk-template/",
    templateFilename: "holiday_template.xlsx",
    accentFrom: "from-amber-500",
    accentTo: "to-orange-600",
  },
  {
    key: "aircon_models",
    exportType: "aircon_model_bulk_update",
    pendingType: "aircon_model_bulk_update",
    pendingLabel: "Bulk Aircon Model Update",
    title: "Aircon Models",
    description: "Update aircon model pricing, warranty months, and details.",
    templateEndpoint: "/installations/aircon-models/bulk-template/",
    templateFilename: "aircon_model_template.xlsx",
    accentFrom: "from-sky-500",
    accentTo: "to-indigo-600",
  },
  {
    key: "employees",
    exportType: "employee_bulk_update",
    pendingType: "employee_bulk_update",
    pendingLabel: "Bulk Employee Update",
    title: "Employees",
    description:
      "Update employee names, roles, contact info, salary, and government IDs.",
    templateEndpoint: "/users/employees/bulk-template/",
    templateFilename: "employee_template.xlsx",
    accentFrom: "from-violet-500",
    accentTo: "to-purple-600",
  },
  {
    key: "stall_stocks",
    exportType: "stall_stock_bulk_update",
    pendingType: "stall_stock_bulk_update",
    pendingLabel: "Bulk Stall Stock Update",
    title: "Stall Stock",
    description:
      "Update stall stock quantities, low stock thresholds, and tracking status.",
    templateEndpoint: "/inventory/stocks/bulk-template/",
    templateFilename: "stall_stock_template.xlsx",
    accentFrom: "from-rose-500",
    accentTo: "to-pink-600",
  },
  {
    key: "stockroom_stocks",
    exportType: "stockroom_bulk_update",
    pendingType: "stockroom_bulk_update",
    pendingLabel: "Bulk Stockroom Update",
    title: "Stockroom Stock",
    description:
      "Update stockroom quantities and low stock thresholds in bulk.",
    templateEndpoint: "/inventory/stockroom/stocks/bulk-template/",
    templateFilename: "stockroom_stock_template.xlsx",
    accentFrom: "from-teal-500",
    accentTo: "to-cyan-600",
  },
  {
    key: "stall_stocks_deduct",
    exportType: "stall_stock_deduct",
    pendingType: "stall_stock_deduct" as PendingActionType,
    pendingLabel: "Bulk Stock Deduction",
    title: "Deduct Stock from Usage",
    description:
      "Upload the stocks-used XLSX (downloaded above) to deduct consumed quantities from stall stock. Download, review, then upload.",
    templateEndpoint: "/inventory/stocks/usage-export/",
    templateFilename: "stocks_used.xlsx",
    accentFrom: "from-red-500",
    accentTo: "to-rose-600",
  },
]

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  items: Package,
  clients: Users,
  holidays: CalendarDays,
  aircon_models: Snowflake,
  employees: UserCog,
  stall_stocks: Package,
  stockroom_stocks: Warehouse,
  stall_stocks_deduct: TrendingDown,
}

// -- Main Page --
export default function BulkUpdatePage() {
  const addPendingAction = usePendingActionsStore((s) => s.addAction)
  const removePendingAction = usePendingActionsStore((s) => s.removeAction)

  // Mutations
  const { bulkPreview: itemBulkPreview, bulkUpdate: itemBulkUpdate } =
    useItemMutations()
  const { bulkPreview: clientBulkPreview, bulkUpdate: clientBulkUpdate } =
    useClientMutations()
  const { bulkPreview: holidayBulkPreview, bulkUpdate: holidayBulkUpdate } =
    useHolidayMutations()
  const {
    bulkPreview: airconModelBulkPreview,
    bulkUpdate: airconModelBulkUpdate,
  } = useAirconModelMutations()
  const { bulkPreview: employeeBulkPreview, bulkUpdate: employeeBulkUpdate } =
    useEmployeeMutations()
  const {
    bulkPreview: stallStockBulkPreview,
    bulkUpdate: stallStockBulkUpdate,
    bulkDeductPreview: stallStockDeductPreview,
    bulkDeduct: stallStockDeduct,
  } = useStallStockMutations()
  const { bulkPreview: stockroomBulkPreview, bulkUpdate: stockroomBulkUpdate } =
    useStockRoomStockMutations()

  const mutations: Record<
    string,
    {
      preview: {
        mutateAsync: (d: FormData) => Promise<unknown>
        isPending: boolean
      }
      update: {
        mutateAsync: (d: FormData) => Promise<unknown>
        isPending: boolean
      }
    }
  > = {
    items: { preview: itemBulkPreview, update: itemBulkUpdate },
    clients: { preview: clientBulkPreview, update: clientBulkUpdate },
    holidays: { preview: holidayBulkPreview, update: holidayBulkUpdate },
    aircon_models: {
      preview: airconModelBulkPreview,
      update: airconModelBulkUpdate,
    },
    employees: { preview: employeeBulkPreview, update: employeeBulkUpdate },
    stall_stocks: { preview: stallStockBulkPreview, update: stallStockBulkUpdate },
    stockroom_stocks: { preview: stockroomBulkPreview, update: stockroomBulkUpdate },
    stall_stocks_deduct: { preview: stallStockDeductPreview, update: stallStockDeduct },
  }

  // Per-category state
  const [results, setResults] = useState<
    Record<string, BulkUpdateResult | null>
  >({})
  const [processing, setProcessing] = useState<Record<string, boolean>>({})
  const actionIdRefs = useRef<Record<string, string | null>>({})

  // WebSocket handler
  const onExportReady = useCallback(
    (data: ExportWSData) => {
      const category = CATEGORIES.find((c) => c.exportType === data.export_type)
      if (!category) return

      setProcessing((prev) => ({ ...prev, [category.key]: false }))
      const actionId = actionIdRefs.current[category.key]
      if (actionId) {
        removePendingAction(actionId)
        actionIdRefs.current[category.key] = null
      }

      if (data.event === "export_ready" && data.result) {
        const result = data.result as BulkUpdateResult
        setResults((prev) => ({ ...prev, [category.key]: result }))
        if (result.updated > 0) {
          toast.success(data.title, { description: data.message })
        } else if (result.errors.length > 0) {
          toast.warning(data.title, { description: data.message })
        } else {
          toast.info("No changes detected.")
        }
      } else if (data.event === "export_failed") {
        toast.error(data.title, { description: data.message })
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  useNotificationWebSocket({ onExportReady })

  return (
    <Wrapper>
      <PageHeader
        icon={Upload}
        title="Bulk Update"
        description="Download templates, edit records, and re-upload to update in bulk."
        isAdminOnly
      />

      <div className="space-y-4">
        <StockUsageExportSection />
        {CATEGORIES.map((cat) => (
          <BulkUpdateSection
            key={cat.key}
            title={cat.title}
            description={cat.description}
            templateEndpoint={cat.templateEndpoint}
            templateFilename={cat.templateFilename}
            result={results[cat.key] ?? null}
            processing={processing[cat.key] ?? false}
            onUploadStarted={() => {
              setProcessing((prev) => ({ ...prev, [cat.key]: true }))
              setResults((prev) => ({ ...prev, [cat.key]: null }))
              actionIdRefs.current[cat.key] = addPendingAction(
                cat.pendingType,
                cat.pendingLabel,
              )
            }}
            previewMutation={mutations[cat.key].preview}
            updateMutation={mutations[cat.key].update}
            accentFrom={cat.accentFrom}
            accentTo={cat.accentTo}
            icon={CATEGORY_ICONS[cat.key]}
          />
        ))}
      </div>
    </Wrapper>
  )
}
