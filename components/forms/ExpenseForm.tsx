'use client'

import { ComboBox } from '@/components/custom/inputs/ComboBox'
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
import { useCurrentUser } from '@/lib/hooks/useCurrentUser'
import { useExpenseMutations } from '@/lib/mutations/useExpenseMutations'
import { useStallChoices } from '@/lib/queries/useChoices'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import z from 'zod'

interface ExpenseFormProps {
  expense?: Expense
  onClose: () => void
}

export default function ExpenseForm({ expense, onClose }: ExpenseFormProps) {
  const { role } = useCurrentUser()
  const formSchema = z.object({
    stall: z.number().optional(),
    description: z.string().min(1, {
      message: 'Description is required',
    }),
    total_price: z.number().min(1, {
      message: 'Total price must be at least 1',
    }),
  })

  type FormValues = z.infer<typeof formSchema>

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      stall: expense?.stall_data?.id,
      description: expense?.description ?? '',
      total_price: expense?.total_price ?? 0,
    },
  })

  const { user_id, assigned_stall } = useCurrentUser()
  const { addExpense, updateExpense } = useExpenseMutations()
  const { data: stalls } = useStallChoices({})

  const onSubmit = (data: FormValues) => {
    const payload = {
      ...data,
      stall: role === 'admin' ? data.stall : assigned_stall?.id,
      created_by: user_id,
      updated_by: user_id,
    }
    console.log(payload)

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
          {role && role === 'admin' && (
            <FormField
              name="stall"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Stall</FormLabel>
                  <ComboBox
                    options={
                      stalls?.map((s) => ({
                        value: s.id,
                        label: s.name,
                      })) ?? []
                    }
                    value={field.value ? Number(field.value) : null}
                    onChange={(val) => {
                      field.onChange(val ?? null)
                    }}
                    placeholder="Select stall"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
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
