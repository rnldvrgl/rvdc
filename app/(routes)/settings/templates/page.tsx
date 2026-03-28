"use client"

import { JobOrderTemplatePrintContent } from "@/components/custom/shared/JobOrderTemplatePrintContent"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import { Eye, FileText, Printer, ShieldAlert } from "lucide-react"
import { useMemo, useRef, useState } from "react"
import { useReactToPrint } from "react-to-print"

function formatJobOrderNumber(num: number): string {
  return String(num).padStart(6, "0")
}

const MAX_TEMPLATE_COUNT = 200

export default function TemplatesSettingsPage() {
  const { canManage } = useCurrentUser()
  const [startNumber, setStartNumber] = useState("1001")
  const [endNumber, setEndNumber] = useState("1004")
  const [previewOpen, setPreviewOpen] = useState(false)

  const start = Number(startNumber)
  const end = Number(endNumber)

  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle:
      start && end
        ? `job-order-templates-${start}-${end}`
        : "job-order-templates",
  })

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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle>Template Range</CardTitle>
            </div>
            <CardDescription>
              Enter the first and last job order numbers to create a printable batch.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="start-number">Starting job order number</Label>
              <Input
                id="start-number"
                type="number"
                min={1}
                step={1}
                value={startNumber}
                onChange={(event) => setStartNumber(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-number">Ending job order number</Label>
              <Input
                id="end-number"
                type="number"
                min={1}
                step={1}
                value={endNumber}
                onChange={(event) => setEndNumber(event.target.value)}
              />
            </div>

            {validationMessage ? (
              <Alert variant="warning">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Check the range</AlertTitle>
                <AlertDescription>{validationMessage}</AlertDescription>
              </Alert>
            ) : (
              <Alert variant="info">
                <FileText className="h-4 w-4" />
                <AlertTitle>Ready to print</AlertTitle>
                <AlertDescription>
                  {jobOrderNumbers.length} template{jobOrderNumbers.length === 1 ? "" : "s"} will be generated across {Math.ceil(jobOrderNumbers.length / 2)} page{Math.ceil(jobOrderNumbers.length / 2) === 1 ? "" : "s"}.
                </AlertDescription>
              </Alert>
            )}

            <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground space-y-1">
              <p>Paper size: 8.5&quot; x 11&quot; landscape</p>
              <p>Layout: 2 templates per page</p>
              <p>Print margin: 0.5&quot; on all sides</p>
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

        <Card>
          <CardHeader>
            <CardTitle>Preview Summary</CardTitle>
            <CardDescription>
              The printed document uses a clean two-up layout with prefilled job order numbers and blank service fields.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {jobOrderNumbers.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                Enter a valid range to generate the printable batch.
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border bg-muted/30 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      First Number
                    </p>
                    <p className="mt-2 text-2xl font-semibold">{formatJobOrderNumber(jobOrderNumbers[0])}</p>
                  </div>
                  <div className="rounded-xl border bg-muted/30 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Last Number
                    </p>
                    <p className="mt-2 text-2xl font-semibold">
                      {formatJobOrderNumber(jobOrderNumbers[jobOrderNumbers.length - 1])}
                    </p>
                  </div>
                  <div className="rounded-xl border bg-muted/30 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Total Templates
                    </p>
                    <p className="mt-2 text-2xl font-semibold">{jobOrderNumbers.length}</p>
                  </div>
                </div>

                <div className="rounded-2xl border bg-linear-to-br from-muted/30 to-background p-4">
                  <p className="text-sm font-medium">Included job order numbers</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {jobOrderNumbers.slice(0, 12).map(formatJobOrderNumber).join(", ")}
                    {jobOrderNumbers.length > 12 ? " ..." : ""}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Preview Sheet — same pattern as quotation */}
      <Sheet open={previewOpen} onOpenChange={(next) => !next && setPreviewOpen(false)}>
        <SheetContent side="right" className="max-w-4xl! w-full px-6 sm:px-8 py-8 overflow-y-auto">
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
                onClick={() => handlePrint()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
            </div>
          </SheetHeader>

          <div className="overflow-auto max-h-[calc(100vh-14rem)] rounded-lg bg-gray-100 p-4">
            {/* eslint-disable-next-line react/forbid-dom-props */}
            <div style={{ zoom: 0.75 }}>
              <JobOrderTemplatePrintContent
                ref={printRef}
                jobOrderNumbers={jobOrderNumbers}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </Wrapper>
  )
}
