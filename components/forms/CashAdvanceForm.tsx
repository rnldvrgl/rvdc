"use client"

import DatePicker from "@/components/custom/inputs/DatePicker"
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
import { Textarea } from "@/components/ui/textarea"
import { Employee } from "@/lib/constants/types"
import { useCashAdvanceMutations } from "@/lib/mutations/useCashAdvanceMutations"
import {
  CashAdvanceFormValues,
  cashAdvanceSchema,
} from "@/lib/schemas/cashAdvanceSchema"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"

interface CashAdvanceFormProps {
  employee: Employee
  onSuccess?: () => void
}

export function CashAdvanceForm({ employee, onSuccess }: CashAdvanceFormProps) {
  const { createCashAdvance } = useCashAdvanceMutations()

  const form = useForm<CashAdvanceFormValues>({
    resolver: zodResolver(cashAdvanceSchema),
    defaultValues: {
      employee: employee.id,
      amount: "",
      date: new Date(),
      reason: "",
    },
  })

  useEffect(() => {
    form.setValue("employee", employee.id)
  }, [employee.id, form])

  async function onSubmit(values: CashAdvanceFormValues) {
    const payload = {
      employee: values.employee,
      amount: values.amount,
      date: format(values.date, "yyyy-MM-dd"),
      reason: values.reason || undefined,
    }

    await createCashAdvance.mutateAsync(payload)
    form.reset({
      employee: employee.id,
      amount: "",
      date: new Date(),
      reason: "",
    })
    onSuccess?.()
  }

  const availableBalance = Number(employee.cash_ban_balance || 0)

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        {/* Employee Info Display */}
        <div className="p-4 bg-muted rounded-lg space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Employee:</span>
            <span className="font-medium">
              {employee.first_name} {employee.last_name}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">
              Available Balance:
            </span>
            <span className="font-semibold text-green-600">
              ₱{availableBalance.toLocaleString()}
            </span>
          </div>
        </div>

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <DatePicker
                  field={{
                    value: field.value,
                    onChange: field.onChange,
                  }}
                  label="Date"
                  placeholder="Select date"
                  maxDate={new Date()}
                  required
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason/Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Optional reason for cash advance..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="submit"
            disabled={createCashAdvance.isPending}
            className="w-full sm:w-auto"
          >
            {createCashAdvance.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Record Cash Advance
          </Button>
        </div>
      </form>
    </Form>
  )
}
