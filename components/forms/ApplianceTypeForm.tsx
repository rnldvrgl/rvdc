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
import { ApplianceType } from "@/lib/constants/interface"
import { useApplianceTypeMutations } from "@/lib/mutations/useApplianceTypeMutations"
import { zodResolver } from "@hookform/resolvers/zod"
import { Save } from "lucide-react"
import { useForm } from "react-hook-form"
import * as z from "zod"

const applianceTypeSchema = z.object({
  name: z.string().min(1, "Appliance type name is required"),
  default_labor_warranty_months: z.coerce.number().min(0).max(120),
  default_unit_warranty_months: z.coerce.number().min(0).max(120),
})

type FormValues = z.infer<typeof applianceTypeSchema>

interface ApplianceTypeFormProps {
  initialData?: ApplianceType
  onClose: () => void
}

export default function ApplianceTypeForm({
  initialData,
  onClose,
}: ApplianceTypeFormProps) {
  const { addApplianceType, updateApplianceType } = useApplianceTypeMutations()

  const form = useForm<FormValues>({
    resolver: zodResolver(applianceTypeSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      default_labor_warranty_months: initialData?.default_labor_warranty_months ?? 0,
      default_unit_warranty_months: initialData?.default_unit_warranty_months ?? 0,
    },
  })

  const onSubmit = (data: FormValues) => {
    if (initialData) {
      updateApplianceType.mutate(
        { id: initialData.id, data },
        { onSuccess: onClose },
      )
    } else {
      addApplianceType.mutate(data, { onSuccess: onClose })
    }
  }

  const isSubmitting =
    addApplianceType.isPending || updateApplianceType.isPending

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Appliance Type Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g. Air Conditioner, Refrigerator"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="default_labor_warranty_months"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Default Labor Warranty (months)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    min={0}
                    max={120}
                    placeholder="0"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  Auto-applied to all service appliances of this type
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="default_unit_warranty_months"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Default Unit Warranty (months)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    min={0}
                    max={120}
                    placeholder="0"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  Only for brand-new installation services
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || !form.formState.isDirty}
        >
          <Save className="mr-2 h-4 w-4" />
          {initialData ? "Update" : "Create"} Appliance Type
        </Button>
      </form>
    </Form>
  )
}
