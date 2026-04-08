"use client"

import { CCTVCamera } from "@/lib/queries/useSurveillance"
import { HlsPlayer } from "@/components/custom/surveillance/HlsPlayer"
import { WebRtcPlayer } from "@/components/custom/surveillance/WebRtcPlayer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreVertical, Pencil, RefreshCw, Trash2, Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils/helpers"

const GO2RTC_URL = process.env.NEXT_PUBLIC_GO2RTC_URL ?? "http://localhost:1984"

interface CameraCardProps {
  camera: CCTVCamera
  onEdit?: (camera: CCTVCamera) => void
  onDelete?: (camera: CCTVCamera) => void
  onSync?: (id: number) => void
  onToggleActive?: (camera: CCTVCamera) => void
  onClick?: () => void
  isSyncing?: boolean
  compact?: boolean
  playerMode?: "webrtc" | "hls"
  enableMic?: boolean
}

export function CameraCard({ camera, onEdit, onDelete, onSync, onToggleActive, onClick, isSyncing, compact, playerMode = "webrtc", enableMic = false }: CameraCardProps) {
  const hlsUrl = `${GO2RTC_URL}/api/stream.m3u8?src=${camera.stream_name}`
  const wsUrl = `${GO2RTC_URL.replace(/^http/, "ws")}/api/ws?src=${camera.stream_name}`
  const hasActions = onEdit || onDelete || onSync || onToggleActive

  return (
    <div
      className={cn(
        "relative bg-black cursor-pointer group overflow-hidden rounded-sm",
      )}
      onClick={onClick}
    >
      {playerMode === "webrtc" ? (
        <WebRtcPlayer src={wsUrl} className="w-full" enableMic={enableMic} />
      ) : (
        <HlsPlayer src={hlsUrl} className="w-full" />
      )}

      {/* Disabled badge — top left, next to stream name */}
      {!camera.is_active && (
        <div className="absolute top-1.5 left-1.5 pointer-events-none z-10">
          <Badge variant="destructive" className={cn(
            "font-mono rounded-md",
            compact ? "text-[8px] px-1 py-0" : "text-[10px] px-1.5 py-0.5"
          )}>
            Disabled
          </Badge>
        </div>
      )}

      {/* Stream name badge — top left (shifts right if disabled) */}
      <div className={cn(
        "absolute top-1.5 pointer-events-none",
        !camera.is_active ? "left-[4.5rem]" : "left-1.5"
      )}>
        <Badge className={cn(
          "font-mono rounded-md",
          compact ? "text-[8px] px-1 py-0" : "text-[10px] px-1.5 py-0.5"
        )}>
          {camera.stream_name}
        </Badge>
      </div>

      {/* Camera name & location — bottom right */}
      <div className={cn(
        "absolute bottom-0 right-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none text-right rounded-tl-md",
        compact ? "px-1.5 py-1" : "px-2 py-1.5"
      )}>
        <p className={cn(
          "text-white font-medium truncate leading-tight",
          compact ? "text-[10px]" : "text-xs"
        )}>
          {camera.name}
        </p>
        {camera.location && (
          <p className={cn(
            "text-white/60 truncate leading-tight",
            compact ? "text-[8px]" : "text-[10px]"
          )}>
            {camera.location}
          </p>
        )}
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
              {onToggleActive && (
                <DropdownMenuItem onClick={() => onToggleActive(camera)}>
                  {camera.is_active ? (
                    <><EyeOff className="size-4 mr-2" />Disable</>
                  ) : (
                    <><Eye className="size-4 mr-2" />Enable</>
                  )}
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
