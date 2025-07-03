'use client'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Item, ItemPayload, ProductCategory } from '@/lib/constants/interface'
import { useItemMutations } from '@/lib/mutations/useItemMutations'
import { useCategoryChoices } from '@/lib/queries/useChoices'
import { SubmitHandler, useForm } from 'react-hook-form'

interface FormValues {
  name: string
  category: string | null
  size_or_spec: string
  unit_of_measure: 'pcs' | 'ft' | 'kg' | 'roll' | 'box'
  srp: string
  description: string
}

interface ItemFormProps {
  item?: Item
  onClose: () => void
}

export default function ItemForm({ item, onClose }: ItemFormProps) {
  const form = useForm<FormValues>({
    defaultValues: {
      name: item?.name ?? '',
      category: item?.category?.id ? item.category.id.toString() : null,
      size_or_spec: item?.size_or_spec ?? '',
      unit_of_measure: item?.unit_of_measure ?? 'pcs',
      srp: item?.srp?.toString() ?? '',
      description: item?.description ?? '',
    },
  })

  const { data: categoriesData, isLoading: loadingCategories } =
    useCategoryChoices()
  const categories = categoriesData ?? []

  const { addItem, updateItem } = useItemMutations()

  const handleSubmit: SubmitHandler<FormValues> = (data) => {
    const payload: ItemPayload = {
      name: data.name,
      category_id: data.category ? parseInt(data.category) : null,
      description: data.description,
      unit_of_measure: data.unit_of_measure,
      size_or_spec: data.size_or_spec ? data.size_or_spec : undefined,
      srp: parseFloat(data.srp) || 0,
    }

    if (item?.id) {
      updateItem.mutate({ id: item.id, data: payload }, { onSuccess: onClose })
    } else {
      addItem.mutate(payload, { onSuccess: onClose })
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
            rules={{ required: 'Name is required' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g. Electrical Wire"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            rules={{ required: 'Category is required' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Category</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ''}
                    disabled={loadingCategories}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          loadingCategories ? 'Loading...' : 'Select Category'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat: ProductCategory) => (
                        <SelectItem
                          key={cat.id}
                          value={cat.id.toString()}
                        >
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="size_or_spec"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Size / Specification</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g. 3.5mm²"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="E.g. short details about this product"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unit_of_measure"
            rules={{ required: 'Unit is required' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Unit of Measure</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pcs">Pieces</SelectItem>
                      <SelectItem value="ft">Feet</SelectItem>
                      <SelectItem value="kg">Kilogram</SelectItem>
                      <SelectItem value="roll">Roll</SelectItem>
                      <SelectItem value="box">Box</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="srp"
            rules={{ required: 'SRP is required' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel required>SRP</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g. 150.00"
                    type="number"
                    step="0.01"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="pt-4 flex justify-end">
          <Button type="submit">{item ? 'Update Item' : 'Add Item'}</Button>
        </div>
      </form>
    </Form>
  )
}
