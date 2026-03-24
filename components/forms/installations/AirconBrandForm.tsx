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
import { AirconBrands } from "@/lib/constants/interface"
import { useAirconBrandMutations } from "@/lib/mutations/installations/useAirconBrandMutations"
import { SubmitHandler, useForm } from "react-hook-form"

interface FormValues {
  name: string
}

interface AirconBrandFormProps {
  brand?: AirconBrands
  onClose: () => void
}

export default function AirconBrandForm({
  brand,
  onClose,
}: AirconBrandFormProps) {
  const form = useForm<FormValues>({
    defaultValues: {
      name: brand?.name ?? "",
    },
  })

  const { addBrand, updateBrand } = useAirconBrandMutations()
  const isSubmitting = addBrand.isPending || updateBrand.isPending

  const handleSubmit: SubmitHandler<FormValues> = (data) => {
    if (brand?.id) {
      updateBrand.mutate({ id: brand.id, data }, { onSuccess: onClose })
    } else {
      addBrand.mutate(data, { onSuccess: onClose })
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6 max-w-md"
      >
        <FormField
          control={form.control}
          name="name"
          rules={{ required: "Brand name is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Brand Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Samsung"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="pt-4 flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : brand ? "Update Brand" : "Save Brand"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
