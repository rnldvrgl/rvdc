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
import { SubmitHandler, useForm } from 'react-hook-form'

interface ExpenseFormProps {
  expense?: Expense
  onClose: () => void
}

export default function ExpenseForm({ expense, onClose }: ExpenseFormProps) {
  const form = useForm<Partial<Expense>>({
    defaultValues: {
      description: expense?.description ?? '',
      total_price: expense?.total_price ?? 0,
    },
  })

  const userProfile = useUserProfileStore((state) => state.userProfile)
  const { addExpense, updateExpense } = useExpenseMutations()

  const onSubmit: SubmitHandler<Partial<Expense>> = (data) => {
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
            rules={{ required: 'Description is required' }}
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
            rules={{ required: 'Total price is required' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Price</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    placeholder="0.00"
                    min={1}
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
