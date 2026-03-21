"use client"

import { ComboBox } from "@/components/custom/inputs/ComboBox"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Expense } from "@/lib/constants/interface"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useExpenseMutations } from "@/lib/mutations/useExpenseMutations"
import {
  useExpenseCategoryChoices,
  useStallChoices,
} from "@/lib/queries/useChoices"
import { cn } from "@/lib/utils/helpers"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import z from "zod"

interface ExpenseFormProps {
  expense?: Expense
  onClose: () => void
}

export default function ExpenseForm({ expense, onClose }: ExpenseFormProps) {
  const { role } = useCurrentUser()

  const formSchema = z.object({
    stall: z.number().optional(),
    category: z.number().optional().nullable(),
    expense_date: z.date({
      required_error: "Expense date is required",
    }),
    description: z.string().min(1, {
      message: "Description is required",
    }),
    vendor: z.string().optional(),
    reference_number: z.string().optional(),
    total_price: z.number().min(0.01, {
      message: "Total price must be greater than 0",
    }),
    payment_method: z.string().min(1, {
      message: "Payment method is required",
    }),
    paid_amount: z.number().min(0).optional(),
    is_reimbursable: z.boolean().optional(),
  })

  type FormValues = z.infer<typeof formSchema>

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      stall:
        typeof expense?.stall === "number"
          ? expense.stall
          : expense?.stall_data?.id,
      category: expense?.category ?? null,
      expense_date: expense?.expense_date
        ? new Date(expense.expense_date)
        : new Date(),
      description: expense?.description ?? "",
      vendor: expense?.vendor ?? "",
      reference_number: expense?.reference_number ?? "",
      total_price: expense?.total_price
        ? typeof expense.total_price === "number"
          ? expense.total_price
          : parseFloat(String(expense.total_price))
        : 0,
      payment_method: expense?.payment_method ?? "cash",
      paid_amount: expense?.paid_amount
        ? typeof expense.paid_amount === "number"
          ? expense.paid_amount
          : parseFloat(String(expense.paid_amount))
        : 0,
      is_reimbursable: expense?.is_reimbursable ?? false,
    },
  })

  const { assigned_stall } = useCurrentUser()
  const { addExpense, updateExpense } = useExpenseMutations()
  const { data: stalls } = useStallChoices({})
  const { data: categories, isLoading: loadingCategories } =
    useExpenseCategoryChoices()

  // Watch fields for conditional rendering
  const watchPaidAmount = form.watch("paid_amount")
  const watchTotalPrice = form.watch("total_price")

  // Auto-calculate payment status
  const calculatePaymentStatus = (
    paidAmount: number | undefined,
    totalPrice: number,
  ): "unpaid" | "partial" | "paid" => {
    if (!paidAmount || paidAmount === 0) return "unpaid"
    if (paidAmount >= totalPrice) return "paid"
    return "partial"
  }

  const onSubmit = (data: FormValues) => {
    const paidAmount = data.paid_amount ?? 0
    const paymentStatus = calculatePaymentStatus(paidAmount, data.total_price)

    const payload = {
      ...data,
      stall: role === "admin" ? data.stall : assigned_stall?.id,
      category: data.category ?? undefined,
      expense_date: format(data.expense_date, "yyyy-MM-dd"),
      vendor: data.vendor || undefined,
      reference_number: data.reference_number || undefined,
      payment_method: data.payment_method || "cash",
      payment_status: paymentStatus,
      paid_amount: paidAmount,
      is_reimbursable: data.is_reimbursable ?? false,
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

  const isLoading = addExpense.isPending || updateExpense.isPending

  // Flatten category hierarchy for display
  const categoryOptions =
    categories?.map((cat) => {
      const label = cat.parent_name
        ? `${cat.parent_name} → ${cat.name}`
        : cat.name
      return {
        value: cat.id,
        label: label,
      }
    }) ?? []

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 max-w-2xl"
      >
        {/* Basic Information Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Basic Information</h3>

          {/* Stall (Admin only) */}
          {role && role === "admin" && (
            <FormField
              control={form.control}
              name="stall"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Stall</FormLabel>
                  <ComboBox
                    options={
                      stalls?.map((s) => ({
                        value: s.id,
                        label: `${s.name} - ${s.location}`,
                      })) ?? []
                    }
                    value={field.value ? Number(field.value) : null}
                    onChange={(val) => {
                      field.onChange(val ?? null)
                    }}
                    placeholder="Select stall"
                    disabled={isLoading}
                  />
                </FormItem>
              )}
            />
          )}

          {/* Category */}
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <ComboBox
                  options={categoryOptions}
                  value={field.value ?? null}
                  onChange={(val) => field.onChange(val)}
                  placeholder="Select category (optional)"
                  disabled={isLoading || loadingCategories}
                />
                <FormDescription>
                  Organize expenses by category for better tracking
                </FormDescription>
              </FormItem>
            )}
          />

          {/* Expense Date */}
          <FormField
            control={form.control}
            name="expense_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel required>Expense Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground",
                        )}
                        disabled={isLoading}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  When was this expense incurred?
                </FormDescription>
              </FormItem>
            )}
          />

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Description</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="What is this expense for?"
                    maxLength={500}
                    className="resize-none"
                    rows={3}
                    disabled={isLoading}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Vendor */}
          <FormField
            control={form.control}
            name="vendor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vendor/Supplier</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g., ABC Supplies, XYZ Company"
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>Who did you purchase from?</FormDescription>
              </FormItem>
            )}
          />

          {/* Reference Number */}
          <FormField
            control={form.control}
            name="reference_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reference Number</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Invoice #, Receipt #, PO #"
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>
                  Invoice or receipt number for tracking
                </FormDescription>
              </FormItem>
            )}
          />
        </div>

        {/* Payment Information Section */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-lg font-semibold">Payment Information</h3>

          {/* Total Price */}
          <FormField
            control={form.control}
            name="total_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Total Price (₱)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? 0 : parseFloat(e.target.value),
                      )
                    }
                    disabled={isLoading}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Paid Amount */}
          <FormField
            control={form.control}
            name="paid_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Paid Amount (₱)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max={
                      typeof watchTotalPrice === "number"
                        ? watchTotalPrice
                        : undefined
                    }
                    placeholder="0.00"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? 0 : parseFloat(e.target.value),
                      )
                    }
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>
                  Amount paid so far (max: ₱
                  {typeof watchTotalPrice === "number"
                    ? watchTotalPrice.toFixed(2)
                    : "0.00"}
                  )
                  {watchPaidAmount !== undefined &&
                    watchPaidAmount > 0 &&
                    typeof watchTotalPrice === "number" && (
                      <span className="ml-2 font-medium">
                        • Status:{" "}
                        {calculatePaymentStatus(
                          watchPaidAmount,
                          watchTotalPrice,
                        ) === "paid"
                          ? "Fully Paid"
                          : "Partially Paid"}
                      </span>
                    )}
                </FormDescription>
              </FormItem>
            )}
          />

          {/* Payment Method */}
          <FormField
            control={form.control}
            name="payment_method"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Payment Method</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="debit_card">Debit Card</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="gcash">GCash</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  How was this expense paid? (Defaults to Cash)
                </FormDescription>
              </FormItem>
            )}
          />
        </div>

        {/* Reimbursement Section */}
        <div className="space-y-4 pt-4 border-t">
          <FormField
            control={form.control}
            name="is_reimbursable"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Reimbursable Expense
                  </FormLabel>
                  <FormDescription>
                    Mark if you expect to be reimbursed for this expense. You
                    can record the reimbursement later.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isLoading}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="size-4 mr-2 animate-spin" />}
            {expense ? "Update Expense" : "Create Expense"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
