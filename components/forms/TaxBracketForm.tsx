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
import { Switch } from "@/components/ui/switch"
import {
  useCreateTaxBracket,
  useUpdateTaxBracket,
  type TaxBracketFormData,
} from "@/lib/mutations/useTaxBracketMutations"
import { TaxBracket } from "@/lib/queries/useTaxBracketQueries"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

const taxBracketSchema = z
  .object({
    bracket_type: z.enum(["bir", "sss", "philhealth", "pagibig", "custom"]),
    min_income: z.coerce.number().min(0, "Minimum income must be 0 or greater"),
    max_income: z.coerce
      .number()
      .positive("Maximum income must be greater than zero")
      .optional()
      .nullable(),
    base_tax: z.coerce.number().min(0, "Base tax must be 0 or greater"),
    rate: z.coerce
      .number()
      .min(0, "Tax rate must be 0 or greater")
      .max(1, "Tax rate cannot exceed 100% (1.0)"),
    effective_start: z.date(),
    effective_end: z.date().optional().nullable(),
    is_active: z.boolean(),
  })
  .refine(
    (data) => {
      if (data.max_income && data.max_income <= data.min_income) {
        return false
      }
      return true
    },
    {
      message: "Maximum income must be greater than minimum income",
      path: ["max_income"],
    },
  )
  .refine(
    (data) => {
      if (
        data.effective_end &&
        data.effective_start &&
        data.effective_end < data.effective_start
      ) {
        return false
      }
      return true
    },
    {
      message: "Effective end date must be after start date",
      path: ["effective_end"],
    },
  )

type TaxBracketFormValues = z.infer<typeof taxBracketSchema>

interface TaxBracketFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bracket?: TaxBracket | null
}

export function TaxBracketForm({
  open,
  onOpenChange,
  bracket,
}: TaxBracketFormProps) {
  const createMutation = useCreateTaxBracket()
  const updateMutation = useUpdateTaxBracket()

  const isEditMode = !!bracket

  const form = useForm<TaxBracketFormValues>({
    resolver: zodResolver(taxBracketSchema),
    defaultValues: {
      bracket_type: "bir",
      min_income: 0,
      max_income: null,
      base_tax: 0,
      rate: 0,
      effective_start: new Date(),
      effective_end: null,
      is_active: true,
    },
  })

  // Reset form when bracket changes or dialog opens
  useEffect(() => {
    if (open && bracket) {
      form.reset({
        bracket_type: bracket.bracket_type,
        min_income: parseFloat(bracket.min_income),
        max_income: bracket.max_income ? parseFloat(bracket.max_income) : null,
        base_tax: parseFloat(bracket.base_tax),
        rate: parseFloat(bracket.rate),
        effective_start: new Date(bracket.effective_start),
        effective_end: bracket.effective_end
          ? new Date(bracket.effective_end)
          : null,
        is_active: bracket.is_active,
      })
    } else if (open && !bracket) {
      form.reset({
        bracket_type: "bir",
        min_income: 0,
        max_income: null,
        base_tax: 0,
        rate: 0,
        effective_start: new Date(),
        effective_end: null,
        is_active: true,
      })
    }
  }, [open, bracket, form])

  const onSubmit = async (data: TaxBracketFormValues) => {
    try {
      const payload: TaxBracketFormData = {
        bracket_type: data.bracket_type,
        min_income: data.min_income,
        max_income: data.max_income || null,
        base_tax: data.base_tax,
        rate: data.rate,
        effective_start: format(data.effective_start, "yyyy-MM-dd"),
        effective_end: data.effective_end
          ? format(data.effective_end, "yyyy-MM-dd")
          : null,
        is_active: data.is_active,
      }

      if (isEditMode) {
        await updateMutation.mutateAsync({
          id: bracket.id,
          ...payload,
        })
      } else {
        await createMutation.mutateAsync(payload)
      }

      form.reset()
      onOpenChange(false)
    } catch {
      // error is handled by mutation
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Tax Bracket" : "Add Tax Bracket"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the tax bracket details below"
              : "Create a new tax bracket for progressive tax calculation"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
          >
            {/* Bracket Type */}
            <FormField
              control={form.control}
              name="bracket_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Bracket Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select bracket type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="bir">BIR Withholding Tax</SelectItem>
                      <SelectItem value="sss">SSS Contribution</SelectItem>
                      <SelectItem value="philhealth">
                        PhilHealth Contribution
                      </SelectItem>
                      <SelectItem value="pagibig">
                        Pag-IBIG Contribution
                      </SelectItem>
                      <SelectItem value="custom">
                        Custom Tax/Contribution
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Type of tax bracket (determines which calculations use these
                    brackets)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Income Range */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Income Range (Weekly)</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="min_income"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Minimum Income (₱)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? 0
                                : parseFloat(e.target.value),
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Minimum weekly income for this bracket (inclusive)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="max_income"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Income (₱)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Leave empty for no limit"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? null
                                : parseFloat(e.target.value),
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum weekly income (inclusive). Leave empty for no
                        upper limit.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Tax Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Tax Calculation</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="base_tax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Base Tax (₱)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? 0
                                : parseFloat(e.target.value),
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Base tax amount for this bracket
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Tax Rate (decimal)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.0001"
                          min="0"
                          max="1"
                          placeholder="e.g., 0.20 for 20%"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? 0
                                : parseFloat(e.target.value),
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Tax rate as decimal (0.20 = 20%)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Effective Period */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Effective Period</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="effective_start"
                  render={({ field }) => (
                    <DatePicker
                      required
                      field={field}
                      label="Effective Start Date"
                      placeholder="Select start date"
                      description="Date this bracket becomes effective"
                    />
                  )}
                />

                <FormField
                  control={form.control}
                  name="effective_end"
                  render={({ field }) => (
                    <DatePicker
                      field={{
                        ...field,
                        value: field.value ?? undefined,
                        onChange: (date) => field.onChange(date ?? null),
                      }}
                      label="Effective End Date"
                      placeholder="Leave empty if still active"
                      description="Date this bracket stops being effective"
                    />
                  )}
                />
              </div>
            </div>

            {/* Active Status */}
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Status</FormLabel>
                    <FormDescription>
                      Only active brackets are used in tax calculations
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Info Box */}
            <div className="text-xs bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-md p-3">
              <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                Progressive Tax Calculation
              </p>
              <p className="text-blue-800 dark:text-blue-200 mb-2">
                Tax is calculated cumulatively across all brackets. Each bracket
                applies its rate only to the income within that bracket&apos;s
                range.
              </p>
              <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                Example:
              </p>
              <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                <li>₱0 - ₱2,500: Base ₱0, Rate 0%</li>
                <li>₱2,501 - ₱5,000: Base ₱0, Rate 20% on excess</li>
                <li>If income = ₱5,000: Tax = ₱0 + (₱2,500 × 0.20) = ₱500</li>
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
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
              >
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEditMode ? "Update" : "Create"} Bracket
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
