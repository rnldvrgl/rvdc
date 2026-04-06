"use client"

import { CCTVCamera } from "@/lib/queries/useSurveillance"
import { HlsPlayer } from "@/components/custom/surveillance/HlsPlayer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MapPin, MoreVertical, Pencil, RefreshCw, Trash2 } from "lucide-react"

const GO2RTC_URL = process.env.NEXT_PUBLIC_GO2RTC_URL ?? "http://localhost:1984"

interface CameraCardProps {
  camera: CCTVCamera
  onEdit: (camera: CCTVCamera) => void
  onDelete: (camera: CCTVCamera) => void
  onSync: (id: number) => void
  isSyncing?: boolean
}

export function CameraCard({ camera, onEdit, onDelete, onSync, isSyncing }: CameraCardProps) {
  const hlsUrl = `${GO2RTC_URL}/api/stream.m3u8?src=${camera.stream_name}`

  return (
    <Card className="overflow-hidden flex flex-col">
      <div className="relative aspect-video bg-black">
        {camera.is_active ? (
          <HlsPlayer src={hlsUrl} className="absolute inset-0 w-full h-full" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/40">
            <span className="text-xs uppercase tracking-widest">Inactive</span>
          </div>
        )}
        <div className="absolute top-2 left-2">
          <Badge
            variant={camera.is_active ? "default" : "secondary"}
            className="text-[10px] px-1.5 py-0.5"
          >
            {camera.is_active ? "LIVE" : "OFF"}
          </Badge>
        </div>
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 bg-black/40 hover:bg-black/60 text-white border-0"
              >
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(camera)}>
                <Pencil className="size-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onSync(camera.id)}
                disabled={isSyncing}
              >
                <RefreshCw className={`size-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
                Sync Stream
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(camera)}
              >
                <Trash2 className="size-4 mr-2" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <CardContent className="p-3 flex-1">
        <p className="font-medium text-sm leading-tight">{camera.name}</p>
        {camera.location && (
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            <MapPin className="size-3" />
            {camera.location}
          </p>
        )}
      </CardContent>
      {camera.notes && (
        <CardFooter className="px-3 pb-3 pt-0">
          <p className="text-xs text-muted-foreground line-clamp-2">{camera.notes}</p>
        </CardFooter>
      )}
    </Card>
  )
}
