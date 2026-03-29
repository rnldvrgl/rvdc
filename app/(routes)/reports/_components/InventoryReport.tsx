"use client"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import api from "@/lib/utils/api"
import {
    AlertTriangle,
    Copy,
    Download,
    FileSpreadsheet,
    Layers,
    Loader2,
    PackageX,
    ShoppingCart,
    TrendingDown,
    Wrench,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

const REPORT_SHEETS = [
  {
    key: "no_stock",
    label: "No Stock Items",
    description:
      "Items with zero available quantity that need immediate ordering",
    icon: PackageX,
    color: "text-destructive",
    bgColor: "bg-red-50 dark:bg-red-950/20",
  },
  {
    key: "low_stock",
    label: "Low Stock Items",
    description: "Items below their threshold with suggested order quantities",
    icon: AlertTriangle,
    color: "text-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-950/20",
  },
  {
    key: "most_bought",
    label: "Most Bought Items",
    description: "Top 50 items by quantity consumed from sales and services",
    icon: ShoppingCart,
    color: "text-success",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
  },
  {
    key: "least_bought",
    label: "Least Bought Items",
    description:
      "Bottom 50 items by usage — helps identify slow-moving inventory",
    icon: TrendingDown,
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
  },
  {
    key: "custom_items",
    label: "Custom Items Usage",
    description:
      "Non-inventory items used in services — candidates for adding to inventory",
    icon: Wrench,
    color: "text-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
  },
  {
    key: "duplicates",
    label: "Potential Duplicates",
    description:
      "Items with similar names that may be duplicates needing cleanup",
    icon: Copy,
    color: "text-orange-500",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
  },
  {
    key: "by_category",
    label: "Items by Category",
    description: "All items grouped by category with stock levels and status",
    icon: Layers,
    color: "text-indigo-500",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/20",
  },
] as const

type SheetKey = (typeof REPORT_SHEETS)[number]["key"]

export function InventoryReport() {
  const [selectedSheets, setSelectedSheets] = useState<Set<SheetKey>>(
    new Set(REPORT_SHEETS.map((s) => s.key)),
  )
  const [isExporting, setIsExporting] = useState(false)

  const toggleSheet = (key: SheetKey) => {
    setSelectedSheets((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const selectAll = () =>
    setSelectedSheets(new Set(REPORT_SHEETS.map((s) => s.key)))

  const deselectAll = () => setSelectedSheets(new Set())

  const handleExport = async () => {
    if (selectedSheets.size === 0) {
      toast.error("Please select at least one report section to export.")
      return
    }

    setIsExporting(true)
    try {
      const sheets = Array.from(selectedSheets).join(",")
      const response = await api.get("/inventory/export-report/", {
        params: { sheets },
        responseType: "blob",
      })

      const contentDisposition = response.headers["content-disposition"]
      let filename = "inventory_report.xlsx"
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^";\n]+)"?/)
        if (match) filename = match[1]
      }

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      toast.success("Inventory report downloaded successfully!")
    } catch {
      toast.error("Failed to generate the report. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={selectAll}
            disabled={selectedSheets.size === REPORT_SHEETS.length}
          >
            Select All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={deselectAll}
            disabled={selectedSheets.size === 0}
          >
            Deselect All
          </Button>
          <span className="text-sm text-muted-foreground">
            {selectedSheets.size} of {REPORT_SHEETS.length} sections selected
          </span>
        </div>

        <Button
          onClick={handleExport}
          disabled={isExporting || selectedSheets.size === 0}
          className="gap-2"
        >
          {isExporting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          {isExporting ? "Generating..." : "Export Report"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {REPORT_SHEETS.map((sheet) => {
          const Icon = sheet.icon
          const isSelected = selectedSheets.has(sheet.key)
          return (
            <Card
              key={sheet.key}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected
                  ? "ring-2 ring-primary border-primary"
                  : "opacity-60"
              }`}
              onClick={() => toggleSheet(sheet.key)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={`rounded-lg p-2 ${sheet.bgColor}`}>
                    <Icon className={`size-5 ${sheet.color}`} />
                  </div>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleSheet(sheet.key)}
                  />
                </div>
                <CardTitle className="text-sm font-semibold mt-2">
                  {sheet.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-xs">
                  {sheet.description}
                </CardDescription>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <FileSpreadsheet className="size-5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium">About the Report</p>
              <p className="text-xs text-muted-foreground">
                The report is exported as an Excel file (.xlsx) with a Summary
                sheet and the selected data sheets. Each sheet includes formatted
                tables with color-coded status indicators.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
