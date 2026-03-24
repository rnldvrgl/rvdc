"use client"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Stall, StallPayload } from "@/lib/constants/interface"
import { useStallMutations } from "@/lib/mutations/useStallMutations"
import { SubmitHandler, useForm } from "react-hook-form"

interface FormValues {
  name: string
  location: string
}

interface StallFormProps {
  stall?: Stall
  onClose: () => void
}

export default function StallForm({ stall, onClose }: StallFormProps) {
  const form = useForm<FormValues>({
    defaultValues: {
      name: stall?.name ?? "",
      location: stall?.location ?? "",
    },
  })

  const { addStall, updateStall } = useStallMutations()
  const isSubmitting = addStall.isPending || updateStall.isPending

  const handleSubmit: SubmitHandler<FormValues> = (data) => {
    const payload: StallPayload = {
      name: data.name,
      location: data.location,
    }

    if (stall?.id) {
      updateStall.mutate(
        { id: stall.id, data: payload },
        { onSuccess: onClose },
      )
    } else {
      addStall.mutate(payload, { onSuccess: onClose })
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6 max-w-md"
      >
        <div className="space-y-4 grid">
          <FormField
            control={form.control}
            name="name"
            rules={{ required: "Name is required" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Stall Name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            rules={{ required: "Location is required" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Location</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g. Building A"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="pt-4 flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : stall ? "Update Stall" : "Add Stall"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
