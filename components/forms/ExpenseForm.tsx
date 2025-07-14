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
import { Textarea } from '@/components/ui/textarea'
import { Expense } from '@/lib/constants/interface'
import { useExpenseMutations } from '@/lib/mutations/useExpenseMutations'
import useUserProfileStore from '@/lib/store/useUserProfileStore'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import z from 'zod'

interface ExpenseFormProps {
  expense?: Expense
  onClose: () => void
}

const formSchema = z.object({
  description: z.string().min(1, {
    message: 'Description is required',
  }),
  total_price: z.number().min(1, {
    message: 'Total price must be at least 1',
  }),
})

type FormValues = z.infer<typeof formSchema>

export default function ExpenseForm({ expense, onClose }: ExpenseFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: expense?.description ?? '',
      total_price: expense?.total_price ?? 0,
    },
  })

  const userProfile = useUserProfileStore((state) => state.userProfile)
  const { addExpense, updateExpense } = useExpenseMutations()

  const onSubmit = (data: FormValues) => {
    const payload = {
      ...data,
      stall: userProfile?.assigned_stall?.id,
      created_by: userProfile?.id,
      updated_by: userProfile?.id,
    }

    if (expense?.id) {
      updateExpense.mutate(
        { id: expense.id, data: payload },
        { onSuccess: onClose },
      )
    } else {
      addExpense.mutate(payload, { onSuccess: onClose })
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 max-w-md"
      >
        <div className="space-y-4 grid">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Expense details..."
                    maxLength={500}
                    className="max-h-80 overflow-y-auto"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="total_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Price</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === '' ? '' : +e.target.value,
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="pt-4 flex justify-end">
          <Button type="submit">
            {expense ? 'Update Expense' : 'Save Expense'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
