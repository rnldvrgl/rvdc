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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import api from "@/lib/utils/api"
import { useQuery } from "@tanstack/react-query"
import {
  AlertTriangle,
  Box,
  ChevronDown,
  ChevronUp,
  Database,
  FileText,
  FolderOpen,
  HardDrive,
  Loader2,
  MemoryStick,
  RefreshCw,
  ScrollText,
  Server,
  Trash2,
  Zap,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface DiskUsage {
  total_gb: number
  used_gb: number
  free_gb: number
  percent_used: number
}

interface MemoryUsage {
  total_gb: number
  used_gb: number
  available_gb: number
  percent_used: number
}

interface DockerEntry {
  type: string
  size: string
  reclaimable: string
}

interface ContainerInfo {
  name: string
  status: string
  state: string
  size: string
}

interface LargeFile {
  path: string
  size_mb: number
}

interface MaintenanceData {
  disk: DiskUsage
  memory: MemoryUsage | null
  docker: DockerEntry[] | null
  containers: ContainerInfo[] | null
  large_media_files: LargeFile[]
  media_total_mb: number
}

interface CleanupResult {
  task: string
  success: boolean
  output?: string
  error?: string
}

interface CleanupResponse {
  success: boolean
  action: string
  results: CleanupResult[]
}

interface LogsResponse {
  success: boolean
  action: string
  container: string
  logs: string
  error?: string
}

const CONTAINER_LABELS: Record<string, { label: string; icon: typeof Server }> =
  {
    "rvdc_backend-api-1": { label: "API Server", icon: Server },
    "rvdc_backend-redis-1": { label: "Redis", icon: Database },
    "rvdc_backend-db-1": { label: "PostgreSQL", icon: Database },
  }

export function ServerMaintenanceCard() {
  const [runningAction, setRunningAction] = useState<string | null>(null)
  const [logsDialog, setLogsDialog] = useState<{
    open: boolean
    container: string
    logs: string
    loading: boolean
  }>({ open: false, container: "", logs: "", loading: false })
  const [showMediaFiles, setShowMediaFiles] = useState(false)

  const { data, isLoading, refetch } = useQuery<MaintenanceData>({
    queryKey: ["server-maintenance"],
    queryFn: async () => {
      const res = await api.get("/users/maintenance/")
      return res.data
    },
    refetchInterval: 60000,
  })

  const runCleanup = async (
    action: string,
    label: string,
    extra?: Record<string, string>,
  ) => {
    setRunningAction(action)
    try {
      const res = await api.post<CleanupResponse>("/users/maintenance/", {
        action,
        ...extra,
      })
      const { results } = res.data

      const failed = results.filter((r) => !r.success)
      if (failed.length === 0) {
        toast.success(`${label} completed successfully`)
      } else {
        toast.warning(
          `${label} completed with issues: ${failed.map((f) => f.error || f.task).join(", ")}`,
        )
      }

      results.forEach((r) => {
        if (r.success && r.output) {
          toast.info(`${r.task}: ${r.output}`, { duration: 6000 })
        }
      })

      refetch()
    } catch {
      toast.error(`${label} failed. Check server logs.`)
    } finally {
      setRunningAction(null)
    }
  }

  const viewLogs = async (container: string) => {
    setLogsDialog({ open: true, container, logs: "", loading: true })
    try {
      const res = await api.post<LogsResponse>("/users/maintenance/", {
        action: "container_logs",
        container,
        lines: 200,
      })
      setLogsDialog((prev) => ({
        ...prev,
        logs: res.data.logs || "No logs available",
        loading: false,
      }))
    } catch {
      setLogsDialog((prev) => ({
        ...prev,
        logs: "Failed to fetch logs",
        loading: false,
      }))
    }
  }

  const getUsageColor = (percent: number) => {
    if (percent >= 90) return "text-red-500"
    if (percent >= 75) return "text-yellow-500"
    return "text-green-500"
  }

  const getBarColor = (percent: number) => {
    if (percent >= 90) return "bg-red-500"
    if (percent >= 75) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getStateColor = (state: string) => {
    if (state === "running") return "bg-green-500"
    if (state === "restarting") return "bg-yellow-500"
    return "bg-red-500"
  }

  const UsageBar = ({
    label,
    icon: Icon,
    percent,
    detail,
    subDetail,
  }: {
    label: string
    icon: typeof HardDrive
    percent: number
    detail: string
    subDetail: string
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Icon className="size-4" />
          {label}
        </div>
        <span
          className={`text-sm font-semibold ${getUsageColor(percent)}`}
        >
          {percent.toFixed(1)}%
        </span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${getBarColor(percent)}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{detail}</span>
        <span>{subDetail}</span>
      </div>
    </div>
  )

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-blue-500" />
              <CardTitle>Server Maintenance</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw
                className={`size-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
          <CardDescription>
            Monitor server resources, Docker containers, and run maintenance
            tasks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading server stats...
            </div>
          ) : data?.disk ? (
            <>
              {/* Resource Usage */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <UsageBar
                  label="Disk Usage"
                  icon={HardDrive}
                  percent={data.disk.percent_used}
                  detail={`${data.disk.used_gb.toFixed(1)} GB used of ${data.disk.total_gb.toFixed(1)} GB`}
                  subDetail={`${data.disk.free_gb.toFixed(1)} GB free`}
                />
                {data.memory && (
                  <UsageBar
                    label="Memory (RAM)"
                    icon={MemoryStick}
                    percent={data.memory.percent_used}
                    detail={`${data.memory.used_gb.toFixed(2)} GB used of ${data.memory.total_gb.toFixed(2)} GB`}
                    subDetail={`${data.memory.available_gb.toFixed(2)} GB available`}
                  />
                )}
              </div>

              {(data.disk.percent_used >= 85 ||
                (data.memory && data.memory.percent_used >= 85)) && (
                <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400 rounded-md border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950 p-3">
                  <AlertTriangle className="size-4 shrink-0" />
                  {data.disk.percent_used >= 85 && data.memory && data.memory.percent_used >= 85
                    ? "Disk and memory usage are high. Consider running a cleanup or restarting services."
                    : data.disk.percent_used >= 85
                      ? "Disk usage is high. Consider running a cleanup."
                      : "Memory usage is high. Consider restarting services."}
                </div>
              )}

              {/* Docker Resource Usage */}
              {data.docker && data.docker.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Box className="size-4" />
                      Docker Resource Usage
                    </h4>
                    <div className="grid gap-2">
                      {data.docker.map((entry) => (
                        <div
                          key={entry.type}
                          className="flex items-center justify-between rounded-md border p-3 text-sm"
                        >
                          <span className="font-medium">{entry.type}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-muted-foreground">
                              {entry.size}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {entry.reclaimable} reclaimable
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Container Status */}
              {data.containers && data.containers.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Server className="size-4" />
                      Container Status
                    </h4>
                    <div className="grid gap-2">
                      {data.containers.map((container) => {
                        const info = CONTAINER_LABELS[container.name]
                        return (
                          <div
                            key={container.name}
                            className="flex items-center justify-between rounded-md border p-3 text-sm"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`size-2.5 rounded-full ${getStateColor(container.state)}`}
                              />
                              <div>
                                <span className="font-medium">
                                  {info?.label || container.name}
                                </span>
                                <p className="text-xs text-muted-foreground">
                                  {container.status}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {container.size && (
                                <span className="text-xs text-muted-foreground hidden sm:inline">
                                  {container.size}
                                </span>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => viewLogs(container.name)}
                              >
                                <ScrollText className="size-3.5 mr-1" />
                                Logs
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                disabled={runningAction !== null}
                                onClick={() =>
                                  runCleanup(
                                    "restart_containers",
                                    `Restart ${info?.label || container.name}`,
                                    { container: container.name },
                                  )
                                }
                              >
                                {runningAction === "restart_containers" ? (
                                  <Loader2 className="size-3.5 mr-1 animate-spin" />
                                ) : (
                                  <RefreshCw className="size-3.5 mr-1" />
                                )}
                                Restart
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* Media Files */}
              {data.large_media_files && data.large_media_files.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <FolderOpen className="size-4" />
                        Media Storage
                        <Badge variant="secondary" className="text-xs">
                          {data.media_total_mb > 1024
                            ? `${(data.media_total_mb / 1024).toFixed(1)} GB`
                            : `${data.media_total_mb.toFixed(0)} MB`}{" "}
                          total
                        </Badge>
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setShowMediaFiles(!showMediaFiles)}
                      >
                        {showMediaFiles ? (
                          <>
                            <ChevronUp className="size-3.5 mr-1" />
                            Hide
                          </>
                        ) : (
                          <>
                            <ChevronDown className="size-3.5 mr-1" />
                            {data.large_media_files.length} large files
                          </>
                        )}
                      </Button>
                    </div>
                    {showMediaFiles && (
                      <div className="max-h-48 overflow-y-auto rounded-md border">
                        {data.large_media_files.map((file, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between px-3 py-2 text-xs border-b last:border-b-0"
                          >
                            <span className="text-muted-foreground truncate mr-4 max-w-[70%]">
                              {file.path}
                            </span>
                            <span className="font-medium whitespace-nowrap">
                              {file.size_mb.toFixed(1)} MB
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Cleanup Actions */}
              <Separator />
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Cleanup Actions</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Button
                    variant="outline"
                    className="justify-start gap-2"
                    disabled={runningAction !== null}
                    onClick={() => runCleanup("docker_prune", "Docker Cleanup")}
                  >
                    {runningAction === "docker_prune" ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                    Docker Cleanup
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start gap-2"
                    disabled={runningAction !== null}
                    onClick={() => runCleanup("log_cleanup", "Log Cleanup")}
                  >
                    {runningAction === "log_cleanup" ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <FileText className="size-4" />
                    )}
                    Log Cleanup
                  </Button>
                  <Button
                    variant="destructive"
                    className="justify-start gap-2"
                    disabled={runningAction !== null}
                    onClick={() => runCleanup("full_cleanup", "Full Cleanup")}
                  >
                    {runningAction === "full_cleanup" ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Zap className="size-4" />
                    )}
                    Full Cleanup
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  <strong>Docker Cleanup:</strong> Prunes unused containers,
                  networks, and images older than 7 days.{" "}
                  <strong>Log Cleanup:</strong> Truncates cron log files over
                  5MB. <strong>Full Cleanup:</strong> Runs both.
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Failed to load server stats
            </div>
          )}
        </CardContent>
      </Card>

      {/* Container Logs Dialog */}
      <Dialog
        open={logsDialog.open}
        onOpenChange={(open) =>
          setLogsDialog((prev) => ({ ...prev, open }))
        }
      >
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScrollText className="size-4" />
              {CONTAINER_LABELS[logsDialog.container]?.label ||
                logsDialog.container}{" "}
              Logs
            </DialogTitle>
          </DialogHeader>
          {logsDialog.loading ? (
            <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Fetching logs...
            </div>
          ) : (
            <pre className="bg-muted rounded-md p-4 text-xs leading-relaxed overflow-auto max-h-[60vh] whitespace-pre-wrap break-all font-mono">
              {logsDialog.logs}
            </pre>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
