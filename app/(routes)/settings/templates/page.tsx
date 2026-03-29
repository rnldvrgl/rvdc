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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useJobOrderTemplatePrintMutations } from "@/lib/mutations/useJobOrderTemplatePrintMutations"
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
    FileText,
    History,
    Loader2,
    Printer,
    ShieldAlert,
    Sparkles,
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

export default function TemplatesSettingsPage() {
  const { canManage } = useCurrentUser()
  const [startNumber, setStartNumber] = useState("")
  const [endNumber, setEndNumber] = useState("")
  const [previewOpen, setPreviewOpen] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const [showConfirmPrint, setShowConfirmPrint] = useState(false)
  const [hasAppliedSuggestion, setHasAppliedSuggestion] = useState(false)
  const [historyPage, setHistoryPage] = useState(1)

  const start = Number(startNumber)
  const end = Number(endNumber)

  const printRef = useRef<HTMLDivElement>(null)

  // Queries
  const { data: nextNumberData, isLoading: isLoadingNext } = useNextJobOrderNumber()
  const { data: printHistory, isLoading: isLoadingHistory } = useJobOrderTemplatePrints({
    page: historyPage,
    limit: HISTORY_PAGE_SIZE,
  })

  // Mutations
  const { recordPrint } = useJobOrderTemplatePrintMutations()

  const totalHistoryPages = printHistory ? Math.ceil(printHistory.count / HISTORY_PAGE_SIZE) : 0

  // Auto-fill suggested starting number on first load
  useEffect(() => {
    if (nextNumberData?.next_number && !hasAppliedSuggestion && !startNumber) {
      const next = nextNumberData.next_number
      setStartNumber(String(next))
      setEndNumber(String(next + 3))
      setHasAppliedSuggestion(true)
    }
  }, [nextNumberData, hasAppliedSuggestion, startNumber])

  const handleAfterPrint = useCallback(() => {
    setIsPrinting(false)
    setShowConfirmPrint(true)
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

      {/* ── Template Type Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <Card className="border-primary/30 bg-primary/5 ring-1 ring-primary/20">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm">Job Order</p>
              <p className="text-xs text-muted-foreground truncate">
                Landscape &middot; 2 per page &middot; Sequential numbering
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Placeholder for future templates */}
        <Card className="border-dashed opacity-50">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-muted-foreground">More coming soon</p>
              <p className="text-xs text-muted-foreground">Quotations, receipts, and more</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Job Order Section ── */}
      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList>
          <TabsTrigger value="generate" className="gap-1.5">
            <Printer className="h-3.5 w-3.5" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <History className="h-3.5 w-3.5" />
            History
            {printHistory?.count ? (
              <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium leading-none">
                {printHistory.count}
              </span>
            ) : null}
          </TabsTrigger>
        </TabsList>

        {/* ── Generate Tab ── */}
        <TabsContent value="generate">
          <Card>
            <CardContent className="p-6 space-y-5 max-w-xl">
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
        </TabsContent>

        {/* ── History Tab ── */}
        <TabsContent value="history">
          <Card>
            <CardContent className="p-0">
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
                  {/* Table */}
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
                        Page {historyPage} of {totalHistoryPages} &middot; {printHistory.count} total records
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
        </TabsContent>
      </Tabs>

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
            <div style={{ zoom: 0.75 }}>
              <JobOrderTemplatePrintContent
                ref={printRef}
                jobOrderNumbers={jobOrderNumbers}
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
    </Wrapper>
  )
}
