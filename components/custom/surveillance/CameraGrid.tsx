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
import { Plus, RefreshCw, Wifi, WifiOff } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Go2rtcStatus } from "@/lib/queries/useSurveillance"

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
}: CameraGridProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [editCamera, setEditCamera] = useState<CCTVCamera | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CCTVCamera | null>(null)
  const [syncingId, setSyncingId] = useState<number | null>(null)

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

  const sortedCameras = [...cameras].sort((a, b) => a.order - b.order || a.id - b.id)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {go2rtcStatus !== undefined && (
            <Badge
              variant={go2rtcStatus.configured ? "default" : "destructive"}
              className="gap-1"
            >
              {go2rtcStatus.configured ? (
                <Wifi className="size-3" />
              ) : (
                <WifiOff className="size-3" />
              )}
              {go2rtcStatus.configured ? "go2rtc online" : "go2rtc offline"}
            </Badge>
          )}
          {go2rtcStatus?.error && (
            <span className="text-xs text-muted-foreground">{go2rtcStatus.error}</span>
          )}
        </div>
        <div className="flex items-center gap-2 ml-auto">
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
      </div>

      {/* Grid */}
      {sortedCameras.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground border rounded-lg bg-muted/20">
          <p className="text-sm">No cameras configured yet.</p>
          <Button size="sm" onClick={() => { setEditCamera(null); setFormOpen(true) }}>
            <Plus className="size-4 mr-1.5" />
            Add First Camera
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedCameras.map((camera) => (
            <CameraCard
              key={camera.id}
              camera={camera}
              onEdit={handleEdit}
              onDelete={setDeleteTarget}
              onSync={handleSyncOne}
              isSyncing={syncingId === camera.id}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <CameraFormDialog
        open={formOpen}
        camera={editCamera}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        isLoading={isAdding || isUpdating}
      />

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
