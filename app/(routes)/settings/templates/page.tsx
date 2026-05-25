"use client"

import { JobOrderTemplatePrintContent } from "@/components/custom/shared/JobOrderTemplatePrintContent"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"

import { InventorySkuLabelPrintContent } from "@/components/custom/shared/InventorySkuLabelPrintContent"
import { Item } from "@/lib/constants/interface"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useJobOrderTemplatePrintMutations } from "@/lib/mutations/useJobOrderTemplatePrintMutations"
import { useItems } from "@/lib/queries/inventory/useItems"
import {
    useJobOrderTemplatePrints,
    useNextJobOrderNumber,
} from "@/lib/queries/useJobOrderTemplatePrints"
import {
    CalendarDays,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Eye,
    History,
    Loader2,
    Printer,
    ShieldAlert,
    Sparkles,
    Search,
    Tag,
    User,
    XCircle,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useReactToPrint } from "react-to-print"

function formatJobOrderNumber(num: number): string {
  return String(num).padStart(6, "0")
}

const MAX_TEMPLATE_COUNT = 200
const HISTORY_PAGE_SIZE = 10
const SKU_ITEMS_PAGE_SIZE = 64
const MIN_SKU_LABELS_PER_PAGE = 64
const MAX_SKU_LABELS_PER_PAGE = 64

export default function TemplatesSettingsPage() {
  const { canManage } = useCurrentUser()
  const [activeTab, setActiveTab] = useState<"job-order" | "sku-labels">("job-order")
  const [startNumber, setStartNumber] = useState("")
  const [endNumber, setEndNumber] = useState("")
  const [previewOpen, setPreviewOpen] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const [showConfirmPrint, setShowConfirmPrint] = useState(false)
  const [hasAppliedSuggestion, setHasAppliedSuggestion] = useState(false)
  const [historyPage, setHistoryPage] = useState(1)
  const [skuPage, setSkuPage] = useState(1)
  const [labelsPerPage, setLabelsPerPage] = useState(64)
  const [skuSearch, setSkuSearch] = useState("")
  const [selectedSkuItems, setSelectedSkuItems] = useState<Item[]>([])
  const [hasAppliedSkuSelection, setHasAppliedSkuSelection] = useState(false)
  const [skuPreviewOpen, setSkuPreviewOpen] = useState(false)
  const [isSkuPrinting, setIsSkuPrinting] = useState(false)

  const start = Number(startNumber)
  const end = Number(endNumber)

  const printRef = useRef<HTMLDivElement>(null)
  const skuPrintRef = useRef<HTMLDivElement>(null)

  // Queries
  const { data: nextNumberData, isLoading: isLoadingNext } = useNextJobOrderNumber()
  const { data: printHistory, isLoading: isLoadingHistory } = useJobOrderTemplatePrints({
    page: historyPage,
    limit: HISTORY_PAGE_SIZE,
  })
  const { data: itemsData, isLoading: isLoadingItems } = useItems({
    page: skuPage,
    limit: SKU_ITEMS_PAGE_SIZE,
    search: skuSearch.trim() || undefined,
    ordering: "name",
  })

  // Mutations
  const { recordPrint } = useJobOrderTemplatePrintMutations()

  const totalHistoryPages = printHistory ? Math.ceil(printHistory.count / HISTORY_PAGE_SIZE) : 0
  const skuItems = useMemo(() => itemsData?.results ?? [], [itemsData])
  const totalSkuPages = itemsData ? Math.ceil(itemsData.count / SKU_ITEMS_PAGE_SIZE) : 0
  const selectedSkuItemIds = useMemo(() => new Set(selectedSkuItems.map((item) => item.id)), [selectedSkuItems])

  // Auto-fill suggested starting number on first load
  useEffect(() => {
    if (nextNumberData?.next_number && !hasAppliedSuggestion && !startNumber) {
      const next = nextNumberData.next_number
      setStartNumber(String(next))
      setEndNumber(String(next + 3))
      setHasAppliedSuggestion(true)
    }
  }, [nextNumberData, hasAppliedSuggestion, startNumber])

  useEffect(() => {
    if (!hasAppliedSkuSelection && skuItems.length > 0) {
      setSelectedSkuItems(skuItems)
      setHasAppliedSkuSelection(true)
    }
  }, [hasAppliedSkuSelection, skuItems])

  useEffect(() => {
    setSkuPage(1)
  }, [skuSearch])

  useEffect(() => {
    setLabelsPerPage((current) =>
      Math.min(MAX_SKU_LABELS_PER_PAGE, Math.max(MIN_SKU_LABELS_PER_PAGE, current)),
    )
  }, [])

  const handleAfterPrint = useCallback(() => {
    setIsPrinting(false)
    setShowConfirmPrint(true)
  }, [])

  const handleSkuAfterPrint = useCallback(() => {
    setIsSkuPrinting(false)
    setSkuPreviewOpen(false)
  }, [])

  const handleConfirmPrint = useCallback(() => {
    if (start && end && start <= end) {
      recordPrint.mutateAsync({ start_number: start, end_number: end }).then(() => {
        setShowConfirmPrint(false)
        setPreviewOpen(false)
      })
    } else {
      setShowConfirmPrint(false)
      setPreviewOpen(false)
    }
  }, [start, end, recordPrint])

  const handleCancelPrint = useCallback(() => {
    setShowConfirmPrint(false)
  }, [])

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle:
      start && end
        ? `job-order-templates-${start}-${end}`
        : "job-order-templates",
    onAfterPrint: handleAfterPrint,
  })

  const onPrintClick = useCallback(() => {
    setIsPrinting(true)
    handlePrint()
  }, [handlePrint])

  const handleSkuPrint = useReactToPrint({
    contentRef: skuPrintRef,
    documentTitle:
      selectedSkuItems.length > 0
        ? `inventory-sku-labels-${selectedSkuItems.length}`
        : "inventory-sku-labels",
    onAfterPrint: handleSkuAfterPrint,
  })

  const onSkuPrintClick = useCallback(() => {
    if (selectedSkuItems.length === 0) {
      return
    }

    setIsSkuPrinting(true)
    handleSkuPrint()
  }, [handleSkuPrint, selectedSkuItems.length])

  const validationMessage = useMemo(() => {
    if (!startNumber || !endNumber) {
      return "Enter both starting and ending job order numbers."
    }

    if (!Number.isInteger(start) || !Number.isInteger(end)) {
      return "Use whole numbers only."
    }

    if (start <= 0 || end <= 0) {
      return "Job order numbers must be greater than zero."
    }

    if (end < start) {
      return "Ending job order number must be greater than or equal to the starting number."
    }

    if (end - start + 1 > MAX_TEMPLATE_COUNT) {
      return `You can print up to ${MAX_TEMPLATE_COUNT} job order templates at a time.`
    }

    return null
  }, [end, endNumber, start, startNumber])

  const jobOrderNumbers = useMemo(() => {
    if (validationMessage) {
      return []
    }

    return Array.from({ length: end - start + 1 }, (_, index) => start + index)
  }, [end, start, validationMessage])

  const toggleSkuItem = useCallback((itemId: number) => {
    setSelectedSkuItems((current) => {
      const existingIndex = current.findIndex((item) => item.id === itemId)

      if (existingIndex >= 0) {
        return current.filter((item) => item.id !== itemId)
      }

      const nextItem = skuItems.find((item) => item.id === itemId)
      return nextItem ? [...current, nextItem] : current
    })
  }, [skuItems])

  const selectVisibleSkuItems = useCallback(() => {
    setSelectedSkuItems((current) => {
      const map = new Map(current.map((item) => [item.id, item]))

      skuItems.forEach((item) => {
        map.set(item.id, item)
      })

      return Array.from(map.values())
    })
  }, [skuItems])

  const selectAllSkuItems = useCallback(() => {
    setSelectedSkuItems((current) => {
      const map = new Map(current.map((item) => [item.id, item]))

      skuItems.forEach((item) => {
        map.set(item.id, item)
      })

      return Array.from(map.values())
    })
  }, [skuItems])

  const clearSkuSelection = useCallback(() => {
    setSelectedSkuItems([])
  }, [])

  if (!canManage) {
    return (
      <Wrapper maxWidth="narrow">
        <PageHeader
          title="Templates"
          description="Generate and print document templates."
          breadcrumbs={["Settings", "Templates"]}
        />

        <Alert variant="warning">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Access restricted</AlertTitle>
          <AlertDescription>
            Only managers and administrators can access template management.
          </AlertDescription>
        </Alert>
      </Wrapper>
    )
  }

  return (
    <Wrapper>
      <PageHeader
        title="Templates"
        description="Generate and print document templates for your business."
        breadcrumbs={["Settings", "Templates"]}
      />

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "job-order" | "sku-labels")}
        className="space-y-6"
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="job-order" className="gap-1.5">
            <ClipboardList className="size-3.5" />
            Job Order Templates
          </TabsTrigger>
          <TabsTrigger value="sku-labels" className="gap-1.5">
            <Tag className="size-3.5" />
            SKU Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="job-order" className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-5">
        {/* ── Left: Generate ── */}
        <Card className="lg:col-span-2">
          <CardContent className="p-5 space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <ClipboardList className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm leading-tight">Job Order Templates</p>
                <p className="text-xs text-muted-foreground">Landscape &middot; 2 per page</p>
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Suggested next number */}
            {nextNumberData && (
              <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                <p className="text-sm text-primary">
                  Next available: <span className="font-semibold">#{formatJobOrderNumber(nextNumberData.next_number)}</span>
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto h-7 text-xs"
                  onClick={() => {
                    const next = nextNumberData.next_number
                    setStartNumber(String(next))
                    setEndNumber(String(next + 3))
                  }}
                >
                  Use this
                </Button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="start-number">Start Number</Label>
                <Input
                  id="start-number"
                  type="number"
                  min={1}
                  step={1}
                  value={startNumber}
                  placeholder={isLoadingNext ? "Loading..." : "e.g. 1001"}
                  onChange={(event) => setStartNumber(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end-number">End Number</Label>
                <Input
                  id="end-number"
                  type="number"
                  min={1}
                  step={1}
                  value={endNumber}
                  placeholder={isLoadingNext ? "Loading..." : "e.g. 1004"}
                  onChange={(event) => setEndNumber(event.target.value)}
                />
              </div>
            </div>

            {validationMessage ? (
              <Alert variant="warning">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Check the range</AlertTitle>
                <AlertDescription>{validationMessage}</AlertDescription>
              </Alert>
            ) : (
              <div className="flex items-center gap-4 rounded-lg bg-muted/40 px-4 py-3">
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Range</p>
                  <p className="text-sm font-semibold">
                    #{formatJobOrderNumber(jobOrderNumbers[0])} &ndash; #{formatJobOrderNumber(jobOrderNumbers[jobOrderNumbers.length - 1])}
                  </p>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Templates</p>
                  <p className="text-sm font-semibold">{jobOrderNumbers.length}</p>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Pages</p>
                  <p className="text-sm font-semibold">{Math.ceil(jobOrderNumbers.length / 2)}</p>
                </div>
              </div>
            )}

            <Button
              className="w-full"
              size="lg"
              onClick={() => setPreviewOpen(true)}
              disabled={jobOrderNumbers.length === 0}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview &amp; Print
            </Button>
          </CardContent>
        </Card>

        {/* ── Right: History ── */}
        <Card className="lg:col-span-3">
          <CardContent className="p-0">
            <div className="flex items-center gap-2 px-4 py-3 border-b">
              <History className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-semibold">Print History</p>
              {printHistory?.count ? (
                <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium leading-none">
                  {printHistory.count} record{printHistory.count === 1 ? "" : "s"}
                </span>
              ) : null}
            </div>

            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Loading history...
              </div>
            ) : !printHistory?.results?.length ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                <Printer className="mx-auto h-8 w-8 mb-2 opacity-30" />
                No templates have been printed yet.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40 text-muted-foreground">
                        <th className="px-4 py-2.5 text-left font-medium">Range</th>
                        <th className="px-4 py-2.5 text-left font-medium">Templates</th>
                        <th className="px-4 py-2.5 text-left font-medium">Printed By</th>
                        <th className="px-4 py-2.5 text-left font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {printHistory.results.map((record) => (
                        <tr key={record.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-2.5 font-medium whitespace-nowrap">
                            #{formatJobOrderNumber(record.start_number)} &ndash; #{formatJobOrderNumber(record.end_number)}
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground">
                            {record.end_number - record.start_number + 1}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="inline-flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5 text-muted-foreground" />
                              {record.printed_by_name}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarDays className="h-3.5 w-3.5" />
                              {new Date(record.printed_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalHistoryPages > 1 && (
                  <div className="flex items-center justify-between border-t px-4 py-3">
                    <p className="text-xs text-muted-foreground">
                      Page {historyPage} of {totalHistoryPages}
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={historyPage <= 1}
                        onClick={() => setHistoryPage((p) => p - 1)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={historyPage >= totalHistoryPages}
                        onClick={() => setHistoryPage((p) => p + 1)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

        </TabsContent>

        <TabsContent value="sku-labels" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-2">
              <CardContent className="p-5 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Tag className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm leading-tight">SKU Templates</p>
                    <p className="text-xs text-muted-foreground">3 in &times; 2 in labels for storage boxes</p>
                  </div>
                </div>

                <div className="h-px bg-border" />

                <div className="space-y-1.5">
                  <Label htmlFor="sku-search">Search inventory items</Label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="sku-search"
                      value={skuSearch}
                      onChange={(event) => setSkuSearch(event.target.value)}
                      placeholder="Search by item name, SKU, or category"
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={selectVisibleSkuItems} disabled={skuItems.length === 0}>
                    Select page
                  </Button>
                  <Button variant="outline" size="sm" onClick={selectAllSkuItems} disabled={skuItems.length === 0}>
                    Add page
                  </Button>
                  <Button variant="ghost" size="sm" onClick={clearSkuSelection} disabled={selectedSkuItems.length === 0}>
                    Clear
                  </Button>
                </div>

                <div className="flex items-center gap-3 rounded-lg bg-muted/40 px-4 py-3 text-sm">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Selected</p>
                    <p className="font-semibold">{selectedSkuItems.length} item{selectedSkuItems.length === 1 ? "" : "s"}</p>
                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Page</p>
                    <p className="font-semibold">{skuPage} of {Math.max(totalSkuPages, 1)}</p>
                  </div>
                </div>

                <Alert>
                  <ShieldAlert className="h-4 w-4" />
                  <AlertTitle>Labels per page fixed</AlertTitle>
                  <AlertDescription>
                    SKU label printing is fixed at {MIN_SKU_LABELS_PER_PAGE} labels per page for consistent output.
                  </AlertDescription>
                </Alert>

                {isLoadingItems ? (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Loading inventory items...
                  </div>
                ) : !skuItems.length ? (
                  <Alert variant="warning">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle>No items found</AlertTitle>
                    <AlertDescription>
                      Try a different search term or clear the search box to view all inventory items.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="max-h-120 overflow-auto rounded-lg border bg-background">
                    <div className="sticky top-0 border-b bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground">
                      {itemsData?.count ?? 0} total item{(itemsData?.count ?? 0) === 1 ? "" : "s"}
                    </div>
                    <div className="divide-y">
                      {skuItems.map((item) => {
                        const isChecked = selectedSkuItemIds.has(item.id)

                        return (
                          <label
                            key={item.id}
                            className="flex cursor-pointer items-start gap-3 px-3 py-3 transition-colors hover:bg-muted/40"
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={() => toggleSkuItem(item.id)}
                              className="mt-0.5"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium leading-tight">{item.name}</p>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <span className="font-mono">{item.sku || "NO SKU"}</span>
                                {item.category?.name ? (
                                  <span className="rounded-full bg-muted px-2 py-0.5">{item.category.name}</span>
                                ) : null}
                              </div>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}

                {totalSkuPages > 1 && (
                  <div className="flex items-center justify-between border-t px-3 py-3">
                    <p className="text-xs text-muted-foreground">
                      Page {skuPage} of {totalSkuPages}
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={skuPage <= 1}
                        onClick={() => setSkuPage((p) => p - 1)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={skuPage >= totalSkuPages}
                        onClick={() => setSkuPage((p) => p + 1)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => setSkuPreviewOpen(true)}
                  disabled={selectedSkuItems.length === 0}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview &amp; Print Labels
                </Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardContent className="p-0">
                <div className="flex items-center gap-2 px-4 py-3 border-b">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-semibold">Label Summary</p>
                  <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium leading-none">
                    {selectedSkuItems.length} selected
                  </span>
                </div>

                <div className="space-y-4 p-4">
                  <Alert>
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle>Print size</AlertTitle>
                    <AlertDescription>
                      Each label prints at approximately 2.125 inches wide by 0.6875 inches high on letter paper (4 columns × 16 rows).
                    </AlertDescription>
                  </Alert>

                  {selectedSkuItems.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                      Select inventory items on the left to build your label sheet.
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {selectedSkuItems.slice(0, 6).map((item) => (
                        <div
                          key={item.id}
                          className="rounded-lg border bg-background p-3 shadow-sm"
                        >
                          <p className="truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {item.name}
                          </p>
                          <p className="mt-2 break-all text-lg font-black tracking-[0.18em] text-foreground">
                            {item.sku || "NO SKU"}
                          </p>
                        </div>
                      ))}
                      {selectedSkuItems.length > 6 ? (
                        <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                          + {selectedSkuItems.length - 6} more selected item{selectedSkuItems.length - 6 === 1 ? "" : "s"}
                        </div>
                      ) : null}
                    </div>
                  )}

                  <div className="flex items-center gap-3 rounded-lg bg-muted/40 px-4 py-3 text-sm">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Labels per page</p>
                      <p className="font-semibold">{labelsPerPage} label{labelsPerPage === 1 ? "" : "s"}</p>
                    </div>
                    <div className="h-8 w-px bg-border" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Pages</p>
                      <p className="font-semibold">{Math.max(1, Math.ceil(selectedSkuItems.length / labelsPerPage))}</p>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => setSkuPreviewOpen(true)}
                    disabled={selectedSkuItems.length === 0}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Open Print Preview
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

      {/* Preview Sheet */}
      <Sheet open={previewOpen} onOpenChange={(next) => !next && setPreviewOpen(false)}>
        <SheetContent side="right" className="max-w-5xl! w-full px-6 sm:px-8 py-8 overflow-y-auto">
          <SheetHeader className="mb-5 pb-5 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-xl font-semibold">
                  Job Order Templates Preview
                </SheetTitle>
                <SheetDescription>
                  {jobOrderNumbers.length} template{jobOrderNumbers.length === 1 ? "" : "s"} &middot; {Math.ceil(jobOrderNumbers.length / 2)} page{Math.ceil(jobOrderNumbers.length / 2) === 1 ? "" : "s"}
                </SheetDescription>
              </div>
              <Button
                onClick={onPrintClick}
                disabled={isPrinting || recordPrint.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isPrinting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Printing...
                  </>
                ) : (
                  <>
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                  </>
                )}
              </Button>
            </div>
          </SheetHeader>

          <div className="overflow-auto max-h-[calc(100vh-14rem)] rounded-lg bg-gray-100 dark:bg-gray-900 p-6 flex flex-col items-center gap-6">
            <div className="origin-top scale-[0.75]">
              <JobOrderTemplatePrintContent
                ref={printRef}
                jobOrderNumbers={jobOrderNumbers}
                showPreviewMargins
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={skuPreviewOpen} onOpenChange={(next) => !next && setSkuPreviewOpen(false)}>
        <SheetContent side="right" className="max-w-5xl! w-full px-6 sm:px-8 py-8 overflow-y-auto">
          <SheetHeader className="mb-5 pb-5 border-b border-border">
            <div className="flex items-center justify-between gap-4">
              <div>
                <SheetTitle className="text-xl font-semibold">
                  SKU Labels Preview
                </SheetTitle>
                <SheetDescription>
                  {selectedSkuItems.length} label{selectedSkuItems.length === 1 ? "" : "s"} · {Math.ceil(selectedSkuItems.length / labelsPerPage)} page{Math.ceil(selectedSkuItems.length / labelsPerPage) === 1 ? "" : "s"}
                </SheetDescription>
              </div>
              <Button
                onClick={onSkuPrintClick}
                disabled={isSkuPrinting || selectedSkuItems.length === 0}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {isSkuPrinting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Printing...
                  </>
                ) : (
                  <>
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                  </>
                )}
              </Button>
            </div>
          </SheetHeader>

          <div className="overflow-auto max-h-[calc(100vh-14rem)] rounded-lg bg-gray-100 dark:bg-gray-900 p-6 flex flex-col items-center gap-6">
            <div className="origin-top scale-[0.78]">
              <InventorySkuLabelPrintContent
                ref={skuPrintRef}
                items={selectedSkuItems}
                labelsPerPage={labelsPerPage}
                showPreviewMargins
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Print Confirmation Dialog */}
      <AlertDialog open={showConfirmPrint}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader className="text-center sm:text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Printer className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            </div>
            <AlertDialogTitle className="text-lg">
              Did the print complete successfully?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Confirming will record templates{" "}
              <span className="font-semibold text-foreground">#{formatJobOrderNumber(start)}</span>
              {" "}&ndash;{" "}
              <span className="font-semibold text-foreground">#{formatJobOrderNumber(end)}</span>
              {" "}as printed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              onClick={handleConfirmPrint}
              disabled={recordPrint.isPending}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {recordPrint.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Yes, mark as printed
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleCancelPrint}
              disabled={recordPrint.isPending}
              className="w-full"
            >
              <XCircle className="mr-2 h-4 w-4" />
              No, I cancelled the print
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </Tabs>
    </Wrapper>
  )
}
