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
    CardDescription,
    CardHeader,
    CardTitle,
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
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useJobOrderTemplatePrintMutations } from "@/lib/mutations/useJobOrderTemplatePrintMutations"
import {
    useJobOrderTemplatePrints,
    useNextJobOrderNumber,
} from "@/lib/queries/useJobOrderTemplatePrints"
import {
    CalendarDays,
    CheckCircle2,
    Eye,
    FileText,
    History,
    Info,
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

export default function TemplatesSettingsPage() {
  const { canManage } = useCurrentUser()
  const [startNumber, setStartNumber] = useState("")
  const [endNumber, setEndNumber] = useState("")
  const [previewOpen, setPreviewOpen] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const [showConfirmPrint, setShowConfirmPrint] = useState(false)
  const [hasAppliedSuggestion, setHasAppliedSuggestion] = useState(false)

  const start = Number(startNumber)
  const end = Number(endNumber)

  const printRef = useRef<HTMLDivElement>(null)

  // Queries
  const { data: nextNumberData, isLoading: isLoadingNext } = useNextJobOrderNumber()
  const { data: printHistory, isLoading: isLoadingHistory } = useJobOrderTemplatePrints({ limit: 10 })

  // Mutations
  const { recordPrint } = useJobOrderTemplatePrintMutations()

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
          title="Job Order Templates"
          description="Generate printable blank job order forms."
          breadcrumbs={["Settings", "Templates"]}
        />

        <Alert variant="warning">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Access restricted</AlertTitle>
          <AlertDescription>
            Only managers and administrators can open this template generator.
          </AlertDescription>
        </Alert>
      </Wrapper>
    )
  }

  return (
    <Wrapper>
      <PageHeader
        title="Job Order Templates"
        description="Generate landscape job order sheets with two blank forms per page and sequential job order numbers ready for printing."
        breadcrumbs={["Settings", "Templates"]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column — Generate */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle>Generate Templates</CardTitle>
              </div>
              <CardDescription>
                Enter the range of job order numbers to print. The system tracks what&apos;s been printed so you always know the next available number.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Suggested next number */}
              {nextNumberData && (
                <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
                  <Sparkles className="h-4 w-4 text-primary shrink-0" />
                  <p className="text-sm text-primary">
                    Suggested next: <span className="font-semibold">#{formatJobOrderNumber(nextNumberData.next_number)}</span>
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
                    Apply
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-number">Start</Label>
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
                <div className="space-y-2">
                  <Label htmlFor="end-number">End</Label>
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
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border bg-muted/30 px-3 py-2 text-center">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">First</p>
                    <p className="text-lg font-semibold">{formatJobOrderNumber(jobOrderNumbers[0])}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 px-3 py-2 text-center">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Last</p>
                    <p className="text-lg font-semibold">{formatJobOrderNumber(jobOrderNumbers[jobOrderNumbers.length - 1])}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 px-3 py-2 text-center">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Total</p>
                    <p className="text-lg font-semibold">{jobOrderNumbers.length}</p>
                  </div>
                </div>
              )}

              {/* Paper Settings Note */}
              <div className="flex gap-3 rounded-lg bg-muted/50 px-3 py-2.5 text-sm text-muted-foreground">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p>Paper: <span className="font-medium text-foreground">Letter (8.5&quot; &times; 11&quot;)</span> &mdash; <span className="font-medium text-foreground">Landscape</span></p>
                  <p>Layout: <span className="font-medium text-foreground">2 templates per page</span> &mdash; Margin: <span className="font-medium text-foreground">0.5&quot;</span></p>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={() => setPreviewOpen(true)}
                disabled={jobOrderNumbers.length === 0}
              >
                <Eye className="h-4 w-4" />
                Preview &amp; Print
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column — Print History */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Print History</CardTitle>
            </div>
            <CardDescription>
              Track which job order numbers have been printed and by whom.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Loading history...
              </div>
            ) : !printHistory?.results?.length ? (
              <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                No templates have been printed yet.
              </div>
            ) : (
              <div className="space-y-2">
                {printHistory.results.map((record) => (
                  <div
                    key={record.id}
                    className="rounded-lg border px-3 py-2.5 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-medium">
                          #{formatJobOrderNumber(record.start_number)} &ndash; #{formatJobOrderNumber(record.end_number)}
                        </span>
                        <span className="text-muted-foreground">
                          ({record.end_number - record.start_number + 1} templates)
                        </span>
                      </div>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarDays className="h-3 w-3" />
                        {new Date(record.printed_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      Printed by <span className="font-medium text-foreground">{record.printed_by_name}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
