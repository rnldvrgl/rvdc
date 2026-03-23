"use client"

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
  Info,
  Loader2,
  MemoryStick,
  Package,
  Play,
  RefreshCw,
  ScrollText,
  Server,
  Shield,
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
  const [confirmAction, setConfirmAction] = useState<
    (typeof CLEANUP_ACTIONS)[number] | null
  >(null)
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
              <TabsList className="w-full grid grid-cols-3 mb-6">
                <TabsTrigger value="overview">
                  <HardDrive className="size-3.5 mr-1.5" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="containers">
                  <Server className="size-3.5 mr-1.5" />
                  Containers
                </TabsTrigger>
                <TabsTrigger value="actions">
                  <Zap className="size-3.5 mr-1.5" />
                  Actions
                  {hasHighUsage && (
                    <span className="ml-1.5 size-2 rounded-full bg-yellow-500 animate-pulse" />
                  )}
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
                                setConfirmAction(action)
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
                  </div>
                </div>
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

      {/* Confirmation Dialog */}
      <AlertDialog
        open={!!confirmAction}
        onOpenChange={(open: boolean) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-yellow-500" />
              Confirm {confirmAction?.label}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.description}
              {"\n\n"}This action may temporarily affect running services. Are
              you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (confirmAction) {
                  runCleanup(confirmAction.id, confirmAction.label)
                  setConfirmAction(null)
                }
              }}
            >
              <Zap className="size-3.5 mr-1.5" />
              Run Cleanup
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Container Logs Dialog */}
      <Dialog
        open={logsDialog.open}
        onOpenChange={(open) => setLogsDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="max-w-3xl max-h-[80vh]">
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
            <pre className="bg-zinc-950 text-zinc-200 rounded-lg p-4 text-xs leading-relaxed overflow-auto max-h-[60vh] whitespace-pre-wrap break-all font-mono">
              {logsDialog.logs}
            </pre>
          )}
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
