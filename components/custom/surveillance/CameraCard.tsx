"use client"

import { CCTVCamera } from "@/lib/queries/useSurveillance"
import { HlsPlayer } from "@/components/custom/surveillance/HlsPlayer"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreVertical, Pencil, RefreshCw, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils/helpers"

const GO2RTC_URL = process.env.NEXT_PUBLIC_GO2RTC_URL ?? "http://localhost:1984"

interface CameraCardProps {
  camera: CCTVCamera
  onEdit?: (camera: CCTVCamera) => void
  onDelete?: (camera: CCTVCamera) => void
  onSync?: (id: number) => void
  onClick?: () => void
  isSyncing?: boolean
  compact?: boolean
}

export function CameraCard({ camera, onEdit, onDelete, onSync, onClick, isSyncing, compact }: CameraCardProps) {
  const hlsUrl = `${GO2RTC_URL}/api/stream.m3u8?src=${camera.stream_name}`
  const hasActions = onEdit || onDelete || onSync

  return (
    <div
      className={cn(
        "relative aspect-video bg-black cursor-pointer group overflow-hidden rounded-sm",
      )}
      onClick={onClick}
    >
      {camera.is_active ? (
        <HlsPlayer src={hlsUrl} className="absolute inset-0 w-full h-full" />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-white/30">
          <span className="text-[10px] uppercase tracking-widest">Offline</span>
        </div>
      )}

      {/* Camera label overlay — bottom left */}
      <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent px-2 py-1.5 pointer-events-none">
        <p className={cn(
          "text-white font-medium truncate",
          compact ? "text-[10px]" : "text-xs"
        )}>
          {camera.name}
        </p>
        {!compact && camera.location && (
          <p className="text-[10px] text-white/60 truncate">{camera.location}</p>
        )}
      </div>

      {/* Stream name badge — top left */}
      <div className="absolute top-1 left-1.5">
        <span className={cn(
          "bg-red-600/90 text-white font-mono rounded px-1 py-0.5",
          compact ? "text-[8px]" : "text-[10px]"
        )}>
          {camera.stream_name}
        </span>
      </div>

      {/* Admin actions — top right, visible on hover */}
      {hasActions && (
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 bg-black/60 hover:bg-black/80 text-white border-0"
              >
                <MoreVertical className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(camera)}>
                  <Pencil className="size-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {onSync && (
                <DropdownMenuItem
                  onClick={() => onSync(camera.id)}
                  disabled={isSyncing}
                >
                  <RefreshCw className={`size-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
                  Sync Stream
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDelete(camera)}
                  >
                    <Trash2 className="size-4 mr-2" />
                    Remove
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  )
}
