"use client"
import { formatDate } from "@/lib/utils"
import { useEffect, useMemo, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useOperationsSettingsMutations } from "@/lib/mutations/useOperationsSettingsMutations"
import { useStallChoices } from "@/lib/queries/useChoices"
import { SystemSettings } from "@/lib/queries/useSystemSettings"
import api from "@/lib/utils/api"
import { format, parse } from "date-fns"
import {
  BadgeCheck,
  BellRing,
  ExternalLink,
  KeyRound,
  PackageCheck,
  RefreshCcw,
  Save,
  Sheet,
  ShieldOff,
  Trash2,
  Upload,
  Volume2,
  Wrench,
  Wifi,
  WifiOff,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils/helpers"
import DatePicker from "@/components/custom/inputs/DatePicker"

interface Props {
  settings: SystemSettings
}

interface MonthlySheetRecord {
  id: number
  stall: number
  stall_name: string
  month_key: string
  spreadsheet_id: string
  spreadsheet_url: string
  is_active: boolean
  shared_ok: boolean
  shared_to_email: string
  shared_at: string | null
  share_error: string
  updated_at: string
}

const parseSpreadsheetId = (rawInput: string) => {
  const raw = (rawInput || "").trim()
  if (!raw) return ""
  if (/^https?:\/\//i.test(raw)) {
    const fromPath = raw.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
    if (fromPath?.[1]) return fromPath[1]
    const fromQuery = raw.match(/[?&]id=([a-zA-Z0-9-_]+)/)
    if (fromQuery?.[1]) return fromQuery[1]
  }
  return raw
}

// ─── Layout helpers ───────────────────────────────────────────────────────────

function SettingCard({
  icon: Icon,
  title,
  description,
  action,
  children,
  className,
}: {
  icon: React.ElementType
  title: string
  description: string
  action?: React.ReactNode
  children?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("rounded-xl border border-border/60 bg-card shadow-sm", className)}>
      <div className="flex items-start justify-between gap-4 p-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/60 ring-1 ring-border/40">
            <Icon className="size-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight">{title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{description}</p>
          </div>
        </div>
        {action && <div className="shrink-0 mt-0.5">{action}</div>}
      </div>
      {children && (
        <div className="border-t border-border/40 px-4 pb-4 pt-3 space-y-3">
          {children}
        </div>
      )}
    </div>
  )
}

function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("px-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60", className)}>
      {children}
    </p>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BusinessOperationsSettingsForm({ settings }: Props) {
  const { updateOperationsSettings } = useOperationsSettingsMutations()
  const { data: stallChoices = [] } = useStallChoices({})

  const [notificationSound, setNotificationSound] = useState(settings.notification_sound)
  const [googleShareEmail, setGoogleShareEmail] = useState(settings.google_sheets_share_email || "")
  const [googleServiceAccountJson, setGoogleServiceAccountJson] = useState("")
  const [syncStatusMessage, setSyncStatusMessage] = useState("")
  const [connectionOk, setConnectionOk] = useState<boolean | null>(null)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [isSyncInProgress, setIsSyncInProgress] = useState(false)
  const [monthlySheets, setMonthlySheets] = useState<MonthlySheetRecord[]>([])
  const [isMonthlySheetsLoading, setIsMonthlySheetsLoading] = useState(false)

  // Month picker uses a Date object; we derive "yyyy-MM" from it when saving
  const [monthPickerDate, setMonthPickerDate] = useState<Date | undefined>(new Date())
  const [monthlySheetForm, setMonthlySheetForm] = useState({
    stall: "",
    spreadsheet_input: "",
    is_active: true,
  })

  const [subStallUnitRevenueAdditional, setSubStallUnitRevenueAdditional] = useState(
    settings.sub_stall_unit_revenue_additional || "0",
  )
  const [syncingMonthlySheetId, setSyncingMonthlySheetId] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const syncJobCancelledRef = useRef(false)
  const syncToastIdRef = useRef<string | null>(null)

  useEffect(() => {
    setNotificationSound(settings.notification_sound)
  }, [settings.notification_sound])

  useEffect(() => {
    setGoogleShareEmail(settings.google_sheets_share_email || "")
    setSubStallUnitRevenueAdditional(settings.sub_stall_unit_revenue_additional || "0")
  }, [settings.google_sheets_share_email, settings.sub_stall_unit_revenue_additional])

  useEffect(() => {
    if (!monthlySheetForm.stall && stallChoices.length > 0) {
      setMonthlySheetForm((p) => ({ ...p, stall: String(stallChoices[0].id) }))
    }
  }, [stallChoices, monthlySheetForm.stall])

  const fetchMonthlySheets = async (silent = false) => {
    try {
      if (!silent) setIsMonthlySheetsLoading(true)
      const { data } = await api.get("/sales/monthly-sheets/", { params: { ordering: "-month_key" } })
      const rows = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : []
      setMonthlySheets(rows)
    } catch {
      if (!silent) toast.error("Unable to load monthly sheets")
    } finally {
      if (!silent) setIsMonthlySheetsLoading(false)
    }
  }

  const upsertMonthlySheet = async () => {
    const stallId = Number(monthlySheetForm.stall)
    if (!stallId) { toast.error("Please select a stall."); return }
    if (!monthPickerDate) { toast.error("Please select a month."); return }
    const monthKey = format(monthPickerDate, "yyyy-MM")
    const spreadsheetId = parseSpreadsheetId(monthlySheetForm.spreadsheet_input)
    if (!spreadsheetId) { toast.error("Spreadsheet ID or URL is required."); return }
    try {
      setIsMonthlySheetsLoading(true)
      await api.post("/sales/monthly-sheets/", {
        stall: stallId,
        month_key: monthKey,
        spreadsheet_id: spreadsheetId,
        spreadsheet_url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
        is_active: Boolean(monthlySheetForm.is_active),
      })
      toast.success("Monthly sheet link saved.")
      setMonthlySheetForm((p) => ({ ...p, spreadsheet_input: "" }))
      await fetchMonthlySheets(true)
      void fetchGoogleSyncStatus(true)
    } catch {
      toast.error("Failed to save monthly sheet link")
    } finally {
      setIsMonthlySheetsLoading(false)
    }
  }

  const saveSubStallUnitRevenueAdditional = () => {
    const normalized = subStallUnitRevenueAdditional.trim() || "0"
    const parsed = Number(normalized)
    if (Number.isNaN(parsed) || parsed < 0) { toast.error("Must be a valid non-negative amount."); return }
    updateOperationsSettings.mutate({ sub_stall_unit_revenue_additional: normalized })
  }

  const hasSubStallUnitRevenueAdditionalChanged =
    subStallUnitRevenueAdditional.trim() !== String(settings.sub_stall_unit_revenue_additional || "0").trim()

  const saveNotificationSound = () =>
    updateOperationsSettings.mutate({ notification_sound: notificationSound.trim() })

  const hasSoundChanged =
    notificationSound.trim() !== (settings.notification_sound || "").trim()

  const soundFileName = useMemo(() => {
    const value = (notificationSound || "").trim()
    if (!value) return ""
    const cleanPath = value.split("?")[0]
    const parts = cleanPath.split("/")
    return parts[parts.length - 1] || cleanPath
  }, [notificationSound])

  const uploadSoundFile = (file: File) => {
    const formData = new FormData()
    formData.append("notification_sound_file", file)
    updateOperationsSettings.mutate(formData)
  }

  const removeNotificationSound = () =>
    updateOperationsSettings.mutate({ remove_notification_sound: true })

  const saveGoogleSheetsSettings = () => {
    const payload: { google_sheets_share_email: string; google_service_account_json?: string } = {
      google_sheets_share_email: googleShareEmail.trim(),
    }
    if (googleServiceAccountJson.trim()) payload.google_service_account_json = googleServiceAccountJson.trim()
    updateOperationsSettings.mutate(payload, {
      onSuccess: () => {
        setGoogleServiceAccountJson("")
        void fetchGoogleSyncStatus(true)
      },
    })
  }

  const clearGoogleCredential = () => {
    updateOperationsSettings.mutate({ google_service_account_json: "" }, {
      onSuccess: () => {
        setGoogleServiceAccountJson("")
        void fetchGoogleSyncStatus(true)
      },
    })
  }

  const fetchGoogleSyncStatus = async (silent = false) => {
    try {
      setIsTestingConnection(true)
      const { data } = await api.get("/users/settings/google-sheets-sync/")
      setConnectionOk(Boolean(data?.connection_ok))
      setSyncStatusMessage(data?.message || "Status checked")
      if (!silent) {
        if (data?.connection_ok) toast.success("Google Sheets connection is healthy.")
        else toast.error(data?.message || "Google Sheets is not connected.")
      }
    } catch {
      setConnectionOk(false)
      setSyncStatusMessage("Unable to check Google Sheets status")
      if (!silent) toast.error("Unable to check Google Sheets status")
    } finally {
      setIsTestingConnection(false)
    }
  }

  const testGoogleConnection = async () => {
    try {
      setIsTestingConnection(true)
      const { data } = await api.post("/users/settings/google-sheets-sync/", { action: "test_connection" })
      setConnectionOk(Boolean(data?.connection_ok))
      setSyncStatusMessage(data?.message || "Connection checked")
      if (data?.connection_ok) toast.success("Google Sheets connected successfully")
      else toast.error(data?.message || "Google Sheets connection failed")
    } catch {
      setConnectionOk(false)
      setSyncStatusMessage("Google Sheets connection failed")
      toast.error("Google Sheets connection failed")
    } finally {
      setIsTestingConnection(false)
    }
  }

  const wait = (ms: number) => new Promise<void>((resolve) => { setTimeout(resolve, ms) })

  const formatHistoricalSyncProgress = (data: {
    state?: string; processed_targets?: number; total_targets?: number
    synced?: number; failed?: number; progress_pct?: number
    current_stall_id?: number | null; current_date?: string | null; latest_error?: string | null
  }) => {
    const state = String(data.state || "")
    const processed = Number(data.processed_targets || 0)
    const total = Number(data.total_targets || 0)
    const synced = Number(data.synced || 0)
    const failed = Number(data.failed || 0)
    const pct = Number(data.progress_pct || 0)
    const latestError = String(data.latest_error || "").trim()
    const location = data.current_stall_id && data.current_date ? ` · stall ${data.current_stall_id} @ ${data.current_date}` : ""
    const errorHint = failed > 0 && latestError ? ` · last error: ${latestError}` : ""
    if (state === "queued") return "Historical sync queued…"
    if (total > 0) return `Syncing… ${processed}/${total} (${pct}%) · ✓${synced} ✗${failed}${location}${errorHint}`
    return `Syncing… ✓${synced} ✗${failed}${location}${errorHint}`
  }

  const showSyncPendingToast = (message: string) => {
    const toastId = syncToastIdRef.current || "google-sheets-sync-progress"
    syncToastIdRef.current = toastId
    toast.warning(message, { id: toastId, description: "Monitoring the historical sync job.", duration: Infinity })
  }

  const stopSyncMonitoring = () => {
    syncJobCancelledRef.current = true
    setIsSyncInProgress(false)
    const message = "Sync monitoring stopped. The historical sync may continue in the background."
    setSyncStatusMessage(message)
    if (syncToastIdRef.current) {
      toast.warning(message, { id: syncToastIdRef.current, description: "Restart to resume monitoring.", duration: 6000 })
    } else { toast.warning(message) }
  }

  const pollHistoricalSyncJob = async (jobId: string, onProgress?: (data: Record<string, unknown>) => void) => {
    const maxAttempts = 120
    let lastData: Record<string, unknown> | null = null
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (syncJobCancelledRef.current) return { ...(lastData || {}), state: "cancelled", message: "Stopped by user." }
      const { data } = await api.get("/users/settings/google-sheets-sync/", { params: { job_id: jobId }, timeout: 30000 })
      lastData = data
      if (onProgress) onProgress(data)
      const state = String(data?.state || "")
      if (state === "completed" || state === "failed") return data
      await wait(2500)
    }
    return { ...(lastData || {}), state: "running_timeout", message: "Historical sync is still running in the background." }
  }

  const syncMonthlySheet = async (sheet: MonthlySheetRecord) => {
    const monthParts = sheet.month_key.split("-")
    if (monthParts.length !== 2) { toast.error("Invalid month key format."); return }
    const year = Number(monthParts[0])
    const month = Number(monthParts[1])
    if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) { toast.error("Invalid month key format."); return }
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)
    try {
      setIsSyncInProgress(true)
      setSyncingMonthlySheetId(sheet.id)
      syncJobCancelledRef.current = false
      const payload = {
        action: "sync_historical",
        start_date: format(startDate, "yyyy-MM-dd"),
        end_date: format(endDate, "yyyy-MM-dd"),
        stall_id: sheet.stall,
      }
      const startResponse = await api.post("/users/settings/google-sheets-sync/", payload, { timeout: 30000 })
      if (startResponse.status === 202 && startResponse.data?.job_id) {
        const jobId = String(startResponse.data.job_id)
        const loadingToastId = "google-sheets-sync-progress"
        syncToastIdRef.current = loadingToastId
        const initial = formatHistoricalSyncProgress({ state: "queued" })
        setSyncStatusMessage(initial)
        showSyncPendingToast(initial)
        const data = await pollHistoricalSyncJob(jobId, (d) => {
          const msg = formatHistoricalSyncProgress(d)
          setSyncStatusMessage(msg)
          showSyncPendingToast(msg)
        })
        if (String(data?.state) === "cancelled") {
          const msg = String(data?.message || "Stopped by user.")
          setSyncStatusMessage(msg)
          toast.warning(msg, { id: loadingToastId, duration: 6000 })
          return
        }
        if (String(data?.state) === "running_timeout") {
          const msg = String(data?.message || "Historical sync is still running.")
          setSyncStatusMessage(msg)
          toast.warning(msg, { id: loadingToastId, duration: 6000 })
          return
        }
        const errors = Array.isArray(data?.errors) ? data.errors : []
        const summary = `Synced: ${data?.synced ?? 0}, Failed: ${data?.failed ?? 0}`
        setSyncStatusMessage(summary)
        if (String(data?.state) === "failed" || !data?.ok) {
          toast.error(`${summary}${errors.length > 0 ? `\n${errors[0]}` : ""}`, { id: loadingToastId })
        } else {
          toast.success(summary, { id: loadingToastId })
        }
      } else {
        const data = startResponse.data
        const errors = Array.isArray(data?.errors) ? data.errors : []
        const summary = `Synced: ${data?.synced ?? 0}, Failed: ${data?.failed ?? 0}`
        setSyncStatusMessage(summary)
        if ((data?.failed ?? 0) > 0) toast.error(`${summary}${errors.length > 0 ? `\n${errors[0]}` : ""}`)
        else toast.success(summary)
      }
      await fetchGoogleSyncStatus(true)
      await fetchMonthlySheets(true)
    } catch (error) {
      toast.dismiss(syncToastIdRef.current || "google-sheets-sync-progress")
      let errorMessage = `Monthly sync failed for ${sheet.stall_name} ${sheet.month_key}`
      if ((error as { response?: { data?: Record<string, unknown> } })?.response?.data) {
        const d = (error as { response: { data: Record<string, unknown> } }).response.data
        errorMessage = String(d.message || d.detail || errorMessage)
      } else if ((error as { message?: string })?.message) {
        errorMessage = String((error as { message: string }).message)
      }
      setSyncStatusMessage(`Error: ${errorMessage}`)
      toast.error(errorMessage)
    } finally {
      setIsSyncInProgress(false)
      setSyncingMonthlySheetId(null)
      syncToastIdRef.current = null
    }
  }

  const hasGoogleConfigChanged =
    googleShareEmail.trim() !== (settings.google_sheets_share_email || "").trim() ||
    Boolean(googleServiceAccountJson.trim())

  useEffect(() => {
    void fetchGoogleSyncStatus(true)
    void fetchMonthlySheets(true)
  }, [])

  const isPending = updateOperationsSettings.isPending

  // Derive connection badge variant from the provided Badge variants
  const connectionBadgeVariant =
    connectionOk === true ? "success" : connectionOk === false ? "destructive" : "secondary"
  const connectionLabel =
    connectionOk === null ? "Not tested" : connectionOk ? "Connected" : "Not connected"

  return (
    <div className="space-y-2">

      {/* ── SYSTEM ─────────────────────────────────────────── */}
      <SectionLabel>System</SectionLabel>

      <SettingCard
        icon={Wrench}
        title="Maintenance Mode"
        description="Non-admin users see a maintenance screen while admins retain full access."
        action={
          <Switch
            checked={settings.maintenance_mode}
            disabled={isPending}
            onCheckedChange={(checked) =>
              updateOperationsSettings.mutate({ maintenance_mode: checked })
            }
          />
        }
      />

      <SettingCard
        icon={PackageCheck}
        title="Check Stock on Sale"
        description="Validate and deduct inventory when sales are created or edited."
        action={
          <Switch
            checked={settings.check_stock_on_sale}
            disabled={isPending}
            onCheckedChange={(checked) =>
              updateOperationsSettings.mutate({ check_stock_on_sale: checked })
            }
          />
        }
      />

      {/* ── REVENUE ────────────────────────────────────────── */}
      <SectionLabel className="pt-2">Revenue</SectionLabel>

      <SettingCard
        icon={PackageCheck}
        title="Sub Stall Unit Revenue Additional"
        description="Extra amount per unit shifted from main stall margin to sub stall revenue."
      >
        <div className="flex gap-2">
          <Input
            type="number"
            min="0"
            step="0.01"
            value={subStallUnitRevenueAdditional}
            disabled={isPending}
            onChange={(e) => setSubStallUnitRevenueAdditional(e.target.value)}
            placeholder="0.00"
            className="bg-background"
          />
          <Button
            type="button"
            variant="outline"
            disabled={isPending || !hasSubStallUnitRevenueAdditionalChanged}
            onClick={saveSubStallUnitRevenueAdditional}
            className="shrink-0 gap-1.5"
          >
            <Save className="size-3.5" />
            Save
          </Button>
        </div>
      </SettingCard>

      {/* ── NOTIFICATIONS ──────────────────────────────────── */}
      <SectionLabel className="pt-2">Notifications</SectionLabel>

      <SettingCard
        icon={BellRing}
        title="Push Notification Sound"
        description="Upload an audio file, paste a path, or remove the current sound."
      >
        <div className="flex gap-2">
          <Input
            value={notificationSound}
            disabled={isPending}
            onChange={(e) => setNotificationSound(e.target.value)}
            placeholder="/media/notification_sounds/alert.mp3"
            className="bg-background font-mono text-xs"
          />
          <Button
            type="button"
            variant="outline"
            disabled={isPending || !hasSoundChanged}
            onClick={saveNotificationSound}
            className="shrink-0 gap-1.5"
          >
            <Save className="size-3.5" />
            Save
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          aria-label="Upload push notification sound"
          title="Upload push notification sound"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) { uploadSoundFile(f); e.target.value = "" }
          }}
        />

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={isPending}
            onClick={() => fileInputRef.current?.click()}
            className="gap-1.5"
          >
            <Upload className="size-3.5" />
            Upload
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending || !notificationSound}
            onClick={removeNotificationSound}
            className="gap-1.5 border-destructive/30 text-destructive hover:border-destructive/60 hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
            Remove
          </Button>
          {soundFileName && (
            <Badge variant="secondary" className="gap-1.5 font-mono">
              <Volume2 />
              {soundFileName}
            </Badge>
          )}
        </div>

        {notificationSound && (
          <audio controls preload="none" className="h-8 w-full rounded-md">
            <source src={notificationSound} />
          </audio>
        )}
      </SettingCard>

      {/* ── GOOGLE SHEETS ──────────────────────────────────── */}
      <SectionLabel className="pt-2">Google Sheets Sync</SectionLabel>

      <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">

        {/* Panel header */}
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/60 ring-1 ring-border/40">
              <Sheet className="size-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">Google Sheets Sales Sync</p>
              <p className="mt-0.5 max-w-md text-xs text-muted-foreground leading-relaxed">
                Configure service account credentials and destination sheets for daily sales sync.
              </p>
            </div>
          </div>

          {/* Status badges — using the exact provided variants */}
          <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
            <Badge variant={settings.google_sheets_sync_enabled ? "success" : "secondary"}>
              <BadgeCheck />
              {settings.google_sheets_sync_enabled ? "Sync enabled" : "Sync disabled"}
            </Badge>
            <Badge variant={settings.google_service_account_configured ? "success" : "secondary"}>
              <KeyRound />
              {settings.google_service_account_configured ? "Credential set" : "No credential"}
            </Badge>
            <Badge variant={connectionBadgeVariant}>
              {connectionOk === true
                ? <Wifi />
                : connectionOk === false
                  ? <WifiOff />
                  : <Loader2 className={isTestingConnection ? "animate-spin" : ""} />
              }
              {connectionLabel}
            </Badge>
          </div>
        </div>

        <div className="border-t border-border/40 px-4 py-4 space-y-4">

          {/* Share email */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Global Share Email
            </Label>
            <Input
              type="email"
              value={googleShareEmail}
              disabled={isPending}
              onChange={(e) => setGoogleShareEmail(e.target.value)}
              placeholder="sheets-owner@company.com"
              className="bg-background"
            />
            <p className="text-xs text-muted-foreground">
              All monthly sheets are automatically shared to this email during sync.
            </p>
            <p className="text-xs text-muted-foreground">
              Note: this only works after each sheet is shared with your Service Account first.
            </p>
          </div>

          {/* Service account JSON */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Service Account JSON
            </Label>
            <Textarea
              value={googleServiceAccountJson}
              disabled={isPending}
              onChange={(e) => setGoogleServiceAccountJson(e.target.value)}
              placeholder={'Paste JSON (starts with { "type": "service_account", … })'}
              className="min-h-28 resize-y bg-background font-mono text-xs"
            />
          </div>

          {/* Status message */}
          {syncStatusMessage && (
            <div className="flex items-start gap-2 rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
              <p className="text-xs leading-relaxed text-foreground/80">{syncStatusMessage}</p>
            </div>
          )}

          {/* Action row */}
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/40 pt-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isPending || isTestingConnection}
              onClick={testGoogleConnection}
              className="gap-1.5 text-xs"
            >
              {isTestingConnection
                ? <Loader2 className="size-3.5 animate-spin" />
                : <RefreshCcw className="size-3.5" />
              }
              Test Connection
            </Button>
            {isSyncInProgress && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={stopSyncMonitoring}
                className="gap-1.5 text-xs"
              >
                <ShieldOff className="size-3.5" />
                Stop Monitoring
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending || !settings.google_service_account_configured}
              onClick={clearGoogleCredential}
              className="gap-1.5 text-xs"
            >
              <ShieldOff className="size-3.5" />
              Clear Credential
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isPending || !hasGoogleConfigChanged}
              onClick={saveGoogleSheetsSettings}
              className="gap-1.5 text-xs"
            >
              <Save className="size-3.5" />
              Save Settings
            </Button>
          </div>
        </div>

        {/* ── Monthly Sheet Links sub-panel ────────────────── */}
        <div className="border-t border-border/40 bg-muted/20 px-4 py-4 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold leading-tight">Monthly Sheet Links</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                One sheet per stall per month — used as first priority in daily sync.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isMonthlySheetsLoading}
              onClick={() => void fetchMonthlySheets()}
              className="shrink-0 gap-1.5 text-xs"
            >
              <RefreshCcw className={cn("size-3.5", isMonthlySheetsLoading && "animate-spin")} />
              Refresh
            </Button>
          </div>

          {/* New / update form */}
          <div className="rounded-lg border border-border/60 bg-background p-3 space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              New / Update Link
            </p>

            <div className="grid gap-2 sm:grid-cols-4">
              {/* Stall */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Stall</Label>
                <Select
                  value={monthlySheetForm.stall}
                  onValueChange={(v) => setMonthlySheetForm((p) => ({ ...p, stall: v }))}
                >
                  <SelectTrigger className="h-9 bg-background text-sm">
                    <SelectValue placeholder="Choose stall" />
                  </SelectTrigger>
                  <SelectContent>
                    {stallChoices.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Month — DatePicker in standalone mode, no form wrapper needed */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Month</Label>
<DatePicker mode="month" standalone withoutLabel placeholder="Pick month"    field={{
                    value: monthPickerDate,
                    onChange: (d) => setMonthPickerDate(d),
                  }}/>
              </div>

              {/* Spreadsheet URL */}
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs text-muted-foreground">Spreadsheet URL or ID</Label>
                <Input
                  value={monthlySheetForm.spreadsheet_input}
                  onChange={(e) => setMonthlySheetForm((p) => ({ ...p, spreadsheet_input: e.target.value }))}
                  placeholder="https://docs.google.com/spreadsheets/d/…"
                  className="h-9 bg-background text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <label className="flex cursor-pointer select-none items-center gap-2">
                <Switch
                  checked={monthlySheetForm.is_active}
                  onCheckedChange={(c) => setMonthlySheetForm((p) => ({ ...p, is_active: c }))}
                />
                <span className="text-xs text-muted-foreground">Active link</span>
              </label>
              <Button
                type="button"
                size="sm"
                disabled={isMonthlySheetsLoading}
                onClick={upsertMonthlySheet}
                className="gap-1.5 text-xs"
              >
                <Save className="size-3.5" />
                Save Link
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <table className="w-full min-w-[640px] text-xs">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40">
                  {["Stall", "Month", "Sheet", "Share", "Status", "Actions"].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthlySheets.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-xs text-muted-foreground">
                      {isMonthlySheetsLoading ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="size-3.5 animate-spin" />
                          Loading monthly links…
                        </span>
                      ) : (
                        "No monthly sheet links yet."
                      )}
                    </td>
                  </tr>
                )}
                {monthlySheets.map((sheet, i) => (
                  <tr
                    key={sheet.id}
                    className={cn(
                      "border-b border-border/40 transition-colors hover:bg-muted/30",
                      i % 2 === 0 ? "bg-background" : "bg-muted/10",
                    )}
                  >
                    <td className="px-3 py-2.5 font-medium">{sheet.stall_name}</td>
                    <td className="px-3 py-2.5 font-mono">{formatDate(new Date(sheet.month_key), "MMMM yyyy")}</td>
                    <td className="px-3 py-2.5">
                      {sheet.spreadsheet_url ? (
                        <a
                          href={sheet.spreadsheet_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                        >
                          Open <ExternalLink className="size-3" />
                        </a>
                      ) : (
                        <span className="font-mono text-muted-foreground">
                          {sheet.spreadsheet_id.slice(0, 12)}…
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-col gap-0.5">
                        {sheet.shared_ok ? (
                          <Badge variant="success">Shared</Badge>
                        ) : (
                          <Badge variant="warning">
                            {(sheet.share_error || "").toLowerCase().includes("service account has no access")
                              ? "Needs Service Account Access"
                              : "Pending"}
                          </Badge>
                        )}
                        {sheet.share_error && (
                          <p className="max-w-[200px] truncate text-[10px] text-destructive">
                            {sheet.share_error}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      {/* "default" (primary) for active, "secondary" for inactive */}
                      <Badge variant={sheet.is_active ? "default" : "secondary"}>
                        {sheet.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isSyncInProgress}
                          onClick={() => void syncMonthlySheet(sheet)}
                          className="h-7 gap-1 px-2 text-[11px]"
                        >
                          {syncingMonthlySheetId === sheet.id ? (
                            <><Loader2 className="size-3 animate-spin" /> Syncing…</>
                          ) : (
                            <><RefreshCcw className="size-3" /> Sync</>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-[11px]"
                          onClick={() => {
                            // Parse "yyyy-MM" back into a Date for the picker
                            const parsed = parse(sheet.month_key, "yyyy-MM", new Date())
                            setMonthPickerDate(parsed)
                            setMonthlySheetForm({
                              stall: String(sheet.stall),
                              spreadsheet_input: sheet.spreadsheet_url || sheet.spreadsheet_id,
                              is_active: sheet.is_active,
                            })
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
