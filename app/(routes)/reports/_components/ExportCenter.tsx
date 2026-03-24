"use client"

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
import { Calendar } from "@/components/ui/calendar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  ExportWSData,
  useNotificationWebSocket,
} from "@/lib/hooks/useNotificationWebSocket"
import { useExportMutations } from "@/lib/mutations/useExportMutations"
import { useItemMutations } from "@/lib/mutations/useItemMutations"
import usePendingActionsStore from "@/lib/store/usePendingActionsStore"
import api from "@/lib/utils/api"
import { cn } from "@/lib/utils/helpers"
import { format } from "date-fns"
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  BarChart3,
  CalendarDays,
  CalendarIcon,
  CheckCircle2,
  Copy,
  CreditCard,
  Download,
  FileSpreadsheet,
  Landmark,
  Layers,
  Loader2,
  PackageX,
  ShoppingCart,
  Store,
  TrendingDown,
  TrendingUp,
  Upload,
  Wrench,
} from "lucide-react"
import { useCallback, useRef, useState } from "react"
import { toast } from "sonner"

// -- Inventory Sheets --
const INVENTORY_SHEETS = [
  {
    key: "no_stock",
    label: "No Stock Items",
    description: "Items with zero available quantity",
    icon: PackageX,
    color: "text-red-500",
    bgColor: "bg-red-50 dark:bg-red-950/20",
  },
  {
    key: "low_stock",
    label: "Low Stock Items",
    description: "Items below their reorder threshold",
    icon: AlertTriangle,
    color: "text-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-950/20",
  },
  {
    key: "most_bought",
    label: "Most Bought Items",
    description: "Top 50 items by quantity consumed",
    icon: ShoppingCart,
    color: "text-emerald-500",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
  },
  {
    key: "least_bought",
    label: "Least Bought Items",
    description: "Bottom 50 items by usage",
    icon: TrendingDown,
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
  },
  {
    key: "custom_items",
    label: "Custom Items Usage",
    description: "Non-inventory items used in services",
    icon: Wrench,
    color: "text-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
  },
  {
    key: "duplicates",
    label: "Potential Duplicates",
    description: "Items with similar names",
    icon: Copy,
    color: "text-orange-500",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
  },
  {
    key: "by_category",
    label: "Items by Category",
    description: "All items grouped by category",
    icon: Layers,
    color: "text-indigo-500",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/20",
  },
] as const

// -- Sales Sheets --
const SALES_SHEETS = [
  {
    key: "all_transactions",
    label: "All Transactions",
    description: "Complete list of sales with details",
    icon: ShoppingCart,
    color: "text-emerald-500",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
  },
  {
    key: "daily_summary",
    label: "Daily Summary",
    description: "Sales aggregated per day",
    icon: CalendarDays,
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
  },
  {
    key: "monthly_summary",
    label: "Monthly Summary",
    description: "Sales aggregated per month",
    icon: BarChart3,
    color: "text-violet-500",
    bgColor: "bg-violet-50 dark:bg-violet-950/20",
  },
  {
    key: "quarterly_summary",
    label: "Quarterly Summary",
    description: "Sales aggregated per quarter",
    icon: TrendingUp,
    color: "text-cyan-500",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/20",
  },
  {
    key: "payment_breakdown",
    label: "Payment Breakdown",
    description: "Totals by payment method",
    icon: CreditCard,
    color: "text-pink-500",
    bgColor: "bg-pink-50 dark:bg-pink-950/20",
  },
  {
    key: "top_items",
    label: "Top Items Sold",
    description: "Most sold products by quantity",
    icon: TrendingUp,
    color: "text-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-950/20",
  },
] as const

// -- Daily Sales Sheets --
const DAILY_SALES_SHEETS = [
  {
    key: "main_stall",
    label: "Daily Sales - Main Stall",
    description: "1 tab per day (Qty, Item, Amount) for main stall",
    icon: Store,
    color: "text-emerald-500",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
  },
  {
    key: "sub_stall",
    label: "Daily Sales - Sub Stall",
    description: "1 tab per day (Qty, Item, Amount) for sub stall",
    icon: Store,
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
  },
] as const

// -- Cheque Sheets --
const CHEQUE_SHEETS = [
  {
    key: "all_cheques",
    label: "All Cheques",
    description: "Complete cheque collection records",
    icon: Banknote,
    color: "text-emerald-500",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
  },
  {
    key: "by_status",
    label: "By Status",
    description: "Pending, deposited, bounced, etc.",
    icon: CheckCircle2,
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
  },
  {
    key: "by_bank",
    label: "By Bank",
    description: "Grouped by issuing bank",
    icon: Landmark,
    color: "text-violet-500",
    bgColor: "bg-violet-50 dark:bg-violet-950/20",
  },
  {
    key: "monthly_summary",
    label: "Monthly Summary",
    description: "Cheques aggregated per month",
    icon: CalendarDays,
    color: "text-cyan-500",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/20",
  },
] as const

// -- Types --
type InventorySheetKey = (typeof INVENTORY_SHEETS)[number]["key"]
type SalesSheetKey = (typeof SALES_SHEETS)[number]["key"]
type DailySalesSheetKey = (typeof DAILY_SALES_SHEETS)[number]["key"]
type ChequeSheetKey = (typeof CHEQUE_SHEETS)[number]["key"]

// -- Date Picker Field --
function DateField({
  label,
  value,
  onChange,
}: {
  label: string
  value: Date
  onChange: (d: Date) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="space-y-1.5 flex-1 min-w-0">
      <Label className="text-[10px] sm:text-xs text-muted-foreground">
        {label}
      </Label>
      <Popover
        open={open}
        onOpenChange={setOpen}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full h-8 justify-start text-left text-[11px] sm:text-xs font-normal",
              !value && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-1.5 size-3 sm:size-3.5 shrink-0 opacity-50" />
            <span className="truncate">
              {value ? format(value, "MMM dd, yyyy") : "Pick a date"}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0"
          align="start"
          sideOffset={4}
        >
          <Calendar
            mode="single"
            selected={value}
            onSelect={(d) => {
              if (d) {
                d.setHours(12, 0, 0, 0)
                onChange(d)
              }
              setOpen(false)
            }}
            weekStartsOn={1}
            className="rounded-lg border"
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

// -- Export Section --
interface ExportSectionProps<K extends string> {
  title: string
  description: string
  icon: typeof FileSpreadsheet
  accentColor: string
  sheets: readonly {
    key: K
    label: string
    description: string
    icon: typeof FileSpreadsheet
    color: string
    bgColor: string
  }[]
  selectedSheets: Set<K>
  onToggle: (key: K) => void
  onSelectAll: () => void
  onDeselectAll: () => void
  isExporting: boolean
  onExport: () => void
  dateRange?: boolean
  startDate?: Date
  endDate?: Date
  onStartDate?: (d: Date) => void
  onEndDate?: (d: Date) => void
}

function ExportSection<K extends string>({
  title,
  description,
  icon: SectionIcon,
  accentColor,
  sheets,
  selectedSheets,
  onToggle,
  onSelectAll,
  onDeselectAll,
  isExporting,
  onExport,
  dateRange,
  startDate,
  endDate,
  onStartDate,
  onEndDate,
}: ExportSectionProps<K>) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className={`shrink-0 rounded-lg sm:rounded-xl p-1.5 sm:p-2.5 ${accentColor}`}
            >
              <SectionIcon className="size-3.5 sm:size-5 text-white" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm sm:text-base truncate">
                {title}
              </CardTitle>
              <CardDescription className="text-[10px] sm:text-xs mt-0.5">
                {description}
              </CardDescription>
            </div>
          </div>
          <Badge
            variant="secondary"
            className="text-[10px] sm:text-xs font-normal self-start shrink-0"
          >
            {selectedSheets.size}/{sheets.length} sheets
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6">
        {dateRange && startDate && endDate && onStartDate && onEndDate && (
          <div className="flex flex-col xs:flex-row items-stretch xs:items-end gap-2 sm:gap-3 pb-1 sm:pb-2">
            <DateField
              label="From"
              value={startDate}
              onChange={onStartDate}
            />
            <DateField
              label="To"
              value={endDate}
              onChange={onEndDate}
            />
          </div>
        )}

        <div className="grid gap-1.5 sm:gap-2.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {sheets.map((sheet) => {
            const Icon = sheet.icon
            const isSelected = selectedSheets.has(sheet.key)
            return (
              <button
                key={sheet.key}
                type="button"
                onClick={() => onToggle(sheet.key)}
                className={cn(
                  "group relative flex items-start gap-2 sm:gap-3 rounded-lg border p-2 sm:p-3 text-left transition-all hover:shadow-sm",
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border hover:border-muted-foreground/30 opacity-60",
                )}
              >
                <div
                  className={cn(
                    "mt-0.5 shrink-0 rounded-md p-1 sm:p-1.5 transition-colors",
                    isSelected ? sheet.bgColor : "bg-muted",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-3 sm:size-3.5",
                      isSelected ? sheet.color : "text-muted-foreground",
                    )}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] sm:text-xs font-medium leading-tight">
                    {sheet.label}
                  </p>
                  <p className="mt-0.5 text-[9px] sm:text-[10px] leading-snug text-muted-foreground line-clamp-2">
                    {sheet.description}
                  </p>
                </div>
                <Checkbox
                  checked={isSelected}
                  className="mt-0.5 shrink-0 size-3.5 sm:size-4"
                  onCheckedChange={() => onToggle(sheet.key)}
                />
              </button>
            )
          })}
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 sm:h-7 text-[10px] sm:text-xs px-1.5 sm:px-3"
              onClick={onSelectAll}
              disabled={selectedSheets.size === sheets.length}
            >
              Select All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 sm:h-7 text-[10px] sm:text-xs px-1.5 sm:px-3"
              onClick={onDeselectAll}
              disabled={selectedSheets.size === 0}
            >
              Clear
            </Button>
          </div>
          <Button
            size="sm"
            onClick={onExport}
            disabled={isExporting || selectedSheets.size === 0}
            className="gap-1 sm:gap-1.5 text-[10px] sm:text-xs h-7 sm:h-8"
          >
            {isExporting ? (
              <Loader2 className="size-3 sm:size-3.5 animate-spin" />
            ) : (
              <Download className="size-3 sm:size-3.5" />
            )}
            {isExporting ? "Generating..." : "Export .xlsx"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// -- Bulk Item Update --
type BulkUpdateResult = {
  updated: number
  skipped: number
  errors: { row: number; sku?: string; error: string }[]
}

type BulkPreviewChange = {
  row: number
  sku: string
  name: string
  changes: { field: string; old: string; new: string }[]
}

type BulkPreviewData = {
  changes: BulkPreviewChange[]
  skipped: number
  errors: { row: number; sku?: string; error: string }[]
  summary: string
}

function BulkItemUpdate({
  result,
  processing,
  onUploadStarted,
}: {
  result: BulkUpdateResult | null
  processing: boolean
  onUploadStarted: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [downloading, setDownloading] = useState(false)
  const [preview, setPreview] = useState<BulkPreviewData | null>(null)
  const [pendingFile, setPendingFile] = useState<FormData | null>(null)
  const { bulkPreview, bulkUpdate } = useItemMutations()

  const downloadTemplate = async () => {
    setDownloading(true)
    try {
      const res = await api.get("/inventory/items/bulk-template/", {
        responseType: "blob",
      })
      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = blobUrl
      link.setAttribute("download", "item_pricing_template.xlsx")
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
      const res = await bulkPreview.mutateAsync(formData)
      const data = (res as { data: BulkPreviewData }).data
      if (data.changes.length === 0 && data.errors.length === 0) {
        toast.info(
          data.skipped > 0
            ? `All ${data.skipped} items are unchanged. No updates needed.`
            : "No changes detected in the uploaded file.",
        )
        return
      }
      toast.success("Preview ready. Please review the changes below.")
      setPreview(data)
      // Re-create FormData with same file for the actual update
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
    bulkUpdate.mutateAsync(pendingFile).then(() => {
      onUploadStarted()
    })
    setPreview(null)
    setPendingFile(null)
  }

  const handleCancel = () => {
    setPreview(null)
    setPendingFile(null)
  }

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="shrink-0 rounded-lg sm:rounded-xl p-1.5 sm:p-2.5 bg-linear-to-br from-cyan-500 to-blue-600">
                <Upload className="size-3.5 sm:size-5 text-white" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-sm sm:text-base">
                  Bulk Item Pricing Update
                </CardTitle>
                <CardDescription className="text-[10px] sm:text-xs mt-0.5">
                  Download an XLSX template, edit prices, and re-upload to
                  update items in bulk.
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
                id="bulk-upload-input"
                aria-label="Upload XLSX file for bulk item update"
              />
              <Button
                size="sm"
                onClick={() => fileRef.current?.click()}
                disabled={
                  bulkPreview.isPending || bulkUpdate.isPending || processing
                }
                className="gap-1.5 text-xs w-full sm:w-auto"
              >
                {bulkPreview.isPending || bulkUpdate.isPending || processing ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Upload className="size-3.5" />
                )}
                {bulkPreview.isPending
                  ? "Analyzing..."
                  : bulkUpdate.isPending
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
              {/* Changes */}
              {preview?.changes && preview.changes.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Items to update ({preview.changes.length})
                  </p>
                  {preview.changes.map((item, i) => (
                    <div
                      key={i}
                      className="rounded-lg border p-2.5 sm:p-3 space-y-1.5"
                    >
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono"
                        >
                          {item.sku}
                        </Badge>
                        <span className="text-xs font-medium truncate">
                          {item.name}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {item.changes.map((change, j) => (
                          <div
                            key={j}
                            className="flex items-center gap-1.5 text-[10px] sm:text-xs"
                          >
                            <span className="text-muted-foreground min-w-[90px] sm:min-w-[110px]">
                              {change.field}:
                            </span>
                            <span className="text-red-500 line-through">
                              {change.old}
                            </span>
                            <ArrowRight className="size-3 text-muted-foreground shrink-0" />
                            <span className="text-green-600 font-medium">
                              {change.new}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Errors */}
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

              {/* Skipped */}
              {preview && preview.skipped > 0 && (
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  {preview.skipped} items unchanged (will be skipped)
                </p>
              )}
            </div>
          </ScrollArea>

          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel
              className="text-xs"
              disabled={bulkUpdate.isPending}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={
                bulkUpdate.isPending ||
                !preview?.changes ||
                preview.changes.length === 0
              }
              className="text-xs gap-1.5"
            >
              {bulkUpdate.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="size-3.5" />
              )}
              {bulkUpdate.isPending
                ? "Applying..."
                : `Apply ${preview?.changes?.length ?? 0} Changes`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// -- Utility --
function downloadFromToken(token: string, filename: string) {
  api
    .get(`/analytics/export/download/${token}/`, { responseType: "blob" })
    .then((res) => {
      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = blobUrl
      link.setAttribute("download", filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000)
    })
    .catch(() => {
      toast.error("Failed to download export file.")
    })
}

function toISODate(d: Date) {
  return d.toISOString().split("T")[0]
}

// -- Export Center --
export function ExportCenter() {
  const today = new Date()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(today.getDate() - 30)
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(today.getDate() - 90)

  // Inventory
  const [invSheets, setInvSheets] = useState<Set<InventorySheetKey>>(
    new Set(INVENTORY_SHEETS.map((s) => s.key)),
  )
  const [invExporting, setInvExporting] = useState(false)

  // Sales
  const [salesSheets, setSalesSheets] = useState<Set<SalesSheetKey>>(
    new Set(SALES_SHEETS.map((s) => s.key)),
  )
  const [salesExporting, setSalesExporting] = useState(false)
  const [salesStart, setSalesStart] = useState<Date>(thirtyDaysAgo)
  const [salesEnd, setSalesEnd] = useState<Date>(today)

  // Daily Sales
  const [dailySalesSheets, setDailySalesSheets] = useState<
    Set<DailySalesSheetKey>
  >(new Set(DAILY_SALES_SHEETS.map((s) => s.key)))
  const [dailySalesExporting, setDailySalesExporting] = useState(false)
  const [dailySalesStart, setDailySalesStart] = useState<Date>(thirtyDaysAgo)
  const [dailySalesEnd, setDailySalesEnd] = useState<Date>(today)

  // Cheques
  const [chequeSheets, setChequeSheets] = useState<Set<ChequeSheetKey>>(
    new Set(CHEQUE_SHEETS.map((s) => s.key)),
  )
  const [chequeExporting, setChequeExporting] = useState(false)
  const [chequeStart, setChequeStart] = useState<Date>(ninetyDaysAgo)
  const [chequeEnd, setChequeEnd] = useState<Date>(today)

  // -- Toggles --
  function toggle<K extends string>(
    set: Set<K>,
    setter: React.Dispatch<React.SetStateAction<Set<K>>>,
    key: K,
  ) {
    setter((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // -- WebSocket for export notifications --
  const pendingExportRef = useRef<string | null>(null)
  const pendingActionIdRef = useRef<string | null>(null)

  // Pending actions store
  const addPendingAction = usePendingActionsStore((s) => s.addAction)
  const removePendingAction = usePendingActionsStore((s) => s.removeAction)

  // Bulk update
  const [bulkUpdateResult, setBulkUpdateResult] =
    useState<BulkUpdateResult | null>(null)
  const [bulkProcessing, setBulkProcessing] = useState(false)
  const bulkActionIdRef = useRef<string | null>(null)

  const onExportReady = useCallback((data: ExportWSData) => {
    if (data.export_type === "bulk_update") {
      setBulkProcessing(false)
      if (bulkActionIdRef.current) {
        removePendingAction(bulkActionIdRef.current)
        bulkActionIdRef.current = null
      }
      if (data.event === "export_ready" && data.result) {
        setBulkUpdateResult(data.result)
        if (data.result.updated > 0) {
          toast.success(data.title, { description: data.message })
        } else if (data.result.errors.length > 0) {
          toast.warning(data.title, { description: data.message })
        } else {
          toast.info("No changes detected.")
        }
      } else if (data.event === "export_failed") {
        toast.error(data.title, { description: data.message })
      }
      return
    }

    if (data.event === "export_ready" && data.token && data.filename) {
      toast.success(data.title, { description: data.message })
      downloadFromToken(data.token, data.filename)
    } else if (data.event === "export_failed") {
      toast.error(data.title, { description: data.message })
    }

    if (data.export_type === "inventory") setInvExporting(false)
    else if (data.export_type === "sales") setSalesExporting(false)
    else if (data.export_type === "cheques") setChequeExporting(false)
    else if (data.export_type === "daily_sales") setDailySalesExporting(false)

    if (pendingActionIdRef.current) {
      removePendingAction(pendingActionIdRef.current)
      pendingActionIdRef.current = null
    }
    pendingExportRef.current = null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useNotificationWebSocket({ onExportReady })

  const { startExport: exportMutation } = useExportMutations()

  const EXPORT_LABELS: Record<string, string> = {
    inventory: "Inventory Report",
    sales: "Sales Report",
    cheques: "Cheques Report",
    daily_sales: "Daily Sales Report",
  }

  const startExport = (
    exportType: string,
    sheets: string,
    setExporting: (v: boolean) => void,
    startDate?: Date,
    endDate?: Date,
  ) => {
    setExporting(true)
    pendingExportRef.current = exportType
    const actionId = addPendingAction(
      "export",
      EXPORT_LABELS[exportType] || exportType,
    )
    pendingActionIdRef.current = actionId
    exportMutation
      .mutateAsync({
        export_type: exportType,
        sheets,
        ...(startDate && { start_date: toISODate(startDate) }),
        ...(endDate && { end_date: toISODate(endDate) }),
      })
      .catch(() => {
        setExporting(false)
        pendingExportRef.current = null
        removePendingAction(actionId)
        pendingActionIdRef.current = null
      })
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="shrink-0 rounded-lg sm:rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 p-1.5 sm:p-2.5">
          <FileSpreadsheet className="size-4 sm:size-5 text-white" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm sm:text-lg font-semibold">Export Center</h2>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            Generate multi-sheet Excel reports for inventory, sales, and
            cheques.
          </p>
        </div>
      </div>

      {/* Inventory Export */}
      <ExportSection
        title="Inventory Report"
        description="Stock levels, purchasing insights, and inventory cleanup"
        icon={PackageX}
        accentColor="bg-linear-to-br from-red-500 to-orange-500"
        sheets={INVENTORY_SHEETS}
        selectedSheets={invSheets}
        onToggle={(k) => toggle(invSheets, setInvSheets, k)}
        onSelectAll={() =>
          setInvSheets(new Set(INVENTORY_SHEETS.map((s) => s.key)))
        }
        onDeselectAll={() => setInvSheets(new Set())}
        isExporting={invExporting}
        onExport={() => {
          if (invSheets.size === 0) return
          startExport(
            "inventory",
            Array.from(invSheets).join(","),
            setInvExporting,
          )
        }}
      />

      {/* Sales Export */}
      <ExportSection
        title="Sales Report"
        description="Daily, monthly, quarterly breakdowns with payment analysis"
        icon={ShoppingCart}
        accentColor="bg-linear-to-br from-emerald-500 to-teal-600"
        sheets={SALES_SHEETS}
        selectedSheets={salesSheets}
        onToggle={(k) => toggle(salesSheets, setSalesSheets, k)}
        onSelectAll={() =>
          setSalesSheets(new Set(SALES_SHEETS.map((s) => s.key)))
        }
        onDeselectAll={() => setSalesSheets(new Set())}
        isExporting={salesExporting}
        onExport={() => {
          if (salesSheets.size === 0) return
          startExport(
            "sales",
            Array.from(salesSheets).join(","),
            setSalesExporting,
            salesStart,
            salesEnd,
          )
        }}
        dateRange
        startDate={salesStart}
        endDate={salesEnd}
        onStartDate={setSalesStart}
        onEndDate={setSalesEnd}
      />

      {/* Daily Sales Per Stall */}
      <ExportSection
        title="Daily Sales Per Stall"
        description="Separate file per stall with 1 tab per day (Qty, Item, Amount)"
        icon={Store}
        accentColor="bg-linear-to-br from-orange-500 to-amber-600"
        sheets={DAILY_SALES_SHEETS}
        selectedSheets={dailySalesSheets}
        onToggle={(k) => toggle(dailySalesSheets, setDailySalesSheets, k)}
        onSelectAll={() =>
          setDailySalesSheets(new Set(DAILY_SALES_SHEETS.map((s) => s.key)))
        }
        onDeselectAll={() => setDailySalesSheets(new Set())}
        isExporting={dailySalesExporting}
        onExport={() => {
          if (dailySalesSheets.size === 0) return
          startExport(
            "daily_sales",
            Array.from(dailySalesSheets).join(","),
            setDailySalesExporting,
            dailySalesStart,
            dailySalesEnd,
          )
        }}
        dateRange
        startDate={dailySalesStart}
        endDate={dailySalesEnd}
        onStartDate={setDailySalesStart}
        onEndDate={setDailySalesEnd}
      />

      {/* Cheque Collections Export */}
      <ExportSection
        title="Cheque Collections Report"
        description="Cheque tracking by status, bank, and collection date"
        icon={Banknote}
        accentColor="bg-linear-to-br from-violet-500 to-purple-600"
        sheets={CHEQUE_SHEETS}
        selectedSheets={chequeSheets}
        onToggle={(k) => toggle(chequeSheets, setChequeSheets, k)}
        onSelectAll={() =>
          setChequeSheets(new Set(CHEQUE_SHEETS.map((s) => s.key)))
        }
        onDeselectAll={() => setChequeSheets(new Set())}
        isExporting={chequeExporting}
        onExport={() => {
          if (chequeSheets.size === 0) return
          startExport(
            "cheques",
            Array.from(chequeSheets).join(","),
            setChequeExporting,
            chequeStart,
            chequeEnd,
          )
        }}
        dateRange
        startDate={chequeStart}
        endDate={chequeEnd}
        onStartDate={setChequeStart}
        onEndDate={setChequeEnd}
      />

      {/* Bulk Item Pricing Update */}
      <BulkItemUpdate
        result={bulkUpdateResult}
        processing={bulkProcessing}
        onUploadStarted={() => {
          setBulkProcessing(true)
          setBulkUpdateResult(null)
          bulkActionIdRef.current = addPendingAction(
            "bulk_update",
            "Bulk Price Update",
          )
        }}
      />
    </div>
  )
}
