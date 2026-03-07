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
import {
  ProductCategory,
  ProductCategoryPayload,
} from "@/lib/constants/interface"
import { useItemCategoryMutations } from "@/lib/mutations/useItemCategoryMutations"
import { SubmitHandler, useForm } from "react-hook-form"

interface FormValues {
  name: string
}

interface ItemCategoryFormProps {
  category?: ProductCategory
  onClose: () => void
}

export default function ItemCategoryForm({
  category,
  onClose,
}: ItemCategoryFormProps) {
  const form = useForm<FormValues>({
    defaultValues: {
      name: category?.name ?? "",
    },
  })

  const { addCategory, updateCategory } = useItemCategoryMutations()

  const handleSubmit: SubmitHandler<FormValues> = (data) => {
    const payload: ProductCategoryPayload = {
      name: data.name,
    }

    if (category?.id) {
      updateCategory.mutate(
        { id: category.id, data: payload },
        { onSuccess: onClose },
      )
    } else {
      addCategory.mutate(payload, { onSuccess: onClose })
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
                    placeholder="e.g. Electrical Supplies"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="pt-4 flex justify-end">
          <Button type="submit">
            {category ? "Update Category" : "Add Category"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
