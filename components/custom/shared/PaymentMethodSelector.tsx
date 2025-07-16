'use client'

import { Button } from '@/components/ui/button'
import { FormLabel } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Trash2 } from 'lucide-react'
import {
  Control,
  Controller,
  FieldArrayWithId,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
} from 'react-hook-form'

type Payment = {
  payment_type: string
  amount: number
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
  fields: FieldArrayWithId<FormValues, 'payments', 'id'>[]
  append: UseFieldArrayAppend<FormValues, 'payments'>
  remove: UseFieldArrayRemove
  disabled?: boolean
  required?: boolean
}

export default function PaymentMethodSelector({
  fields,
  control,
  remove,
  append,
  disabled,
  required,
}: PaymentMethodSelectorProps) {
  const handleAdd = () => {
    append({ payment_type: 'cash', amount: 0 })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-3">
        <FormLabel required={required}>Payments</FormLabel>
        <Button
          type="button"
          size="sm"
          onClick={handleAdd}
          disabled={disabled}
          className="flex items-center gap-1"
        >
          <Plus className="size-4" />
          Add Payment
        </Button>
      </div>

      {/* ✅ Desktop table */}
      <div className="hidden md:block">
        <div className="border rounded-xl overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead className="w-1/2">Type</TableHead>
                <TableHead className="w-1/2">Amount</TableHead>
                <TableHead className="w-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.length > 0 ? (
                <>
                  {fields.map((field, idx) => (
                    <TableRow
                      key={field.id}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <TableCell>
                        <Controller
                          control={control}
                          name={`payments.${idx}.payment_type`}
                          render={({ field }) => (
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                              disabled={disabled}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select type" />
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
                      </TableCell>
                      <TableCell>
                        <Controller
                          control={control}
                          name={`payments.${idx}.amount`}
                          render={({ field }) => (
                            <Input
                              type="number"
                              min="0"
                              step="1"
                              value={field.value ?? ''}
                              onChange={(e) => {
                                const val = e.target.value
                                field.onChange(
                                  val === '' ? null : parseFloat(val),
                                )
                              }}
                              disabled={disabled}
                              className="w-full"
                            />
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(idx)}
                          disabled={disabled}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No payments added
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ✅ Mobile card view */}
      <div className="md:hidden space-y-4">
        {fields.length > 0 ? (
          <>
            {fields.map((field, idx) => (
              <div
                key={field.id}
                className="rounded-xl border p-4 shadow-sm space-y-3"
              >
                <Controller
                  control={control}
                  name={`payments.${idx}.payment_type`}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={disabled}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type" />
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
                <Controller
                  control={control}
                  name={`payments.${idx}.amount`}
                  render={({ field }) => (
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const val = e.target.value
                        field.onChange(val === '' ? null : parseFloat(val))
                      }}
                      disabled={disabled}
                      className="w-full"
                    />
                  )}
                />
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(idx)}
                    disabled={disabled}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground border rounded-xl">
            No payments added
          </div>
        )}
      </div>
    </div>
  )
}
