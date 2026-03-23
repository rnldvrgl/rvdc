"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import api from "@/lib/utils/api"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"
import {
  HardDrive,
  Loader2,
  Trash2,
  FileText,
  Zap,
  Server,
  AlertTriangle,
} from "lucide-react"

interface DiskUsage {
  total_gb: number
  used_gb: number
  free_gb: number
  percent_used: number
}

interface DockerEntry {
  type: string
  size: string
  reclaimable: string
}

interface MaintenanceData {
  disk: DiskUsage
  docker: DockerEntry[] | null
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

export function ServerMaintenanceCard() {
  const [runningAction, setRunningAction] = useState<string | null>(null)

  const { data, isLoading, refetch } = useQuery<MaintenanceData>({
    queryKey: ["server-maintenance"],
    queryFn: async () => {
      const res = await api.get("/users/maintenance/")
      return res.data
    },
    refetchInterval: 60000,
  })

  const runCleanup = async (action: string, label: string) => {
    setRunningAction(action)
    try {
      const res = await api.post<CleanupResponse>("/users/maintenance/", {
        action,
      })
      const { results } = res.data

      const failed = results.filter((r) => !r.success)
      if (failed.length === 0) {
        toast.success(`${label} completed successfully`)
      } else {
        toast.warning(
          `${label} completed with issues: ${failed.map((f) => f.error || f.task).join(", ")}`
        )
      }

      // Show details for each task
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Server className="h-5 w-5 text-blue-500" />
          <CardTitle>Server Maintenance</CardTitle>
        </div>
        <CardDescription>
          Monitor disk usage and clean up Docker images, containers, and logs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading server stats...
          </div>
        ) : data ? (
          <>
            {/* Disk Usage */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <HardDrive className="size-4" />
                  Disk Usage
                </div>
                <span
                  className={`text-sm font-semibold ${getUsageColor(data.disk.percent_used)}`}
                >
                  {data.disk.percent_used.toFixed(1)}%
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${getBarColor(data.disk.percent_used)}`}
                  style={{ width: `${Math.min(data.disk.percent_used, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {data.disk.used_gb.toFixed(1)} GB used of{" "}
                  {data.disk.total_gb.toFixed(1)} GB
                </span>
                <span>{data.disk.free_gb.toFixed(1)} GB free</span>
              </div>
              {data.disk.percent_used >= 85 && (
                <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
                  <AlertTriangle className="size-4" />
                  Disk usage is high. Consider running a cleanup.
                </div>
              )}
            </div>

            {/* Docker Usage */}
            {data.docker && data.docker.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Docker Resource Usage</h4>
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

            {/* Actions */}
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
                <strong>Log Cleanup:</strong> Truncates cron log files over 5MB.{" "}
                <strong>Full Cleanup:</strong> Runs both.
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
  )
}
