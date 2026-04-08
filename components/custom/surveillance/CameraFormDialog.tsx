"use client"

import { useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"
import { CCTVCamera } from "@/lib/queries/useSurveillance"
import { CCTVCameraPayload } from "@/lib/mutations/useSurveillance"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

interface CameraFormDialogProps {
  open: boolean
  camera?: CCTVCamera | null
  onClose: () => void
  onSubmit: (data: CCTVCameraPayload) => void
  isLoading?: boolean
}

type FormValues = {
  name: string
  stream_name: string
  camera_ip: string
  camera_username: string
  camera_password: string
  location: string
  notes: string
  is_active: boolean
  order: number
}

function buildStreamUrl(v: Partial<FormValues>): string {
  const ip = v.camera_ip?.trim()
  const user = v.camera_username?.trim()
  const pass = v.camera_password?.trim()
  if (!ip || !user) return ""
  const encodedPass = pass ? encodeURIComponent(pass) : ""
  const auth = encodedPass ? `${user}:${encodedPass}` : user
  return `rtsp://${auth}@${ip}:554/user=${user}_password=${pass}_channel=0_stream=1.sdp`
}

const BLANK_DEFAULTS: FormValues = {
  name: "",
  stream_name: "",
  camera_ip: "192.168.1.",
  camera_username: "",
  camera_password: "",
  location: "",
  notes: "",
  is_active: true,
  order: 0,
}

export function CameraFormDialog({
  open,
  camera,
  onClose,
  onSubmit,
  isLoading,
}: CameraFormDialogProps) {
  const isEdit = !!camera

  const form = useForm<FormValues>({ defaultValues: BLANK_DEFAULTS })
  const watched = useWatch({ control: form.control })
  const preview = buildStreamUrl(watched)

  useEffect(() => {
    if (!open) return
    form.reset(
      camera
        ? {
            ...BLANK_DEFAULTS,
            name: camera.name,
            stream_name: camera.stream_name,
            location: camera.location,
            notes: camera.notes,
            is_active: camera.is_active,
            order: camera.order,
          }
        : BLANK_DEFAULTS
    )
  }, [open, camera, form])

  const handleSubmit = (values: FormValues) => {
    const url = buildStreamUrl(values)
    if (!isEdit && !url) {
      form.setError("camera_ip", { type: "manual", message: "Camera IP is required" })
      return
    }
    if (!values.stream_name) {
      form.setError("stream_name", { type: "manual", message: "Stream name is required" })
      return
    }
    const payload: Partial<CCTVCameraPayload> = {
      name: values.name,
      stream_name: values.stream_name,
      location: values.location,
      notes: values.notes,
      is_active: values.is_active,
      order: values.order,
    }
    if (url) payload.stream_url = url
    onSubmit(payload as CCTVCameraPayload)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Camera" : "Add Camera"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">

            {/* ── Basic Info ── */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                rules={{ required: "Name is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Camera Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Front Gate" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stream_name"
                rules={{
                  required: "Stream name is required",
                  pattern: { value: /^[a-zA-Z0-9_-]+$/, message: "Letters, numbers, _ or - only" },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stream ID</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. cam_1" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Must match your local go2rtc config
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* ── Camera Connection ── */}
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">Camera Connection</p>
              {isEdit && (
                <p className="text-xs text-muted-foreground">
                  Leave blank to keep current connection settings.
                </p>
              )}
            </div>

            <FormField
              control={form.control}
              name="camera_ip"
              rules={{ required: !isEdit ? "Camera IP is required" : false }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Camera IP Address</FormLabel>
                  <FormControl>
                    <Input placeholder="192.168.1.3" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Local network IP of the camera
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="camera_username"
                rules={{ required: !isEdit ? "Username is required" : false }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Camera login name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="camera_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Camera password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Generated URL preview */}
            {preview && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Generated Stream URL</p>
                <div className="rounded-md bg-muted px-3 py-2 text-xs font-mono break-all text-muted-foreground">
                  {preview}
                </div>
              </div>
            )}

            <Separator />

            {/* ── Location / Notes ── */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Main entrance, Parking lot" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Optional notes..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Order</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-col justify-end pb-1">
                    <FormLabel>Active</FormLabel>
                    <div className="flex items-center gap-2 h-9">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <span className="text-sm text-muted-foreground">
                        {field.value ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : isEdit ? "Save Changes" : "Add Camera"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
