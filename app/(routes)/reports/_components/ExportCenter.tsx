"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  ExportWSData,
  useNotificationWebSocket,
} from "@/lib/hooks/useNotificationWebSocket"
import api from "@/lib/utils/api"
import {
  AlertTriangle,
  Banknote,
  BarChart3,
  CalendarDays,
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
  TrendingDown,
  TrendingUp,
  Wrench,
} from "lucide-react"
import { useCallback, useRef, useState } from "react"
import { toast } from "sonner"

// ── Inventory Sheets ─────────────────────────────────
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

// ── Sales Sheets ─────────────────────────────────────
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

// ── Cheque Sheets ────────────────────────────────────
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

// ── Types ────────────────────────────────────────────
type InventorySheetKey = (typeof INVENTORY_SHEETS)[number]["key"]
type SalesSheetKey = (typeof SALES_SHEETS)[number]["key"]
type ChequeSheetKey = (typeof CHEQUE_SHEETS)[number]["key"]

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
  startDate?: string
  endDate?: string
  onStartDate?: (v: string) => void
  onEndDate?: (v: string) => void
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
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`rounded-xl p-2.5 ${accentColor}`}>
              <SectionIcon className="size-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {description}
              </CardDescription>
            </div>
          </div>
          <Badge
            variant="secondary"
            className="text-xs font-normal"
          >
            {selectedSheets.size}/{sheets.length} sheets
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Date Range (for Sales & Cheques) */}
        {dateRange && (
          <div className="flex items-end gap-3 pb-2">
            <div className="space-y-1.5 flex-1">
              <Label className="text-xs text-muted-foreground">From</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => onStartDate?.(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5 flex-1">
              <Label className="text-xs text-muted-foreground">To</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => onEndDate?.(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
        )}

        {/* Sheet Grid */}
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {sheets.map((sheet) => {
            const Icon = sheet.icon
            const isSelected = selectedSheets.has(sheet.key)
            return (
              <button
                key={sheet.key}
                type="button"
                onClick={() => onToggle(sheet.key)}
                className={`group relative flex items-start gap-3 rounded-lg border p-3 text-left transition-all hover:shadow-sm ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border hover:border-muted-foreground/30 opacity-60"
                }`}
              >
                <div
                  className={`mt-0.5 shrink-0 rounded-md p-1.5 transition-colors ${
                    isSelected ? sheet.bgColor : "bg-muted"
                  }`}
                >
                  <Icon
                    className={`size-3.5 ${isSelected ? sheet.color : "text-muted-foreground"}`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium leading-tight">
                    {sheet.label}
                  </p>
                  <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
                    {sheet.description}
                  </p>
                </div>
                <Checkbox
                  checked={isSelected}
                  className="mt-0.5 shrink-0"
                  onCheckedChange={() => onToggle(sheet.key)}
                />
              </button>
            )
          })}
        </div>

        {/* Actions */}
        <Separator />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={onSelectAll}
              disabled={selectedSheets.size === sheets.length}
            >
              Select All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
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
            className="gap-1.5"
          >
            {isExporting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Download className="size-3.5" />
            )}
            {isExporting ? "Generating..." : "Export .xlsx"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Utility ──────────────────────────────────────────
function downloadFromToken(token: string, filename: string) {
  api
    .get(`/analytics/export/download/${token}/`, { responseType: "blob" })
    .then((res) => {
      const blob = new Blob([res.data])
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = blobUrl
      link.setAttribute("download", filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(blobUrl)
    })
    .catch(() => {
      toast.error("Failed to download export file.")
    })
}

function formatDate(d: Date) {
  return d.toISOString().split("T")[0]
}

// ── Export Center ────────────────────────────────────

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
  const [salesStart, setSalesStart] = useState(formatDate(thirtyDaysAgo))
  const [salesEnd, setSalesEnd] = useState(formatDate(today))

  // Cheques
  const [chequeSheets, setChequeSheets] = useState<Set<ChequeSheetKey>>(
    new Set(CHEQUE_SHEETS.map((s) => s.key)),
  )
  const [chequeExporting, setChequeExporting] = useState(false)
  const [chequeStart, setChequeStart] = useState(formatDate(ninetyDaysAgo))
  const [chequeEnd, setChequeEnd] = useState(formatDate(today))

  // ── Toggles ────────────────────────────────────────
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

  // ── Export handlers (background via POST + WebSocket) ──
  // Track which export type is currently generating
  const pendingExportRef = useRef<string | null>(null)

  const onExportReady = useCallback((data: ExportWSData) => {
    if (data.event === "export_ready" && data.token && data.filename) {
      toast.success(data.title, { description: data.message })
      downloadFromToken(data.token, data.filename)
    } else if (data.event === "export_failed") {
      toast.error(data.title, { description: data.message })
    }

    // Clear the loading state for the matching export type
    if (data.export_type === "inventory") setInvExporting(false)
    else if (data.export_type === "sales") setSalesExporting(false)
    else if (data.export_type === "cheques") setChequeExporting(false)
    pendingExportRef.current = null
  }, [])

  useNotificationWebSocket({ onExportReady })

  const startExport = async (
    exportType: string,
    sheets: string,
    setExporting: (v: boolean) => void,
    startDate?: string,
    endDate?: string,
  ) => {
    setExporting(true)
    pendingExportRef.current = exportType
    try {
      await api.post("/analytics/export/", {
        export_type: exportType,
        sheets,
        ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate }),
      })
      toast.info("Export started", {
        description:
          "Your report is being generated. It will download automatically when ready.",
      })
    } catch {
      toast.error("Failed to start export.")
      setExporting(false)
      pendingExportRef.current = null
    }
  }

  const exportInventory = () => {
    if (invSheets.size === 0) return
    startExport("inventory", Array.from(invSheets).join(","), setInvExporting)
  }

  const exportSales = () => {
    if (salesSheets.size === 0) return
    startExport(
      "sales",
      Array.from(salesSheets).join(","),
      setSalesExporting,
      salesStart,
      salesEnd,
    )
  }

  const exportCheques = () => {
    if (chequeSheets.size === 0) return
    startExport(
      "cheques",
      Array.from(chequeSheets).join(","),
      setChequeExporting,
      chequeStart,
      chequeEnd,
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5">
          <FileSpreadsheet className="size-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Export Center</h2>
          <p className="text-xs text-muted-foreground">
            Generate multi-sheet Excel reports for inventory, sales, and cheque
            collections.
          </p>
        </div>
      </div>

      {/* Inventory Export */}
      <ExportSection
        title="Inventory Report"
        description="Stock levels, purchasing insights, and inventory cleanup"
        icon={PackageX}
        accentColor="bg-gradient-to-br from-red-500 to-orange-500"
        sheets={INVENTORY_SHEETS}
        selectedSheets={invSheets}
        onToggle={(k) => toggle(invSheets, setInvSheets, k)}
        onSelectAll={() =>
          setInvSheets(new Set(INVENTORY_SHEETS.map((s) => s.key)))
        }
        onDeselectAll={() => setInvSheets(new Set())}
        isExporting={invExporting}
        onExport={exportInventory}
      />

      {/* Sales Export */}
      <ExportSection
        title="Sales Report"
        description="Daily, monthly, quarterly breakdowns with payment analysis"
        icon={ShoppingCart}
        accentColor="bg-gradient-to-br from-emerald-500 to-teal-600"
        sheets={SALES_SHEETS}
        selectedSheets={salesSheets}
        onToggle={(k) => toggle(salesSheets, setSalesSheets, k)}
        onSelectAll={() =>
          setSalesSheets(new Set(SALES_SHEETS.map((s) => s.key)))
        }
        onDeselectAll={() => setSalesSheets(new Set())}
        isExporting={salesExporting}
        onExport={exportSales}
        dateRange
        startDate={salesStart}
        endDate={salesEnd}
        onStartDate={setSalesStart}
        onEndDate={setSalesEnd}
      />

      {/* Cheque Collections Export */}
      <ExportSection
        title="Cheque Collections Report"
        description="Cheque tracking by status, bank, and collection date"
        icon={Banknote}
        accentColor="bg-gradient-to-br from-violet-500 to-purple-600"
        sheets={CHEQUE_SHEETS}
        selectedSheets={chequeSheets}
        onToggle={(k) => toggle(chequeSheets, setChequeSheets, k)}
        onSelectAll={() =>
          setChequeSheets(new Set(CHEQUE_SHEETS.map((s) => s.key)))
        }
        onDeselectAll={() => setChequeSheets(new Set())}
        isExporting={chequeExporting}
        onExport={exportCheques}
        dateRange
        startDate={chequeStart}
        endDate={chequeEnd}
        onStartDate={setChequeStart}
        onEndDate={setChequeEnd}
      />
    </div>
  )
}
