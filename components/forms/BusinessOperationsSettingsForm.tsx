"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import api from "@/lib/utils/api"
import { useOperationsSettingsMutations } from "@/lib/mutations/useOperationsSettingsMutations"
import { SystemSettings } from "@/lib/queries/useSystemSettings"
import { BellRing, PackageCheck, RefreshCcw, Sheet, Trash2, Upload, Volume2, Wrench } from "lucide-react"
import { toast } from "sonner"

interface Props {
  settings: SystemSettings
}

export function BusinessOperationsSettingsForm({ settings }: Props) {
  const { updateOperationsSettings } = useOperationsSettingsMutations()
  const [notificationSound, setNotificationSound] = useState(settings.notification_sound)
  const [googleSpreadsheetId, setGoogleSpreadsheetId] = useState(
    settings.google_sheets_spreadsheet_id || ""
  )
  const [googleWorksheetName, setGoogleWorksheetName] = useState(
    settings.google_sheets_worksheet_name || "Sub Stall Sales"
  )
  const [googleStallType, setGoogleStallType] = useState(
    settings.google_sheets_sub_stall_type || "sub"
  )
  const [googleServiceAccountJson, setGoogleServiceAccountJson] = useState("")
  const [syncStatusMessage, setSyncStatusMessage] = useState("")
  const [connectionOk, setConnectionOk] = useState<boolean | null>(null)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [isSyncingHistorical, setIsSyncingHistorical] = useState(false)
  const [syncStartDate, setSyncStartDate] = useState("")
  const [syncEndDate, setSyncEndDate] = useState("")
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setNotificationSound(settings.notification_sound)
  }, [settings.notification_sound])

  useEffect(() => {
    setGoogleSpreadsheetId(settings.google_sheets_spreadsheet_id || "")
    setGoogleWorksheetName(settings.google_sheets_worksheet_name || "Sub Stall Sales")
    setGoogleStallType(settings.google_sheets_sub_stall_type || "sub")
  }, [
    settings.google_sheets_spreadsheet_id,
    settings.google_sheets_worksheet_name,
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
      google_sheets_worksheet_name: string
      google_sheets_sub_stall_type: string
      google_service_account_json?: string
    } = {
      google_sheets_spreadsheet_id: googleSpreadsheetId.trim(),
      google_sheets_worksheet_name: googleWorksheetName.trim() || "Sub Stall Sales",
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

  const syncHistoricalSales = async () => {
    try {
      setIsSyncingHistorical(true)
      const payload: {
        action: string
        start_date?: string
        end_date?: string
      } = {
        action: "sync_historical",
      }
      if (syncStartDate) {
        payload.start_date = syncStartDate
      }
      if (syncEndDate) {
        payload.end_date = syncEndDate
      }
      const { data } = await api.post("/users/settings/google-sheets-sync/", {
        ...payload,
      })
      const message = `${data?.message || "Historical sync completed"} (Synced: ${data?.synced ?? 0}, Failed: ${data?.failed ?? 0})`
      setSyncStatusMessage(message)
      if ((data?.failed ?? 0) > 0) {
        toast.error(message)
      } else {
        toast.success(message)
      }
      await fetchGoogleSyncStatus(true)
    } catch {
      setSyncStatusMessage("Historical sync failed")
      toast.error("Historical sync failed")
    } finally {
      setIsSyncingHistorical(false)
    }
  }

  const hasGoogleConfigChanged =
    googleSpreadsheetId.trim() !== (settings.google_sheets_spreadsheet_id || "").trim() ||
    googleWorksheetName.trim() !==
      (settings.google_sheets_worksheet_name || "Sub Stall Sales").trim() ||
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

        <div className="rounded-lg border bg-background/70 p-3 sm:p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-md border bg-muted/40 p-1.5">
                <Sheet className="size-4 shrink-0 text-muted-foreground" />
              </div>
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Google Sheets Sales Sync</Label>
                <p className="text-xs text-muted-foreground">
                  Configure service account credentials and destination sheet for sub-stall sales sync.
                </p>
              </div>
            </div>
            <Switch
              checked={settings.google_sheets_sync_enabled}
              disabled={updateOperationsSettings.isPending}
              onCheckedChange={(checked) =>
                updateOperationsSettings.mutate({ google_sheets_sync_enabled: checked })
              }
            />
          </div>

          <div className="grid gap-2">
            <Label className="text-xs text-muted-foreground">Spreadsheet ID</Label>
            <Input
              value={googleSpreadsheetId}
              disabled={updateOperationsSettings.isPending}
              onChange={(e) => setGoogleSpreadsheetId(e.target.value)}
              placeholder="1AbCDefGhIJkLmNoPqRstUvWxyz..."
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label className="text-xs text-muted-foreground">Worksheet Name</Label>
              <Input
                value={googleWorksheetName}
                disabled={updateOperationsSettings.isPending}
                onChange={(e) => setGoogleWorksheetName(e.target.value)}
                placeholder="Sub Stall Sales"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs text-muted-foreground">Stall Type Filter</Label>
              <Input
                value={googleStallType}
                disabled={updateOperationsSettings.isPending}
                onChange={(e) => setGoogleStallType(e.target.value)}
                placeholder="sub"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="text-xs text-muted-foreground">Service Account JSON</Label>
            <Textarea
              value={googleServiceAccountJson}
              disabled={updateOperationsSettings.isPending}
              onChange={(e) => setGoogleServiceAccountJson(e.target.value)}
              placeholder='Paste JSON (starts with { "type": "service_account", ... })'
              className="min-h-32 font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Current credential status: {settings.google_service_account_configured ? "Configured" : "Not configured"}
            </p>
            {syncStatusMessage && (
              <p
                className={`text-xs ${
                  connectionOk === true
                    ? "text-emerald-600"
                    : connectionOk === false
                      ? "text-destructive"
                      : "text-muted-foreground"
                }`}
              >
                Connection status: {syncStatusMessage}
              </p>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label className="text-xs text-muted-foreground">Sync Start Date (optional)</Label>
              <Input
                type="date"
                value={syncStartDate}
                disabled={updateOperationsSettings.isPending || isSyncingHistorical}
                onChange={(e) => setSyncStartDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs text-muted-foreground">Sync End Date (optional)</Label>
              <Input
                type="date"
                value={syncEndDate}
                disabled={updateOperationsSettings.isPending || isSyncingHistorical}
                onChange={(e) => setSyncEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <div className="flex items-center gap-2">
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
                disabled={updateOperationsSettings.isPending || isSyncingHistorical}
                onClick={syncHistoricalSales}
              >
                Sync Previous Sales
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={
                  updateOperationsSettings.isPending ||
                  !settings.google_service_account_configured
                }
                onClick={clearGoogleCredential}
              >
                Clear Credential
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={updateOperationsSettings.isPending || !hasGoogleConfigChanged}
                onClick={saveGoogleSheetsSettings}
              >
                Save Google Sync Settings
              </Button>
            </div>
          </div>
        </div>
    </div>
  )
}
