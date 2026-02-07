"use client"

import DatePicker from "@/components/custom/inputs/DatePicker"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useCreateAdditionalEarning } from "@/lib/mutations/useAdditionalEarningMutations"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

const additionalEarningSchema = z.object({
  category: z.enum([
    "bonus",
    "commission",
    "tip",
    "performance",
    "installation_pct",
    "allowance",
    "other",
  ]),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  earning_date: z.date().optional(),
  description: z.string().optional(),
  reference: z.string().optional(),
})

type AdditionalEarningFormData = z.infer<typeof additionalEarningSchema>

interface AddAdditionalEarningFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employeeId: number
  employeeName: string
  weekStart?: string // ISO date string for payroll week start
  weekEnd?: string // ISO date string for payroll week end
  payrollId?: number // Optional payroll ID to trigger auto-recompute
}

export function AddAdditionalEarningForm({
  open,
  onOpenChange,
  employeeId,
  employeeName,
  weekStart,
  weekEnd,
  payrollId,
}: AddAdditionalEarningFormProps) {
  const additionalEarningCategories = [
    { value: "bonus", label: "Bonus" },
    { value: "commission", label: "Commission" },
    { value: "tip", label: "Customer Tip" },
    { value: "performance", label: "Performance Incentive" },
    { value: "installation_pct", label: "Installation %" },
    { value: "allowance", label: "Special Allowance" },
    { value: "other", label: "Other" },
  ]
  const createMutation = useCreateAdditionalEarning(payrollId)

  const form = useForm<AdditionalEarningFormData>({
    resolver: zodResolver(additionalEarningSchema),
    defaultValues: {
      category: "other",
      amount: 0,
      earning_date: undefined,
      description: "",
      reference: "",
    },
  })

  const onSubmit = async (data: AdditionalEarningFormData) => {
    try {
      // Determine earning_date based on payroll context
      // Use weekEnd if available (to apply to current payroll period)
      let earningDate: string

      if (weekEnd) {
        earningDate = weekEnd
      } else if (data.earning_date) {
        earningDate = format(data.earning_date, "yyyy-MM-dd")
      } else {
        // Fallback to today
        earningDate = format(new Date(), "yyyy-MM-dd")
      }

      const payload = {
        employee: employeeId,
        earning_date: earningDate,
        category: data.category,
        amount: Number(data.amount),
        description: data.description || "",
        reference: data.reference || "",
        approved: true, // Auto-approve earnings added from payroll slip
      }

      await createMutation.mutateAsync(payload)
      form.reset()
      onOpenChange(false)
    } catch {
      // error is handled by mutation
    }
  }

  const getCategoryDescription = (cat: string) => {
    if (weekStart && weekEnd) {
      const periodText = `${format(new Date(weekStart), "MMM dd")} - ${format(new Date(weekEnd), "MMM dd, yyyy")}`
      switch (cat) {
        case "bonus":
          return `One-time bonus payment for the period ${periodText}`
        case "commission":
          return `Sales or service commission for the period ${periodText}`
        case "tip":
          return `Customer tips received during the period ${periodText}`
        case "performance":
          return `Performance-based incentive for the period ${periodText}`
        case "installation_pct":
          return `Installation commission/percentage for the period ${periodText}`
        case "allowance":
          return `Special allowance (travel, meal, etc.) for the period ${periodText}`
        case "other":
          return `Custom additional earning for the period ${periodText}`
        default:
          return ""
      }
    }
    return "This earning will be added to the employee's next payroll"
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Additional Earning</DialogTitle>
          <DialogDescription className="space-y-2">
            Create an additional earning for{" "}
            <span className="font-semibold">{employeeName}</span>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Earning Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {additionalEarningCategories.map((cat) => (
                        <SelectItem
                          key={cat.value}
                          value={cat.value}
                        >
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs">
                    {getCategoryDescription(field.value)}
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Amount (₱)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={field.value || ""}
                      onChange={(e) => {
                        const value = e.target.value
                        field.onChange(value === "" ? 0 : parseFloat(value))
                      }}
                      onBlur={field.onBlur}
                      name={field.name}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    This amount will be added to the payroll
                  </FormDescription>
                </FormItem>
              )}
            />

            {!weekEnd && (
              <FormField
                control={form.control}
                name="earning_date"
                render={({ field }) => (
                  <DatePicker
                    required
                    field={field}
                    label="Earning Date"
                    placeholder="Select date"
                    description="The date this earning applies to"
                  />
                )}
              />
            )}

            {weekStart && weekEnd && (
              <div className="text-sm bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-md p-3">
                <p className="font-medium text-green-900 dark:text-green-100 mb-1">
                  Earning Period
                </p>
                <p className="text-green-800 dark:text-green-200">
                  This earning will be applied to the current payroll period:{" "}
                  <span className="font-semibold">
                    {format(new Date(weekStart), "MMM dd")} -{" "}
                    {format(new Date(weekEnd), "MMM dd, yyyy")}
                  </span>
                </p>
              </div>
            )}

            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Invoice #, Project code"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Optional reference number or code
                  </FormDescription>
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
                    <Textarea
                      placeholder="Additional notes about this earning"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="text-xs bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-md p-3">
              <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                Examples:
              </p>
              <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                <li>Bonus: ₱1,000 holiday bonus</li>
                <li>Commission: ₱2,500 from sales or installations</li>
                <li>Customer Tip: ₱300 received from satisfied clients</li>
                <li>Performance: ₱1,500 for exceeding targets</li>
              </ul>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset()
                  onOpenChange(false)
                }}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Add Earning
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
