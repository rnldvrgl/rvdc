"use client"

import { ComboBox } from "@/components/custom/inputs/ComboBox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useChequeChoices } from "@/lib/queries/useChoices"
import { formatCurrency } from "@/lib/utils/helpers"
import { ChevronsRight, Plus, X } from "lucide-react"
import {
  Control,
  Controller,
  FieldArrayWithId,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  UseFormSetValue,
  useWatch,
} from "react-hook-form"

type Payment = {
  payment_type: string
  amount: number
  cheque_collection?: number | null
}

type FormValues = {
  client_id: number | null
  items: { item_id: number; quantity: number; final_price_per_unit: number }[]
  stall?: number | null
  payments: Payment[]
  manual_receipt_number?: string
}

type PaymentMethodSelectorProps = {
  control: Control<FormValues>
  fields: FieldArrayWithId<FormValues, "payments", "id">[]
  append: UseFieldArrayAppend<FormValues, "payments">
  remove: UseFieldArrayRemove
  setValue: UseFormSetValue<FormValues>
  disabled?: boolean
  required?: boolean
  totalItemsAmount?: number
  clientId?: number | null
}

export default function PaymentMethodSelector({
  fields,
  control,
  remove,
  append,
  setValue,
  disabled,
  totalItemsAmount = 0,
  clientId,
}: PaymentMethodSelectorProps) {
  const watchedPayments = useWatch({ control, name: "payments" })
  const { data: chequeChoices = [], rawData: chequeRawData = [] } =
    useChequeChoices(clientId ?? undefined)

  const totalPayments = (watchedPayments ?? []).reduce(
    (sum, p) => sum + (Number(p?.amount) || 0),
    0,
  )
  const remainingBalance = Math.max(0, totalItemsAmount - totalPayments)

  const handleAdd = () => {
    append({ payment_type: "cash", amount: 0, cheque_collection: null })
  }

  const handleAddWithFill = () => {
    append({
      payment_type: "cash",
      amount: remainingBalance > 0 ? remainingBalance : 0,
      cheque_collection: null,
    })
  }

  const handleFillRemaining = (
    idx: number,
    currentAmount: number,
    onChange: (val: number) => void,
  ) => {
    const otherPayments = (watchedPayments ?? []).reduce(
      (sum, p, i) => (i === idx ? sum : sum + (Number(p?.amount) || 0)),
      0,
    )
    const remaining = Math.max(0, totalItemsAmount - otherPayments)
    onChange(remaining)
  }

  return (
    <div className="space-y-2">
      {fields.length > 0 ? (
        <div className="space-y-2">
          {fields.map((field, idx) => {
            const currentPaymentType = watchedPayments?.[idx]?.payment_type
            const isChequePayment = currentPaymentType === "cheque"

            return (
              <div
                key={field.id}
                className="rounded-lg border p-2.5 space-y-2"
              >
                <div className="flex items-center gap-2">
                  {/* Type */}
                  <Controller
                    control={control}
                    name={`payments.${idx}.payment_type`}
                    render={({ field: typeField }) => (
                      <Select
                        value={typeField.value}
                        onValueChange={(value) => {
                          typeField.onChange(value)
                          // Clear cheque selection when changing away from cheque
                          if (value !== "cheque") {
                            const chequeField =
                              control._formValues.payments[idx]
                            if (chequeField) {
                              chequeField.cheque_collection = null
                            }
                          }
                        }}
                        disabled={disabled}
                      >
                        <SelectTrigger className="w-28 sm:w-32 h-8 text-sm shrink-0">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="gcash">GCash</SelectItem>
                          <SelectItem value="credit">Credit</SelectItem>
                          <SelectItem value="debit">Debit</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />

                  {/* Amount */}
                  <Controller
                    control={control}
                    name={`payments.${idx}.amount`}
                    render={({ field: amountField }) => {
                      const currentCheque =
                        watchedPayments?.[idx]?.cheque_collection
                      const isChequeSelected =
                        isChequePayment && !!currentCheque

                      return (
                        <div className="flex items-center gap-1 flex-1 min-w-0">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={amountField.value ?? ""}
                            onChange={(e) => {
                              const val = e.target.value
                              amountField.onChange(
                                val === "" ? null : parseFloat(val),
                              )
                            }}
                            disabled={disabled || isChequeSelected}
                            className="h-8 flex-1"
                            placeholder="Amount"
                          />
                          {remainingBalance > 0 &&
                            !disabled &&
                            !isChequeSelected && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="size-7 shrink-0 text-primary hover:text-primary/80"
                                      onClick={() =>
                                        handleFillRemaining(
                                          idx,
                                          Number(amountField.value) || 0,
                                          amountField.onChange,
                                        )
                                      }
                                    >
                                      <ChevronsRight className="size-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      Fill remaining:{" "}
                                      {formatCurrency(remainingBalance)}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                        </div>
                      )
                    }}
                  />

                  {/* Remove */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => remove(idx)}
                          disabled={disabled}
                        >
                          <X className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p>Remove payment</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* Cheque selector */}
                {isChequePayment && (
                  <div className="space-y-1 pl-1">
                    <Label className="text-xs text-muted-foreground">
                      Select Cheque
                    </Label>
                    <Controller
                      control={control}
                      name={`payments.${idx}.cheque_collection`}
                      render={({ field: chequeField }) => (
                        <ComboBox
                          options={chequeChoices}
                          value={chequeField.value ?? null}
                          onChange={(value) => {
                            chequeField.onChange(value)
                            // Auto-fill amount when cheque is selected
                            if (value && chequeRawData.length > 0) {
                              const selectedCheque = chequeRawData.find(
                                (c) => c.id === value,
                              )
                              if (selectedCheque) {
                                // Auto-fill amount from cheque value
                                setValue(
                                  `payments.${idx}.amount` as const,
                                  parseFloat(selectedCheque.cheque_amount),
                                )
                              }
                            }
                          }}
                          placeholder="Select a cheque..."
                          className="h-8"
                          disabled={disabled}
                        />
                      )}
                    />
                    <p className="text-xs text-muted-foreground">
                      Amount will be set to the cheque&apos;s value
                    </p>
                  </div>
                )}
              </div>
            )
          })}

          {/* Footer totals */}
          <div className="px-3 pt-1 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-medium tabular-nums">
                {formatCurrency(totalPayments)}
              </span>
            </div>
            {remainingBalance > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-amber-600 dark:text-amber-400">
                  Remaining
                </span>
                <span className="font-medium text-amber-600 dark:text-amber-400 tabular-nums">
                  {formatCurrency(remainingBalance)}
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="py-6 text-center text-sm text-muted-foreground border border-dashed rounded-lg">
          No payments added yet
        </div>
      )}

      {/* Add buttons */}
      <div className="flex gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 border-dashed"
                onClick={handleAdd}
                disabled={disabled}
              >
                <Plus className="size-3.5 mr-1.5" />
                Add Payment
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add a new payment method</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {remainingBalance > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={handleAddWithFill}
                  disabled={disabled}
                >
                  <ChevronsRight className="size-3.5 mr-1" />
                  {formatCurrency(remainingBalance)}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add payment with remaining balance</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  )
}
