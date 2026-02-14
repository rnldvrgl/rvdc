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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Employee } from "@/lib/constants/types"
import { useCashAdvanceMutations } from "@/lib/mutations/useCashAdvanceMutations"
import {
  CashAdvanceMovementFormValues,
  cashAdvanceMovementSchema,
} from "@/lib/schemas/cashAdvanceSchema"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { ArrowDownCircle, ArrowUpCircle, Loader2 } from "lucide-react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"

interface CashAdvanceFormProps {
  employee: Employee
  onSuccess?: () => void
}

export function CashAdvanceForm({ employee, onSuccess }: CashAdvanceFormProps) {
  const { createMovement } = useCashAdvanceMutations()

  const form = useForm<CashAdvanceMovementFormValues>({
    resolver: zodResolver(cashAdvanceMovementSchema),
    defaultValues: {
      employee: employee.id,
      movement_type: "credit",
      amount: "",
      date: new Date(),
      description: "",
    },
  })

  useEffect(() => {
    form.setValue("employee", employee.id)
  }, [employee.id, form])

  const movementType = form.watch("movement_type")

  async function onSubmit(values: CashAdvanceMovementFormValues) {
    const payload = {
      employee: values.employee,
      movement_type: values.movement_type,
      amount: values.amount,
      date: format(values.date, "yyyy-MM-dd"),
      description: values.description || undefined,
    }

    await createMovement.mutateAsync(payload)
    form.reset({
      employee: employee.id,
      movement_type: "credit",
      amount: "",
      date: new Date(),
      description: "",
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
              Current Balance:
            </span>
            <span className="font-semibold text-green-600">
              ₱{availableBalance.toLocaleString()}
            </span>
          </div>
        </div>

        <FormField
          control={form.control}
          name="movement_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Movement Type *</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="credit">
                    <span className="flex items-center gap-2">
                      <ArrowUpCircle className="h-4 w-4 text-green-600" />
                      Credit (+) — Add to balance
                    </span>
                  </SelectItem>
                  <SelectItem value="debit">
                    <span className="flex items-center gap-2">
                      <ArrowDownCircle className="h-4 w-4 text-red-600" />
                      Debit (-) — Deduct from balance
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

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
              {movementType === "debit" && (
                <p className="text-xs text-muted-foreground">
                  Max deductible: ₱{availableBalance.toLocaleString()}
                </p>
              )}
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description/Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={
                    movementType === "credit"
                      ? "e.g., Initial cash ban balance, manual adjustment..."
                      : "e.g., Cash advance withdrawal..."
                  }
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
            disabled={createMovement.isPending}
            className="w-full sm:w-auto"
            variant={movementType === "debit" ? "destructive" : "default"}
          >
            {createMovement.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {movementType === "credit"
              ? "Add to Balance"
              : "Deduct from Balance"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
