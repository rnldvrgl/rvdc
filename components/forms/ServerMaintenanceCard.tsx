"use client"

import { AdminPasswordDialog } from "@/components/custom/shared/AdminPasswordDialog"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useNotificationWebSocket } from "@/lib/hooks/useNotificationWebSocket"
import usePendingActionsStore from "@/lib/store/usePendingActionsStore"
import api from "@/lib/utils/api"
import { useQuery } from "@tanstack/react-query"
import {
  AlertTriangle,
  Box,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Database,
  Download,
  FileText,
  FolderOpen,
  HardDrive,
  Info,
  Loader2,
  MemoryStick,
  MessageSquareX,
  Package,
  Play,
  RefreshCw,
  ScrollText,
  Server,
  Shield,
  Terminal,
  Trash2,
  Wrench,
  Zap,
} from "lucide-react"
import { useCallback, useRef, useState } from "react"
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

interface CronJob {
  id: string
  schedule: string
  description: string
  log_file: string
  category: string
  last_status: "success" | "error" | "unknown" | "no_log"
  log_size_kb: number
  last_modified: string | null
}

interface ManagementCommand {
  id: string
  label: string
  description: string
  app: string
  category: string
  destructive: boolean
  args?: string[]
}

interface MaintenanceData {
  disk: DiskUsage
  memory: MemoryUsage | null
  docker: DockerEntry[] | null
  containers: ContainerInfo[] | null
  large_media_files: LargeFile[]
  media_total_mb: number
  cron_jobs: CronJob[]
  management_commands: ManagementCommand[]
}

interface CleanupResult {
  task: string
  success: boolean
  output?: string
  error?: string
}

interface LogsResponse {
  success: boolean
  action: string
  container?: string
  log_file?: string
  logs: string
  error?: string
}

interface BackupFile {
  filename: string
  size_mb: number
  created_at: string
}

const CONTAINER_LABELS: Record<string, { label: string; icon: typeof Server }> =
  {
    "rvdc_backend-api-1": { label: "API Server", icon: Server },
    "rvdc_backend-redis-1": { label: "Redis", icon: Database },
    "rvdc_backend-db-1": { label: "PostgreSQL", icon: Database },
  }

const CLEANUP_ACTIONS = [
  {
    id: "docker_prune",
    label: "Docker Cleanup",
    description:
      "Prune unused containers, networks, and images older than 7 days to free up disk space.",
    icon: Package,
    variant: "outline" as const,
    destructive: false,
  },
  {
    id: "log_cleanup",
    label: "Log Cleanup",
    description:
      "Truncate cron and application log files that have grown over 5MB.",
    icon: FileText,
    variant: "outline" as const,
    destructive: false,
  },
  {
    id: "full_cleanup",
    label: "Full System Cleanup",
    description:
      "Runs Docker prune and log cleanup together. Recommended when disk usage is high.",
    icon: Zap,
    variant: "destructive" as const,
    destructive: true,
  },
]

export function ServerMaintenanceCard() {
  const [runningAction, setRunningAction] = useState<string | null>(null)
  const maintenanceActionIdRef = useRef<string | null>(null)
  const addPendingAction = usePendingActionsStore((s) => s.addAction)
  const removePendingAction = usePendingActionsStore((s) => s.removeAction)
  const [pendingAuthAction, setPendingAuthAction] = useState<{
    type: "cleanup" | "command" | "install_cron" | "delete_chats"
    cleanup?: (typeof CLEANUP_ACTIONS)[number]
    command?: ManagementCommand
  } | null>(null)
  const [logsDialog, setLogsDialog] = useState<{
    open: boolean
    title: string
    logs: string
    loading: boolean
  }>({ open: false, title: "", logs: "", loading: false })
  const [showMediaFiles, setShowMediaFiles] = useState(false)
  const [backups, setBackups] = useState<BackupFile[]>([])
  const [backupsLoading, setBackupsLoading] = useState(false)
  const [deletingBackup, setDeletingBackup] = useState<string | null>(null)

  const { data, isLoading, refetch } = useQuery<MaintenanceData>({
    queryKey: ["server-maintenance"],
    queryFn: async () => {
      const res = await api.get("/users/maintenance/")
      return res.data
    },
    refetchInterval: 60000,
  })

  const loadBackups = useCallback(async () => {
    setBackupsLoading(true)
    try {
      const res = await api.post("/users/maintenance/", {
        action: "list_backups",
      })
      setBackups(res.data.backups || [])
    } catch {
      toast.error("Failed to load backups")
    } finally {
      setBackupsLoading(false)
    }
  }, [])

  // Listen for maintenance results via WebSocket
  const handleMaintenanceResult = useCallback(
    (wsData: {
      success: boolean
      action: string
      title: string
      message: string
      results: CleanupResult[]
    }) => {
      setRunningAction(null)
      if (maintenanceActionIdRef.current) {
        removePendingAction(maintenanceActionIdRef.current)
        maintenanceActionIdRef.current = null
      }

      if (wsData.success) {
        toast.success(wsData.title, {
          description: wsData.message,
          duration: 6000,
        })
      } else {
        toast.error(wsData.title, {
          description: wsData.message,
          duration: 8000,
        })
      }

      // Refresh stats after cleanup
      refetch()

      // Refresh backup list after a backup action
      if (wsData.action === "db_backup") {
        loadBackups()
      }
    },
    [refetch, loadBackups, removePendingAction],
  )

  useNotificationWebSocket({
    onMaintenanceResult: handleMaintenanceResult,
  })

  const runCleanup = async (
    action: string,
    label: string,
    extra?: Record<string, string>,
  ) => {
    setRunningAction(action)
    const actionId = addPendingAction("maintenance", label)
    maintenanceActionIdRef.current = actionId
    try {
      await api.post("/users/maintenance/", {
        action,
        ...extra,
      })
      // 202 Accepted — task is running in background
      toast.info(`${label} started`, {
        description: "You'll be notified when it completes.",
      })
    } catch (err) {
      const message =
        err instanceof Error && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data
              ?.error
          : undefined
      toast.error(message || `Failed to start ${label}. Check server logs.`)
      setRunningAction(null)
      removePendingAction(actionId)
      maintenanceActionIdRef.current = null
    }
  }

  const viewLogs = async (container: string) => {
    const label = CONTAINER_LABELS[container]?.label || container
    setLogsDialog({
      open: true,
      title: `${label} Logs`,
      logs: "",
      loading: true,
    })
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

  const viewCronLog = async (logFile: string, jobId: string) => {
    setLogsDialog({
      open: true,
      title: `${jobId} Log`,
      logs: "",
      loading: true,
    })
    try {
      const res = await api.post<LogsResponse>("/users/maintenance/", {
        action: "view_cron_log",
        log_file: logFile,
      })
      setLogsDialog((prev) => ({
        ...prev,
        logs: res.data.logs || "No logs available",
        loading: false,
      }))
    } catch {
      setLogsDialog((prev) => ({
        ...prev,
        logs: "Failed to fetch log",
        loading: false,
      }))
    }
  }

  const runCommand = async (
    command: ManagementCommand,
    credentials?: { admin_username: string; admin_password: string },
  ) => {
    setRunningAction(`cmd_${command.id}`)
    try {
      await api.post("/users/maintenance/", {
        action: "run_command",
        command: command.id,
        ...credentials,
      })
      toast.info(`${command.label} started`, {
        description: "You'll be notified when it completes.",
      })
    } catch (err) {
      const message =
        err instanceof Error && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data
              ?.error
          : undefined
      toast.error(
        message || `Failed to start ${command.label}. Check server logs.`,
      )
      setRunningAction(null)
    }
  }

  const createBackup = async () => {
    setRunningAction("db_backup")
    const actionId = addPendingAction("maintenance", "Database Backup")
    maintenanceActionIdRef.current = actionId
    try {
      await api.post("/users/maintenance/", { action: "db_backup" })
      toast.info("Database backup started", {
        description: "You'll be notified when it completes.",
      })
    } catch (err) {
      const message =
        err instanceof Error && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data
              ?.error
          : undefined
      toast.error(message || "Failed to start backup.")
      setRunningAction(null)
      removePendingAction(actionId)
      maintenanceActionIdRef.current = null
    }
  }

  const downloadBackup = async (filename: string) => {
    try {
      const res = await api.get(
        `/users/maintenance/backups/${encodeURIComponent(filename)}/`,
        { responseType: "blob" },
      )
      const url = window.URL.createObjectURL(res.data)
      const link = document.createElement("a")
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error("Failed to download backup")
    }
  }

  const deleteBackup = async (filename: string) => {
    setDeletingBackup(filename)
    try {
      await api.post("/users/maintenance/", {
        action: "delete_backup",
        filename,
      })
      setBackups((prev) => prev.filter((b) => b.filename !== filename))
      toast.success(`Deleted ${filename}`)
    } catch {
      toast.error("Failed to delete backup")
    } finally {
      setDeletingBackup(null)
    }
  }

  const getUsageColor = (percent: number) => {
    if (percent >= 90) return "text-red-500"
    if (percent >= 75) return "text-yellow-500"
    return "text-emerald-500"
  }

  const getBarColor = (percent: number) => {
    if (percent >= 90) return "bg-red-500"
    if (percent >= 75) return "bg-yellow-500"
    return "bg-emerald-500"
  }

  const getBarBgColor = (percent: number) => {
    if (percent >= 90) return "bg-red-500/10"
    if (percent >= 75) return "bg-yellow-500/10"
    return "bg-emerald-500/10"
  }

  const getStateColor = (state: string) => {
    if (state === "running") return "bg-emerald-500"
    if (state === "restarting") return "bg-yellow-500"
    return "bg-red-500"
  }

  const getStateBadgeVariant = (state: string) => {
    if (state === "running") return "default" as const
    if (state === "restarting") return "secondary" as const
    return "destructive" as const
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
    <div
      className={`rounded-xl border p-4 space-y-3 ${getBarBgColor(percent)}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={`rounded-lg p-2 ${percent >= 90 ? "bg-red-500/15" : percent >= 75 ? "bg-yellow-500/15" : "bg-emerald-500/15"}`}
          >
            <Icon
              className={`size-4 ${percent >= 90 ? "text-red-500" : percent >= 75 ? "text-yellow-500" : "text-emerald-500"}`}
            />
          </div>
          <span className="text-sm font-semibold">{label}</span>
        </div>
        <span className={`text-lg font-bold ${getUsageColor(percent)}`}>
          {percent.toFixed(1)}%
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted/50 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getBarColor(percent)}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{detail}</span>
        <span>{subDetail}</span>
      </div>
    </div>
  )

  const hasHighUsage =
    data?.disk &&
    (data.disk.percent_used >= 85 ||
      (data.memory && data.memory.percent_used >= 85))

  return (
    <TooltipProvider>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2">
                <Shield className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Server Maintenance</CardTitle>
                <CardDescription className="mt-0.5">
                  Monitor resources, containers &amp; run maintenance
                </CardDescription>
              </div>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => refetch()}
                  disabled={isLoading}
                >
                  <RefreshCw
                    className={`size-4 ${isLoading ? "animate-spin" : ""}`}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh stats</TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
              <Loader2 className="size-6 animate-spin" />
              <span className="text-sm">Loading server stats...</span>
            </div>
          ) : data?.disk ? (
            <Tabs
              defaultValue="overview"
              className="w-full"
            >
              <TabsList className="w-full grid grid-cols-5 mb-6">
                <TabsTrigger value="overview">
                  <HardDrive className="size-3.5 mr-1.5" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="containers">
                  <Server className="size-3.5 mr-1.5" />
                  Containers
                </TabsTrigger>
                <TabsTrigger value="scheduled">
                  <Calendar className="size-3.5 mr-1.5" />
                  Scheduled
                </TabsTrigger>
                <TabsTrigger value="actions">
                  <Zap className="size-3.5 mr-1.5" />
                  Actions
                  {hasHighUsage && (
                    <span className="ml-1.5 size-2 rounded-full bg-yellow-500 animate-pulse" />
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="backups"
                  onClick={() => {
                    if (backups.length === 0 && !backupsLoading) loadBackups()
                  }}
                >
                  <Database className="size-3.5 mr-1.5" />
                  Backups
                </TabsTrigger>
              </TabsList>

              {/* ===== OVERVIEW TAB ===== */}
              <TabsContent
                value="overview"
                className="space-y-5 mt-0"
              >
                {/* Warning Banner */}
                {hasHighUsage && (
                  <div className="flex items-start gap-3 rounded-lg border border-yellow-300/50 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-800/50 p-4">
                    <AlertTriangle className="size-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                        Resource usage is high
                      </p>
                      <p className="text-xs text-yellow-700/80 dark:text-yellow-400/70 mt-0.5">
                        {data.disk.percent_used >= 85 &&
                        data.memory &&
                        data.memory.percent_used >= 85
                          ? "Both disk and memory are running high. Go to Actions tab to run a cleanup."
                          : data.disk.percent_used >= 85
                            ? "Disk space is running low. Consider running a cleanup from the Actions tab."
                            : "Memory is running high. Consider restarting services from the Containers tab."}
                      </p>
                    </div>
                  </div>
                )}

                {/* Resource Usage */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                {/* Docker Resource Usage */}
                {data.docker && data.docker.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Box className="size-4 text-muted-foreground" />
                      <h4 className="text-sm font-semibold">
                        Docker Resources
                      </h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {data.docker.map((entry) => (
                        <div
                          key={entry.type}
                          className="rounded-lg border bg-card p-3 space-y-1"
                        >
                          <p className="text-xs text-muted-foreground">
                            {entry.type}
                          </p>
                          <p className="text-lg font-bold tracking-tight">
                            {entry.size}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {entry.reclaimable} reclaimable
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Media Files */}
                {data.large_media_files &&
                  data.large_media_files.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FolderOpen className="size-4 text-muted-foreground" />
                          <h4 className="text-sm font-semibold">
                            Media Storage
                          </h4>
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-medium"
                          >
                            {data.media_total_mb > 1024
                              ? `${(data.media_total_mb / 1024).toFixed(1)} GB`
                              : `${data.media_total_mb.toFixed(0)} MB`}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => setShowMediaFiles(!showMediaFiles)}
                        >
                          {showMediaFiles ? (
                            <>
                              <ChevronUp className="size-3.5" />
                              Hide
                            </>
                          ) : (
                            <>
                              <ChevronDown className="size-3.5" />
                              {data.large_media_files.length} large files
                            </>
                          )}
                        </Button>
                      </div>
                      {showMediaFiles && (
                        <div className="max-h-48 overflow-y-auto rounded-lg border">
                          {data.large_media_files.map((file, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between px-3 py-2 text-xs border-b last:border-b-0 hover:bg-muted/50 transition-colors"
                            >
                              <span className="text-muted-foreground truncate mr-4 max-w-[70%]">
                                {file.path}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-[10px] shrink-0"
                              >
                                {file.size_mb.toFixed(1)} MB
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
              </TabsContent>

              {/* ===== CONTAINERS TAB ===== */}
              <TabsContent
                value="containers"
                className="space-y-4 mt-0"
              >
                {data.containers && data.containers.length > 0 ? (
                  <div className="grid gap-3">
                    {data.containers.map((container) => {
                      const info = CONTAINER_LABELS[container.name]
                      const Icon = info?.icon || Server
                      const isRestarting =
                        runningAction === `restart_${container.name}`
                      return (
                        <div
                          key={container.name}
                          className="rounded-xl border p-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="rounded-lg bg-muted p-2 mt-0.5">
                                <Icon className="size-4 text-muted-foreground" />
                              </div>
                              <div className="min-w-0 space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-sm">
                                    {info?.label || container.name}
                                  </span>
                                  <Badge
                                    variant={getStateBadgeVariant(
                                      container.state,
                                    )}
                                    className="text-[10px] h-5 gap-1"
                                  >
                                    <span
                                      className={`size-1.5 rounded-full ${getStateColor(container.state)}`}
                                    />
                                    {container.state}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {container.status}
                                </p>
                                {container.size && (
                                  <p className="text-xs text-muted-foreground font-mono">
                                    {container.size}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => viewLogs(container.name)}
                                  >
                                    <ScrollText className="size-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>View logs</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    disabled={runningAction !== null}
                                    onClick={() =>
                                      runCleanup(
                                        "restart_containers",
                                        `Restart ${info?.label || container.name}`,
                                        { container: container.name },
                                      )
                                    }
                                  >
                                    {isRestarting ? (
                                      <Loader2 className="size-3.5 animate-spin" />
                                    ) : (
                                      <RefreshCw className="size-3.5" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Restart container
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
                    <Server className="size-8 opacity-40" />
                    <p className="text-sm">
                      No container information available
                    </p>
                    <p className="text-xs">
                      Docker may not be accessible from this environment
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* ===== SCHEDULED JOBS TAB ===== */}
              <TabsContent
                value="scheduled"
                className="space-y-6 mt-0"
              >
                {/* Install Cron Jobs Banner */}
                <div className="flex items-center justify-between rounded-xl border bg-muted/30 p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-blue-500/10 p-2">
                      <Download className="size-4 text-blue-500" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold">Install Cron Jobs</p>
                      <p className="text-xs text-muted-foreground">
                        Deploy or update all scheduled task scripts and crontab
                        entries on the host server.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 gap-1.5"
                    disabled={runningAction !== null}
                    onClick={() =>
                      setPendingAuthAction({ type: "install_cron" })
                    }
                  >
                    {runningAction === "install_cron_jobs" ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Play className="size-3.5" />
                    )}
                    {runningAction === "install_cron_jobs"
                      ? "Installing..."
                      : "Install"}
                  </Button>
                </div>

                {/* Cron Jobs Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-muted-foreground" />
                    <h4 className="text-sm font-semibold">
                      Scheduled Cron Jobs
                    </h4>
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-medium"
                    >
                      {data.cron_jobs?.length || 0} jobs
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Automated tasks running on the server. All times are in
                    Philippines Time (UTC+8).
                  </p>
                  {data.cron_jobs && data.cron_jobs.length > 0 ? (
                    <div className="grid gap-2">
                      {data.cron_jobs.map((job) => (
                        <div
                          key={job.id}
                          className="rounded-lg border p-3 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <div
                                className={`rounded-lg p-2 mt-0.5 ${
                                  job.last_status === "success"
                                    ? "bg-emerald-500/10"
                                    : job.last_status === "error"
                                      ? "bg-red-500/10"
                                      : "bg-muted"
                                }`}
                              >
                                <Clock
                                  className={`size-3.5 ${
                                    job.last_status === "success"
                                      ? "text-emerald-500"
                                      : job.last_status === "error"
                                        ? "text-red-500"
                                        : "text-muted-foreground"
                                  }`}
                                />
                              </div>
                              <div className="min-w-0 space-y-0.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-medium">
                                    {job.id
                                      .replace(/_/g, " ")
                                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                                  </span>
                                  <Badge
                                    variant={
                                      job.last_status === "success"
                                        ? "default"
                                        : job.last_status === "error"
                                          ? "destructive"
                                          : "secondary"
                                    }
                                    className="text-[10px] h-5"
                                  >
                                    {job.last_status === "success"
                                      ? "OK"
                                      : job.last_status === "error"
                                        ? "Failed"
                                        : job.last_status === "unknown"
                                          ? "Unknown"
                                          : "No logs"}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] h-5"
                                  >
                                    {job.category}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                  {job.description}
                                </p>
                                <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-0.5">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="size-3" />
                                    {job.schedule}
                                  </span>
                                  {job.last_modified && (
                                    <span>
                                      Last run:{" "}
                                      {new Date(
                                        job.last_modified,
                                      ).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  )}
                                  {job.log_size_kb > 0 && (
                                    <span>
                                      Log:{" "}
                                      {job.log_size_kb > 1024
                                        ? `${(job.log_size_kb / 1024).toFixed(1)} MB`
                                        : `${job.log_size_kb.toFixed(0)} KB`}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 shrink-0"
                                  onClick={() =>
                                    viewCronLog(job.log_file, job.id)
                                  }
                                  disabled={job.last_status === "no_log"}
                                >
                                  <ScrollText className="size-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View log</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
                      <Clock className="size-6 opacity-40" />
                      <p className="text-sm">No cron job data available</p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Management Commands Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Terminal className="size-4 text-muted-foreground" />
                    <h4 className="text-sm font-semibold">
                      Management Commands
                    </h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Run Django management commands manually. Commands run in the
                    background and results are pushed via notification.
                  </p>
                  {data.management_commands &&
                  data.management_commands.length > 0 ? (
                    <div className="grid gap-2">
                      {data.management_commands.map((cmd) => {
                        const isRunning = runningAction === `cmd_${cmd.id}`
                        return (
                          <div
                            key={cmd.id}
                            className={`rounded-lg border p-3 transition-colors ${
                              cmd.destructive
                                ? "hover:border-red-300 dark:hover:border-red-800"
                                : "hover:border-foreground/20"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 min-w-0">
                                <div
                                  className={`rounded-lg p-2 mt-0.5 ${
                                    cmd.destructive
                                      ? "bg-red-500/10"
                                      : "bg-muted"
                                  }`}
                                >
                                  <Wrench
                                    className={`size-3.5 ${
                                      cmd.destructive
                                        ? "text-red-500"
                                        : "text-muted-foreground"
                                    }`}
                                  />
                                </div>
                                <div className="min-w-0 space-y-0.5">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-medium">
                                      {cmd.label}
                                    </span>
                                    {cmd.destructive && (
                                      <Badge
                                        variant="destructive"
                                        className="text-[10px] h-5"
                                      >
                                        Destructive
                                      </Badge>
                                    )}
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] h-5"
                                    >
                                      {cmd.app}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground leading-relaxed">
                                    {cmd.description}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant={
                                  cmd.destructive ? "destructive" : "outline"
                                }
                                size="sm"
                                className="shrink-0 gap-1.5"
                                disabled={runningAction !== null}
                                onClick={() => {
                                  if (cmd.destructive) {
                                    setPendingAuthAction({
                                      type: "command",
                                      command: cmd,
                                    })
                                  } else {
                                    runCommand(cmd)
                                  }
                                }}
                              >
                                {isRunning ? (
                                  <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                  <Play className="size-3.5" />
                                )}
                                {isRunning ? "Running..." : "Run"}
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
                      <Terminal className="size-6 opacity-40" />
                      <p className="text-sm">No commands available</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* ===== ACTIONS TAB ===== */}
              <TabsContent
                value="actions"
                className="space-y-4 mt-0"
              >
                <div className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3">
                  <Info className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Cleanup actions help free up disk space and keep the server
                    running smoothly. Actions run in the background and may take
                    a moment to complete.
                  </p>
                </div>

                <div className="grid gap-3">
                  {CLEANUP_ACTIONS.map((action) => {
                    const Icon = action.icon
                    const isRunning = runningAction === action.id
                    return (
                      <div
                        key={action.id}
                        className={`group relative rounded-xl border p-4 transition-colors ${
                          action.destructive
                            ? "hover:border-red-300 dark:hover:border-red-800"
                            : "hover:border-foreground/20"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div
                              className={`rounded-lg p-2 ${
                                action.destructive
                                  ? "bg-red-500/10"
                                  : "bg-muted"
                              }`}
                            >
                              <Icon
                                className={`size-4 ${
                                  action.destructive
                                    ? "text-red-500"
                                    : "text-muted-foreground"
                                }`}
                              />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold">
                                  {action.label}
                                </p>
                                {action.destructive && (
                                  <Badge
                                    variant="destructive"
                                    className="text-[10px] h-5"
                                  >
                                    Aggressive
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
                                {action.description}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant={action.variant}
                            size="sm"
                            className="shrink-0 gap-1.5"
                            disabled={runningAction !== null}
                            onClick={() => {
                              if (action.destructive) {
                                setPendingAuthAction({
                                  type: "cleanup",
                                  cleanup: action,
                                })
                              } else {
                                runCleanup(action.id, action.label)
                              }
                            }}
                          >
                            {isRunning ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Play className="size-3.5" />
                            )}
                            {isRunning ? "Running..." : "Run"}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Quick Actions */}
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Trash2 className="size-4 text-muted-foreground" />
                    Quick Actions
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-auto py-3 px-4 justify-start gap-3"
                      disabled={runningAction !== null}
                      onClick={() =>
                        runCleanup(
                          "restart_containers",
                          "Restart All Containers",
                        )
                      }
                    >
                      <RefreshCw
                        className={`size-4 shrink-0 ${runningAction === "restart_containers" ? "animate-spin" : ""}`}
                      />
                      <div className="text-left">
                        <p className="text-xs font-medium">
                          Restart All Services
                        </p>
                        <p className="text-[10px] text-muted-foreground font-normal">
                          API, Database &amp; Redis
                        </p>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-auto py-3 px-4 justify-start gap-3"
                      onClick={() => refetch()}
                      disabled={isLoading}
                    >
                      <HardDrive className="size-4 shrink-0" />
                      <div className="text-left">
                        <p className="text-xs font-medium">Refresh Stats</p>
                        <p className="text-[10px] text-muted-foreground font-normal">
                          Reload all metrics
                        </p>
                      </div>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-auto py-3 px-4 justify-start gap-3"
                      disabled={runningAction !== null}
                      onClick={() =>
                        setPendingAuthAction({ type: "delete_chats" })
                      }
                    >
                      {runningAction === "delete_chats" ? (
                        <Loader2 className="size-4 shrink-0 animate-spin" />
                      ) : (
                        <MessageSquareX className="size-4 shrink-0" />
                      )}
                      <div className="text-left">
                        <p className="text-xs font-medium">Delete Chats</p>
                        <p className="text-[10px] text-destructive-foreground/70 font-normal">
                          Clear all chat messages
                        </p>
                      </div>
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* ===== BACKUPS TAB ===== */}
              <TabsContent
                value="backups"
                className="space-y-4 mt-0"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3 flex-1 mr-3">
                    <Info className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Create and manage PostgreSQL database backups. Backups are
                      compressed and stored on the server.
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadBackups}
                      disabled={backupsLoading}
                    >
                      <RefreshCw
                        className={`size-3.5 mr-1.5 ${backupsLoading ? "animate-spin" : ""}`}
                      />
                      Refresh
                    </Button>
                    <Button
                      size="sm"
                      onClick={createBackup}
                      disabled={runningAction !== null}
                    >
                      {runningAction === "db_backup" ? (
                        <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <Database className="size-3.5 mr-1.5" />
                      )}
                      {runningAction === "db_backup"
                        ? "Backing up..."
                        : "Create Backup"}
                    </Button>
                  </div>
                </div>

                {backupsLoading && backups.length === 0 ? (
                  <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    <span className="text-sm">Loading backups...</span>
                  </div>
                ) : backups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
                    <Database className="size-8 opacity-40" />
                    <p className="text-sm font-medium">No backups found</p>
                    <p className="text-xs">
                      Create your first backup to get started.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {backups.map((backup) => (
                      <div
                        key={backup.filename}
                        className="group flex items-center justify-between rounded-xl border p-4 hover:border-foreground/20 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-muted p-2">
                            <Database className="size-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {backup.filename}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                              <span>{backup.size_mb} MB</span>
                              <span>
                                {new Date(backup.created_at).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => downloadBackup(backup.filename)}
                              >
                                <Download className="size-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Download</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 hover:border-red-300 hover:text-red-500"
                                disabled={deletingBackup === backup.filename}
                                onClick={() => deleteBackup(backup.filename)}
                              >
                                {deletingBackup === backup.filename ? (
                                  <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="size-3.5" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
              <Server className="size-8 opacity-40" />
              <p className="text-sm font-medium">Failed to load server stats</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => refetch()}
              >
                <RefreshCw className="size-3.5 mr-1.5" />
                Try again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin Authorization Dialog for Destructive Actions */}
      <AdminPasswordDialog
        open={!!pendingAuthAction}
        onOpenChange={(open) => {
          if (!open) setPendingAuthAction(null)
        }}
        onVerified={(creds) => {
          if (!pendingAuthAction) return
          if (
            pendingAuthAction.type === "cleanup" &&
            pendingAuthAction.cleanup
          ) {
            runCleanup(
              pendingAuthAction.cleanup.id,
              pendingAuthAction.cleanup.label,
              {
                admin_username: creds.admin_username,
                admin_password: creds.admin_password,
              },
            )
          } else if (
            pendingAuthAction.type === "command" &&
            pendingAuthAction.command
          ) {
            runCommand(pendingAuthAction.command, creds)
          } else if (pendingAuthAction.type === "install_cron") {
            runCleanup("install_cron_jobs", "Install Cron Jobs", {
              admin_username: creds.admin_username,
              admin_password: creds.admin_password,
            })
          } else if (pendingAuthAction.type === "delete_chats") {
            runCleanup("delete_chats", "Delete Chats", {
              admin_username: creds.admin_username,
              admin_password: creds.admin_password,
            })
          }
          setPendingAuthAction(null)
        }}
        title={
          pendingAuthAction?.type === "install_cron"
            ? "Install Cron Jobs"
            : pendingAuthAction?.type === "delete_chats"
              ? "Delete All Chats"
              : "Admin Authorization Required"
        }
        description={
          pendingAuthAction?.type === "cleanup"
            ? `"${pendingAuthAction.cleanup?.label}" is an aggressive action that may temporarily affect running services. Enter admin credentials to proceed.`
            : pendingAuthAction?.type === "command"
              ? `"${pendingAuthAction.command?.label}" is a destructive command. Enter admin credentials to proceed.`
              : pendingAuthAction?.type === "delete_chats"
                ? "This will permanently delete all chat messages, unread counts, and presence data from Redis. Enter admin credentials to proceed."
                : "This will overwrite all cron scripts and update the host crontab entries. Enter admin credentials to proceed."
        }
      />

      {/* Container Logs Dialog */}
      <Dialog
        open={logsDialog.open}
        onOpenChange={(open) => setLogsDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScrollText className="size-4" />
              {logsDialog.title}
            </DialogTitle>
          </DialogHeader>
          {logsDialog.loading ? (
            <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Fetching logs...
            </div>
          ) : (
            <pre className="bg-zinc-950 text-zinc-200 rounded-lg p-4 text-xs leading-relaxed overflow-auto max-h-[60vh] whitespace-pre-wrap break-all font-mono">
              {logsDialog.logs}
            </pre>
          )}
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
