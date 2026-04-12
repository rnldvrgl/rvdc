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
  availableStreams?: string[]
}

type FormValues = {
  name: string
  stream_name: string
  location: string
  notes: string
}

const BLANK_DEFAULTS: FormValues = {
  name: "",
  stream_name: "",
  location: "",
  notes: "",
}

export function CameraFormDialog({
  open,
  camera,
  onClose,
  onSubmit,
  isLoading,
  availableStreams = [],
}: CameraFormDialogProps) {
  const isEdit = !!camera

  const form = useForm<FormValues>({ defaultValues: BLANK_DEFAULTS })

  useEffect(() => {
    if (!open) return
    if (camera) {
      form.reset({
        name: camera.name ?? "",
        stream_name: camera.stream_name ?? "",
        location: camera.location ?? "",
        notes: camera.notes ?? "",
      })
    } else {
      form.reset(BLANK_DEFAULTS)
    }
  }, [open, camera, form])

  const handleSubmit = (values: FormValues) => {
    onSubmit(values as CCTVCameraPayload)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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
              name="stream_name"
              rules={{
                required: "Stream ID is required",
                pattern: { value: /^[a-zA-Z0-9_-]+$/, message: "Letters, numbers, _ or - only" },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stream ID</FormLabel>
                  {availableStreams.length > 0 ? (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a stream" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableStreams.map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <FormControl>
                      <Input placeholder="e.g. cam_1" {...field} />
                    </FormControl>
                  )}
                  <FormDescription className="text-xs">
                    {availableStreams.length > 0
                      ? "Select a stream configured in go2rtc"
                      : "Must match the stream name in go2rtc"}
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
