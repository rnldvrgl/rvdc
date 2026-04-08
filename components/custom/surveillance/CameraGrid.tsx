"use client"

import { useState } from "react"
import { CCTVCamera } from "@/lib/queries/useSurveillance"
import { CCTVCameraPayload } from "@/lib/mutations/useSurveillance"
import { CameraCard } from "@/components/custom/surveillance/CameraCard"
import { CameraFormDialog } from "@/components/custom/surveillance/CameraFormDialog"
import { Button } from "@/components/ui/button"
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Grid2x2, Maximize, Plus, RefreshCw, LayoutGrid, ArrowUp, ArrowDown, CircleAlert, CheckCircle2 } from "lucide-react"
import { Go2rtcStatus } from "@/lib/queries/useSurveillance"
import { cn } from "@/lib/utils/helpers"

type GridLayout = 1 | 4 | 8

const LAYOUT_OPTIONS: { value: GridLayout; label: string; icon: React.ReactNode; cols: string }[] = [
  { value: 1, label: "Single", icon: <Maximize className="size-4" />, cols: "grid-cols-1" },
  { value: 4, label: "2×2", icon: <Grid2x2 className="size-4" />, cols: "grid-cols-2" },
  { value: 8, label: "4×2", icon: <LayoutGrid className="size-4" />, cols: "grid-cols-4" },
]

interface CameraGridProps {
  cameras: CCTVCamera[]
  go2rtcStatus?: Go2rtcStatus
  onAdd: (data: CCTVCameraPayload) => void
  onUpdate: (id: number, data: Partial<CCTVCameraPayload>) => void
  onDelete: (id: number) => void
  onSyncAll: () => void
  onSyncOne: (id: number) => void
  isSyncing?: boolean
  isAdding?: boolean
  isUpdating?: boolean
  isDeleting?: boolean
  canManage?: boolean
}

export function CameraGrid({
  cameras,
  go2rtcStatus,
  onAdd,
  onUpdate,
  onDelete,
  onSyncAll,
  onSyncOne,
  isSyncing,
  isAdding,
  isUpdating,
  isDeleting,
  canManage = false,
}: CameraGridProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [editCamera, setEditCamera] = useState<CCTVCamera | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CCTVCamera | null>(null)
  const [syncingId, setSyncingId] = useState<number | null>(null)
  const [layout, setLayout] = useState<GridLayout>(4)
  const [focusedCamera, setFocusedCamera] = useState<CCTVCamera | null>(null)
  const [reorderMode, setReorderMode] = useState(false)

  const handleEdit = (camera: CCTVCamera) => {
    setEditCamera(camera)
    setFormOpen(true)
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setEditCamera(null)
  }

  const handleFormSubmit = (data: CCTVCameraPayload) => {
    if (editCamera) {
      onUpdate(editCamera.id, data)
    } else {
      onAdd(data)
    }
    handleFormClose()
  }

  const handleSyncOne = (id: number) => {
    setSyncingId(id)
    onSyncOne(id)
    setTimeout(() => setSyncingId(null), 3000)
  }

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      onDelete(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  const handleCameraClick = (camera: CCTVCamera) => {
    if (reorderMode) return
    if (focusedCamera?.id === camera.id) {
      setFocusedCamera(null)
    } else {
      setFocusedCamera(camera)
    }
  }

  const handleMoveCamera = (camera: CCTVCamera, direction: "up" | "down") => {
    const idx = sortedCameras.findIndex((c) => c.id === camera.id)
    if (idx < 0) return
    const swapIdx = direction === "up" ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sortedCameras.length) return

    const target = sortedCameras[swapIdx]
    // Swap order values
    onUpdate(camera.id, { order: target.order })
    onUpdate(target.id, { order: camera.order })
  }

  const sortedCameras = [...cameras].sort((a, b) => a.order - b.order || a.id - b.id)
  const activeCameras = sortedCameras.filter((c) => c.is_active)

  // When focused on a single camera, show it full-width
  const displayCameras = focusedCamera ? [focusedCamera] : activeCameras
  const currentLayout = focusedCamera ? LAYOUT_OPTIONS[0] : LAYOUT_OPTIONS.find((l) => l.value === layout) ?? LAYOUT_OPTIONS[1]

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Grid layout selector */}
        <TooltipProvider delayDuration={0}>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {LAYOUT_OPTIONS.map((opt) => (
              <Tooltip key={opt.value}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => { setLayout(opt.value); setFocusedCamera(null) }}
                    className={cn(
                      "p-1.5 rounded-md transition-colors",
                      layout === opt.value && !focusedCamera
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {opt.icon}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {opt.label}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>

        {focusedCamera && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFocusedCamera(null)}
            className="text-xs"
          >
            Back to grid
          </Button>
        )}

        {canManage && (
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant={reorderMode ? "default" : "outline"}
              size="sm"
              onClick={() => setReorderMode(!reorderMode)}
            >
              <ArrowUp className="size-4 mr-1.5" />
              {reorderMode ? "Done" : "Reorder"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onSyncAll}
              disabled={isSyncing}
            >
              <RefreshCw className={`size-4 mr-1.5 ${isSyncing ? "animate-spin" : ""}`} />
              Sync All
            </Button>
            <Button size="sm" onClick={() => { setEditCamera(null); setFormOpen(true) }}>
              <Plus className="size-4 mr-1.5" />
              Add Camera
            </Button>
          </div>
        )}
      </div>

      {/* go2rtc status banner */}
      {go2rtcStatus && !go2rtcStatus.running && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <CircleAlert className="size-4 shrink-0" />
          <span>
            go2rtc is <strong>offline</strong>
            {go2rtcStatus.error ? ` — ${go2rtcStatus.error}` : ". Camera streams will not load."}
          </span>
        </div>
      )}
      {go2rtcStatus?.running && canManage && (
        <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs text-green-700 dark:text-green-400">
          <CheckCircle2 className="size-3.5 shrink-0" />
          <span>
            go2rtc {go2rtcStatus.version ? `v${go2rtcStatus.version}` : ""} — {go2rtcStatus.stream_count} stream{go2rtcStatus.stream_count !== 1 ? "s" : ""} configured
          </span>
        </div>
      )}

      {/* CCTV Monitor Grid */}
      {displayCameras.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground border rounded-lg bg-black/50">
          <p className="text-sm">No cameras configured yet.</p>
          {canManage && (
            <Button size="sm" onClick={() => { setEditCamera(null); setFormOpen(true) }}>
              <Plus className="size-4 mr-1.5" />
              Add First Camera
            </Button>
          )}
        </div>
      ) : (
        <div className={cn(
          "grid gap-1 bg-black rounded-lg overflow-hidden p-1",
          focusedCamera ? "grid-cols-1" : currentLayout.cols,
          // Mobile: always 1 col on small, 2 col on medium
          !focusedCamera && "max-sm:grid-cols-1 max-md:grid-cols-2",
        )}>
          {displayCameras.map((camera, idx) => (
            <div key={camera.id} className="relative">
              <CameraCard
                camera={camera}
                onEdit={canManage && !reorderMode ? handleEdit : undefined}
                onDelete={canManage && !reorderMode ? setDeleteTarget : undefined}
                onSync={canManage && !reorderMode ? handleSyncOne : undefined}
                onClick={() => handleCameraClick(camera)}
                isSyncing={syncingId === camera.id}
                compact={layout >= 8 && !focusedCamera}
              />
              {reorderMode && canManage && (
                <div className="absolute top-1/2 -translate-y-1/2 right-2 flex flex-col gap-1 z-10">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="size-7 bg-black/70 hover:bg-black/90 text-white border-0"
                    disabled={idx === 0}
                    onClick={(e) => { e.stopPropagation(); handleMoveCamera(camera, "up") }}
                  >
                    <ArrowUp className="size-3.5" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="size-7 bg-black/70 hover:bg-black/90 text-white border-0"
                    disabled={idx === sortedCameras.length - 1}
                    onClick={(e) => { e.stopPropagation(); handleMoveCamera(camera, "down") }}
                  >
                    <ArrowDown className="size-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Dialog */}
      {canManage && (
        <CameraFormDialog
          open={formOpen}
          camera={editCamera}
          onClose={handleFormClose}
          onSubmit={handleFormSubmit}
          isLoading={isAdding || isUpdating}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Camera</AlertDialogTitle>
            <AlertDialogDescription>
              Remove <strong>{deleteTarget?.name}</strong>? This will also delete its stream
              from go2rtc. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
