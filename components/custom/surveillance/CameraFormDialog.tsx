"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface CameraFormDialogProps {
  open: boolean
  camera?: CCTVCamera | null
  onClose: () => void
  onSubmit: (data: CCTVCameraPayload) => void
  isLoading?: boolean
}

type FormValues = CCTVCameraPayload

export function CameraFormDialog({
  open,
  camera,
  onClose,
  onSubmit,
  isLoading,
}: CameraFormDialogProps) {
  const isEdit = !!camera

  const form = useForm<FormValues>({
    defaultValues: {
      name: "",
      uid: "",
      username: "admin",
      password: "",
      channel: 0,
      location: "",
      notes: "",
      is_active: true,
      order: 0,
    },
  })

  useEffect(() => {
    if (open) {
      if (camera) {
        form.reset({
          name: camera.name,
          uid: "",          // write-only, not returned by API
          username: "",     // write-only, not returned by API
          password: "",
          channel: camera.channel,
          location: camera.location,
          notes: camera.notes,
          is_active: camera.is_active,
          order: camera.order,
        })
      } else {
        form.reset({
          name: "",
          uid: "",
          username: "admin",
          password: "",
          channel: 0,
          location: "",
          notes: "",
          is_active: true,
          order: 0,
        })
      }
    }
  }, [open, camera, form])

  const handleSubmit = (values: FormValues) => {
    // On edit, omit uid/username/password if empty (don't overwrite with blanks)
    if (isEdit) {
      const payload: Partial<CCTVCameraPayload> = {
        name: values.name,
        channel: values.channel,
        location: values.location,
        notes: values.notes,
        is_active: values.is_active,
        order: values.order,
      }
      if (values.uid) payload.uid = values.uid
      if (values.username) payload.username = values.username
      if (values.password) payload.password = values.password
      onSubmit(payload as CCTVCameraPayload)
    } else {
      onSubmit(values)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Camera" : "Add Camera"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
              name="uid"
              rules={{ required: !isEdit ? "SN is required" : false }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SN (Serial Number)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={isEdit ? "Leave blank to keep current" : "e.g. ABCD1234EFGH5678"}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    iCSee app → Device Info → SN
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Device Login Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={isEdit ? "Keep current" : "admin"}
                        {...field}
                      />
                    </FormControl>
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
                      <Input
                        type="password"
                        placeholder={isEdit ? "Leave blank to keep" : "Device password"}
                        {...field}
                      />
                    </FormControl>
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
                  <FormLabel>Lens / Channel</FormLabel>
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
                      <SelectItem value="0">Main lens (Channel 0)</SelectItem>
                      <SelectItem value="1">Sub lens (Channel 1)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs">
                    Dual-lens cameras: 0 = wide, 1 = telephoto
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
