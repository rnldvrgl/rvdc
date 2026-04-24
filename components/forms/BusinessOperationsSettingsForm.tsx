"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import DatePicker from "@/components/custom/inputs/DatePicker"
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
import { SystemSettings } from "@/lib/queries/useSystemSettings"
import api from "@/lib/utils/api"
import { format } from "date-fns"
import {
  BadgeCheck,
  BellRing,
  CalendarClock,
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
} from "lucide-react"
import { toast } from "sonner"

interface Props {
  settings: SystemSettings
}

export function BusinessOperationsSettingsForm({ settings }: Props) {
  const { updateOperationsSettings } = useOperationsSettingsMutations()
  const [notificationSound, setNotificationSound] = useState(settings.notification_sound)
  const [googleSubSpreadsheetId, setGoogleSubSpreadsheetId] = useState(
    settings.google_sheets_spreadsheet_id || ""
  )
  const [googleMainSpreadsheetId, setGoogleMainSpreadsheetId] = useState(
    settings.google_sheets_main_spreadsheet_id || ""
  )
  const [googleStallType, setGoogleStallType] = useState(settings.google_sheets_sub_stall_type || "sub")
  const [googleServiceAccountJson, setGoogleServiceAccountJson] = useState("")
  const [syncStatusMessage, setSyncStatusMessage] = useState("")
  const [connectionOk, setConnectionOk] = useState<boolean | null>(null)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [isSyncInProgress, setIsSyncInProgress] = useState(false)
  const [syncStartDate, setSyncStartDate] = useState<Date | undefined>(undefined)
  const [syncEndDate, setSyncEndDate] = useState<Date | undefined>(undefined)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setNotificationSound(settings.notification_sound)
  }, [settings.notification_sound])

  useEffect(() => {
    setGoogleSubSpreadsheetId(settings.google_sheets_spreadsheet_id || "")
    setGoogleMainSpreadsheetId(settings.google_sheets_main_spreadsheet_id || "")
    setGoogleStallType(settings.google_sheets_sub_stall_type || "sub")
  }, [
    settings.google_sheets_spreadsheet_id,
    settings.google_sheets_main_spreadsheet_id,
    settings.google_sheets_sub_stall_type,
  ])

  const saveNotificationSound = () => {
    updateOperationsSettings.mutate({ notification_sound: notificationSound.trim() })
  }

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

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    uploadSoundFile(file)
    event.target.value = ""
  }

  const removeNotificationSound = () => {
    updateOperationsSettings.mutate({ remove_notification_sound: true })
  }

  const saveGoogleSheetsSettings = () => {
    const payload: {
      google_sheets_spreadsheet_id: string
      google_sheets_main_spreadsheet_id: string
      google_sheets_sub_stall_type: string
      google_service_account_json?: string
    } = {
      google_sheets_spreadsheet_id: googleSubSpreadsheetId.trim(),
      google_sheets_main_spreadsheet_id: googleMainSpreadsheetId.trim(),
      google_sheets_sub_stall_type: googleStallType.trim() || "sub",
    }

    if (googleServiceAccountJson.trim()) {
      payload.google_service_account_json = googleServiceAccountJson.trim()
    }

    updateOperationsSettings.mutate(payload, {
      onSuccess: () => {
        setGoogleServiceAccountJson("")
        void fetchGoogleSyncStatus(true)
      },
    })
  }

  const clearGoogleCredential = () => {
    updateOperationsSettings.mutate(
      { google_service_account_json: "" },
      {
        onSuccess: () => {
          setGoogleServiceAccountJson("")
          void fetchGoogleSyncStatus(true)
        },
      }
    )
  }

  const fetchGoogleSyncStatus = async (silent = false) => {
    try {
      setIsTestingConnection(true)
      const { data } = await api.get("/users/settings/google-sheets-sync/")
      setConnectionOk(Boolean(data?.connection_ok))
      setSyncStatusMessage(data?.message || "Status checked")
      if (!silent) {
        if (data?.connection_ok) {
          toast.success("Google Sheets connection is healthy.")
        } else {
          toast.error(data?.message || "Google Sheets is not connected.")
        }
      }
    } catch {
      setConnectionOk(false)
      setSyncStatusMessage("Unable to check Google Sheets status")
      if (!silent) {
        toast.error("Unable to check Google Sheets status")
      }
    } finally {
      setIsTestingConnection(false)
    }
  }

  const testGoogleConnection = async () => {
    try {
      setIsTestingConnection(true)
      const { data } = await api.post("/users/settings/google-sheets-sync/", {
        action: "test_connection",
      })
      setConnectionOk(Boolean(data?.connection_ok))
      setSyncStatusMessage(data?.message || "Connection checked")
      if (data?.connection_ok) {
        toast.success("Google Sheets connected successfully")
      } else {
        toast.error(data?.message || "Google Sheets connection failed")
      }
    } catch {
      setConnectionOk(false)
      setSyncStatusMessage("Google Sheets connection failed")
      toast.error("Google Sheets connection failed")
    } finally {
      setIsTestingConnection(false)
    }
  }

  const wait = (ms: number) =>
    new Promise<void>((resolve) => {
      setTimeout(resolve, ms)
    })

  const formatHistoricalSyncProgress = (data: {
    state?: string
    processed_targets?: number
    total_targets?: number
    synced?: number
    failed?: number
    progress_pct?: number
    current_stall_id?: number | null
    current_date?: string | null
  }) => {
    const state = String(data.state || "")
    const processed = Number(data.processed_targets || 0)
    const total = Number(data.total_targets || 0)
    const synced = Number(data.synced || 0)
    const failed = Number(data.failed || 0)
    const pct = Number(data.progress_pct || 0)
    const location = data.current_stall_id && data.current_date
      ? ` · stall ${data.current_stall_id} @ ${data.current_date}`
      : ""

    if (state === "queued") {
      return "Historical sync queued..."
    }

    if (total > 0) {
      return `Syncing historical sales... ${processed}/${total} (${pct}%) · synced ${synced}, failed ${failed}${location}`
    }

    return `Syncing historical sales... synced ${synced}, failed ${failed}${location}`
  }

  const pollHistoricalSyncJob = async (
    jobId: string,
    onProgress?: (data: Record<string, unknown>) => void,
  ) => {
    const maxAttempts = 120
    let lastData: Record<string, unknown> | null = null

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const { data } = await api.get("/users/settings/google-sheets-sync/", {
        params: { job_id: jobId },
        timeout: 30000,
      })
      lastData = data

      if (onProgress) {
        onProgress(data)
      }

      const state = String(data?.state || "")
      if (state === "completed" || state === "failed") {
        return data
      }

      await wait(2500)
    }

    return {
      ...(lastData || {}),
      state: "running_timeout",
      message: "Historical sync is still running in the background.",
    }
  }

  const syncHistoricalSales = async () => {
    try {
      setIsSyncInProgress(true)
      const payload: {
        action: string
        start_date?: string
        end_date?: string
      } = {
        action: "sync_historical",
      }
      if (syncStartDate) {
        payload.start_date = format(syncStartDate, "yyyy-MM-dd")
      }
      if (syncEndDate) {
        payload.end_date = format(syncEndDate, "yyyy-MM-dd")
      }

      const startResponse = await api.post(
        "/users/settings/google-sheets-sync/",
        payload,
        { timeout: 30000 }
      )

      if (startResponse.status === 202 && startResponse.data?.job_id) {
        const jobId = String(startResponse.data.job_id)
        const loadingToastId = "google-sheets-sync-progress"
        const initialProgressMessage = formatHistoricalSyncProgress({
          state: "queued",
        })
        setSyncStatusMessage(initialProgressMessage)
        toast.loading(initialProgressMessage, {
          id: loadingToastId,
        })

        const data = await pollHistoricalSyncJob(jobId, (progressData) => {
          const progressMessage = formatHistoricalSyncProgress(progressData)
          setSyncStatusMessage(progressMessage)
          toast.loading(progressMessage, { id: loadingToastId })
        })

        if (String(data?.state) === "running_timeout") {
          const timeoutMessage = String(
            data?.message || "Historical sync is still running in the background.",
          )
          setSyncStatusMessage(timeoutMessage)
          toast.message(timeoutMessage, { id: loadingToastId })
          return
        }

        const errors = Array.isArray(data?.errors) ? data.errors : []
        const subStallErrors = errors.filter((e: string) => e.includes("stall=2"))
        const mainStallErrors = errors.filter((e: string) => e.includes("stall=1"))

        const subStatus = subStallErrors.length === 0 ? "ok" : "failed"
        const mainStatus = mainStallErrors.length === 0 ? "ok" : "failed"
        const statusDetail = `sub: ${subStatus} | main: ${mainStatus}`
        const syncSummary = `Synced: ${data?.synced ?? 0}, Failed: ${data?.failed ?? 0}`
        const message = `${statusDetail} — ${syncSummary}`

        setSyncStatusMessage(message)

        if (String(data?.state) === "failed" || !data?.ok) {
          const firstError = errors.length > 0 ? `\n${errors[0]}` : ""
          toast.error(`${message}${firstError}`, { id: loadingToastId })
        } else {
          toast.success(message, { id: loadingToastId })
        }
      } else {
        const data = startResponse.data
        const errors = Array.isArray(data?.errors) ? data.errors : []
        const subStallErrors = errors.filter((e: string) => e.includes("stall=2"))
        const mainStallErrors = errors.filter((e: string) => e.includes("stall=1"))

        const subStatus = subStallErrors.length === 0 ? "ok" : "failed"
        const mainStatus = mainStallErrors.length === 0 ? "ok" : "failed"
        const statusDetail = `sub: ${subStatus} | main: ${mainStatus}`
        const syncSummary = `Synced: ${data?.synced ?? 0}, Failed: ${data?.failed ?? 0}`
        const message = `${statusDetail} — ${syncSummary}`
        setSyncStatusMessage(message)

        if ((data?.failed ?? 0) > 0) {
          const firstError = errors.length > 0 ? `\n${errors[0]}` : ""
          toast.error(`${message}${firstError}`)
        } else {
          toast.success(message)
        }
      }

      await fetchGoogleSyncStatus(true)
    } catch (error) {
      toast.dismiss("google-sheets-sync-progress")
      let errorMessage = "Historical sync failed"
      let errorDetail = ""

      if ((error as { response?: { data?: Record<string, unknown> } })?.response?.data) {
        const data = (error as { response: { data: Record<string, unknown> } }).response.data
        errorMessage = String(data.message || data.detail || errorMessage)
        errorDetail = String(
          data.detail || (Array.isArray(data.errors) && data.errors[0]) || ""
        )
      } else if ((error as { message?: string })?.message) {
        errorMessage = String((error as { message: string }).message)
      }

      const fullMessage = errorDetail ? `${errorMessage}\n${errorDetail}` : errorMessage
      setSyncStatusMessage(`Error: ${errorMessage}`)
      toast.error(fullMessage)
      console.error("Sync error:", error)
    } finally {
      setIsSyncInProgress(false)
    }
  }

  const hasGoogleConfigChanged =
    googleSubSpreadsheetId.trim() !== (settings.google_sheets_spreadsheet_id || "").trim() ||
    googleMainSpreadsheetId.trim() !== (settings.google_sheets_main_spreadsheet_id || "").trim() ||
    googleStallType.trim() !== (settings.google_sheets_sub_stall_type || "sub").trim() ||
    Boolean(googleServiceAccountJson.trim())

  useEffect(() => {
    void fetchGoogleSyncStatus(true)
  }, [])

  return (
    <div className="space-y-3">
      <div className="rounded-lg border bg-background/70 p-3 sm:p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-md border bg-muted/40 p-1.5">
              <Wrench className="size-4 shrink-0 text-muted-foreground" />
            </div>
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Maintenance Mode</Label>
              <p className="text-xs text-muted-foreground">
                Non-admin users see a maintenance screen while admins keep full access.
              </p>
            </div>
          </div>
          <Switch
            checked={settings.maintenance_mode}
            disabled={updateOperationsSettings.isPending}
            onCheckedChange={(checked) =>
              updateOperationsSettings.mutate({ maintenance_mode: checked })
            }
          />
        </div>
      </div>

      <div className="rounded-lg border bg-background/70 p-3 sm:p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-md border bg-muted/40 p-1.5">
              <PackageCheck className="size-4 shrink-0 text-muted-foreground" />
            </div>
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Check Stock on Sale</Label>
              <p className="text-xs text-muted-foreground">
                Validate and deduct stock when sales are created or edited.
              </p>
            </div>
          </div>
          <Switch
            checked={settings.check_stock_on_sale}
            disabled={updateOperationsSettings.isPending}
            onCheckedChange={(checked) =>
              updateOperationsSettings.mutate({ check_stock_on_sale: checked })
            }
          />
        </div>
      </div>

      <div className="rounded-lg border bg-background/70 p-3 sm:p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-md border bg-muted/40 p-1.5">
            <BellRing className="size-4 shrink-0 text-muted-foreground" />
          </div>
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Push Notification Sound</Label>
            <p className="text-xs text-muted-foreground">
              Upload an audio file, use an existing path, or remove the current sound.
            </p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <Input
            value={notificationSound}
            disabled={updateOperationsSettings.isPending}
            onChange={(e) => setNotificationSound(e.target.value)}
            placeholder="/media/notification_sounds/your-sound.mp3"
          />
          <Button
            type="button"
            variant="outline"
            disabled={updateOperationsSettings.isPending || !hasSoundChanged}
            onClick={saveNotificationSound}
          >
            Save Path
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          aria-label="Upload push notification sound"
          title="Upload push notification sound"
          onChange={handleFileChange}
        />

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={updateOperationsSettings.isPending}
            onClick={handleUploadClick}
            className="gap-2"
          >
            <Upload className="size-4" />
            Upload Sound
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={updateOperationsSettings.isPending || !notificationSound}
            onClick={removeNotificationSound}
            className="gap-2 text-destructive hover:text-destructive"
          >
            <Trash2 className="size-4" />
            Remove
          </Button>

          {notificationSound && (
            <span className="inline-flex items-center gap-1.5 rounded-md border bg-muted/40 px-2 py-1 text-xs text-muted-foreground">
              <Volume2 className="size-3.5" />
              {soundFileName}
            </span>
          )}
        </div>

        {notificationSound && (
          <audio controls preload="none" className="h-8 w-full">
            <source src={notificationSound} />
          </audio>
        )}
      </div>

        <div className="rounded-lg border bg-background/70 p-3 sm:p-4 space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-md border bg-muted/40 p-1.5">
                <Sheet className="size-4 shrink-0 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <Label className="text-base font-semibold tracking-tight">Google Sheets Sales Sync</Label>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  Configure service account credentials and destination sheets for parts or services sales sync.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={settings.google_sheets_sync_enabled
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : "border-muted-foreground/30 text-muted-foreground"
                }
              >
                <BadgeCheck className="mr-1.5 size-3.5" />
                Sync: {settings.google_sheets_sync_enabled ? "Enabled" : "Disabled"}
              </Badge>
              <Badge
                variant="outline"
                className={settings.google_service_account_configured
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : "border-muted-foreground/30 text-muted-foreground"
                }
              >
                <KeyRound className="mr-1.5 size-3.5" />
                Credential: {settings.google_service_account_configured ? "Configured" : "Not configured"}
              </Badge>
              <Badge
                variant="outline"
                className={connectionOk === true
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : connectionOk === false
                    ? "border-destructive/40 bg-destructive/10 text-destructive"
                    : "border-muted-foreground/30 text-muted-foreground"
                }
              >
                <BadgeCheck className="mr-1.5 size-3.5" />
                Connection: {connectionOk === null ? "Not checked" : connectionOk ? "Connected" : "Not connected"}
              </Badge>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Sub Stall Monthly Spreadsheet ID</Label>
              <Input
                value={googleSubSpreadsheetId}
                disabled={updateOperationsSettings.isPending}
                onChange={(e) => setGoogleSubSpreadsheetId(e.target.value)}
                placeholder="1AbCDefGhIJkLmNoPqRstUvWxyz..."
                className="bg-background"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Main Stall Monthly Spreadsheet ID</Label>
              <Input
                value={googleMainSpreadsheetId}
                disabled={updateOperationsSettings.isPending}
                onChange={(e) => setGoogleMainSpreadsheetId(e.target.value)}
                placeholder="1AbCDefGhIJkLmNoPqRstUvWxyz..."
                className="bg-background"
              />
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="grid gap-2">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Sync Scope</Label>
              <Select
                value={googleStallType}
                onValueChange={setGoogleStallType}
                disabled={updateOperationsSettings.isPending}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Choose sync scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sub">Sub Stall (Parts)</SelectItem>
                  <SelectItem value="main">Main Stall (Services)</SelectItem>
                  <SelectItem value="both">Both Stalls</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              The sheet tab is generated automatically per day.
            </div>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Service Account JSON</Label>
            </div>
            <Textarea
              value={googleServiceAccountJson}
              disabled={updateOperationsSettings.isPending}
              onChange={(e) => setGoogleServiceAccountJson(e.target.value)}
              placeholder='Paste JSON (starts with { "type": "service_account", ... })'
              className="min-h-32 bg-background font-mono text-xs"
            />

            {syncStatusMessage && (
              <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
                <span className="text-xs font-medium text-muted-foreground">Status:</span>
                <span className="text-xs text-foreground">{syncStatusMessage}</span>
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <DatePicker
              standalone
              label="Sync Start Date (optional)"
              placeholder="Select start date"
              disabled={updateOperationsSettings.isPending || isSyncInProgress}
              field={{ value: syncStartDate, onChange: setSyncStartDate }}
            />
            <DatePicker
              standalone
              label="Sync End Date (optional)"
              placeholder="Select end date"
              disabled={updateOperationsSettings.isPending || isSyncInProgress}
              field={{ value: syncEndDate, onChange: setSyncEndDate }}
            />
          </div>

          <div className="rounded-md border bg-background/70 p-3">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={updateOperationsSettings.isPending || isTestingConnection}
                onClick={testGoogleConnection}
                className="gap-2"
              >
                <RefreshCcw className="size-4" />
                Test Connection
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={updateOperationsSettings.isPending || isSyncInProgress}
                onClick={syncHistoricalSales}
                className="gap-2"
              >
                <CalendarClock className="size-4" />
                {isSyncInProgress ? "Syncing..." : "Sync Previous Sales"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={
                  updateOperationsSettings.isPending ||
                  !settings.google_service_account_configured
                }
                onClick={clearGoogleCredential}
                className="gap-2"
              >
                <ShieldOff className="size-4" />
                Clear Credential
              </Button>
              <Button
                type="button"
                variant="default"
                disabled={updateOperationsSettings.isPending || !hasGoogleConfigChanged}
                onClick={saveGoogleSheetsSettings}
                className="gap-2"
              >
                <Save className="size-4" />
                Save Google Sync Settings
              </Button>
            </div>
          </div>
        </div>
    </div>
  )
}
