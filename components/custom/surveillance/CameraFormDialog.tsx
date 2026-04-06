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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

const DEFAULT_PUBLIC_IP = "49.151.165.129"
const DEFAULT_PORT = 34567

interface CameraFormDialogProps {
  open: boolean
  camera?: CCTVCamera | null
  onClose: () => void
  onSubmit: (data: CCTVCameraPayload) => void
  isLoading?: boolean
}

type FormValues = {
  name: string
  username: string
  password: string
  public_ip: string
  port: number
  channel: number
  location: string
  notes: string
  is_active: boolean
  order: number
}

function buildStreamUrl(v: Partial<FormValues>): string {
  if (!v.username || !v.public_ip || !v.port) return ""
  const auth = v.password ? `${v.username}:${v.password}` : v.username
  return `dvrip://${auth}@${v.public_ip}:${v.port}?channel=${v.channel ?? 0}`
}

const BLANK_DEFAULTS: FormValues = {
  name: "",
  username: "",
  password: "",
  public_ip: DEFAULT_PUBLIC_IP,
  port: DEFAULT_PORT,
  channel: 0,
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
      form.setError("username", { type: "manual", message: "Username is required" })
      return
    }
    const payload: Partial<CCTVCameraPayload> = {
      name: values.name,
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

            {/* ── Camera name ── */}
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

            <Separator />

            {/* ── Connection details ── */}
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">Connection</p>
              {isEdit && (
                <p className="text-xs text-muted-foreground">
                  Leave all fields blank to keep the current stream settings.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="username"
                rules={{ required: !isEdit ? "Username is required" : false }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Device Login Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. akhs" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      iCSee → About Device → Device Login Name
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Device Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Device password" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      iCSee → About Device → Device Password
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="public_ip"
                rules={{ required: !isEdit ? "Public IP is required" : false }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Public IP</FormLabel>
                    <FormControl>
                      <Input placeholder="49.151.165.129" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Router&apos;s public IP address
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="port"
                rules={{ required: !isEdit ? "Port is required" : false }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>External Port</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="34567"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Port forwarding rule (34567–34572)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="channel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Channel</FormLabel>
                  <Select
                    value={String(field.value)}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">0 — Main stream</SelectItem>
                      <SelectItem value="1">1 — Sub stream</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Live URL preview */}
            {preview && (
              <div className="rounded-md bg-muted px-3 py-2 text-xs font-mono break-all text-muted-foreground">
                {preview}
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
