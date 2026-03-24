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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ExportWSData,
  useNotificationWebSocket,
} from "@/lib/hooks/useNotificationWebSocket"
import { useClientMutations } from "@/lib/mutations/useClientMutations"
import { useItemMutations } from "@/lib/mutations/useItemMutations"
import usePendingActionsStore from "@/lib/store/usePendingActionsStore"
import api from "@/lib/utils/api"
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Download,
  Loader2,
  Package,
  Upload,
  Users,
} from "lucide-react"
import { useCallback, useRef, useState } from "react"
import { toast } from "sonner"

// -- Shared Types --
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
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [downloading, setDownloading] = useState(false)
  const [preview, setPreview] = useState<BulkPreviewData | null>(null)
  const [pendingFile, setPendingFile] = useState<FormData | null>(null)

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
    updateMutation.mutateAsync(pendingFile).then(() => {
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
              <div
                className={`shrink-0 rounded-lg sm:rounded-xl p-1.5 sm:p-2.5 bg-linear-to-br ${accentFrom} ${accentTo}`}
              >
                <Upload className="size-3.5 sm:size-5 text-white" />
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
              {preview?.changes && preview.changes.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Records to update ({preview.changes.length})
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

              {preview && preview.skipped > 0 && (
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  {preview.skipped} records unchanged (will be skipped)
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
                !preview?.changes ||
                preview.changes.length === 0
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
                : `Apply ${preview?.changes?.length ?? 0} Changes`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// -- Main Page --
export default function BulkUpdatePage() {
  const addPendingAction = usePendingActionsStore((s) => s.addAction)
  const removePendingAction = usePendingActionsStore((s) => s.removeAction)

  // Items
  const { bulkPreview: itemBulkPreview, bulkUpdate: itemBulkUpdate } =
    useItemMutations()
  const [itemResult, setItemResult] = useState<BulkUpdateResult | null>(null)
  const [itemProcessing, setItemProcessing] = useState(false)
  const itemActionIdRef = useRef<string | null>(null)

  // Clients
  const { bulkPreview: clientBulkPreview, bulkUpdate: clientBulkUpdate } =
    useClientMutations()
  const [clientResult, setClientResult] = useState<BulkUpdateResult | null>(
    null,
  )
  const [clientProcessing, setClientProcessing] = useState(false)
  const clientActionIdRef = useRef<string | null>(null)

  // WebSocket handler for bulk update notifications
  const onExportReady = useCallback(
    (data: ExportWSData) => {
      if (data.export_type === "bulk_update") {
        setItemProcessing(false)
        if (itemActionIdRef.current) {
          removePendingAction(itemActionIdRef.current)
          itemActionIdRef.current = null
        }
        if (data.event === "export_ready" && data.result) {
          setItemResult(data.result)
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

      if (data.export_type === "client_bulk_update") {
        setClientProcessing(false)
        if (clientActionIdRef.current) {
          removePendingAction(clientActionIdRef.current)
          clientActionIdRef.current = null
        }
        if (data.event === "export_ready" && data.result) {
          setClientResult(data.result)
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

      <Tabs
        defaultValue="items"
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger
            value="items"
            className="gap-1.5"
          >
            <Package className="size-3.5" />
            Items
          </TabsTrigger>
          <TabsTrigger
            value="clients"
            className="gap-1.5"
          >
            <Users className="size-3.5" />
            Clients
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items">
          <BulkUpdateSection
            title="Bulk Item Pricing Update"
            description="Download an XLSX template, edit prices, and re-upload to update items in bulk."
            templateEndpoint="/inventory/items/bulk-template/"
            templateFilename="item_pricing_template.xlsx"
            result={itemResult}
            processing={itemProcessing}
            onUploadStarted={() => {
              setItemProcessing(true)
              setItemResult(null)
              itemActionIdRef.current = addPendingAction(
                "bulk_update",
                "Bulk Price Update",
              )
            }}
            previewMutation={itemBulkPreview}
            updateMutation={itemBulkUpdate}
            accentFrom="from-cyan-500"
            accentTo="to-blue-600"
          />
        </TabsContent>

        <TabsContent value="clients">
          <BulkUpdateSection
            title="Bulk Client Update"
            description="Download an XLSX template, edit client details, and re-upload to update clients in bulk."
            templateEndpoint="/clients/bulk-template/"
            templateFilename="client_update_template.xlsx"
            result={clientResult}
            processing={clientProcessing}
            onUploadStarted={() => {
              setClientProcessing(true)
              setClientResult(null)
              clientActionIdRef.current = addPendingAction(
                "client_bulk_update",
                "Bulk Client Update",
              )
            }}
            previewMutation={clientBulkPreview}
            updateMutation={clientBulkUpdate}
            accentFrom="from-emerald-500"
            accentTo="to-teal-600"
          />
        </TabsContent>
      </Tabs>
    </Wrapper>
  )
}
