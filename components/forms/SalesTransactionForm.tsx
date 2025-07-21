'use client'

import { ComboBox } from '@/components/custom/inputs/ComboBox'
import { ConfirmDialog } from '@/components/custom/shared/ConfirmDialog'
import EntityDialog from '@/components/custom/shared/EntityDialog'
import ItemQuantitySelector from '@/components/custom/shared/ItemQuantitySelector'
import PaymentMethodSelector from '@/components/custom/shared/PaymentMethodSelector'
import { SalesTransactionPrintContent } from '@/components/custom/shared/SalesTransactionPrintContent '
import SaleTransactionVoidingForm from '@/components/forms/SaleTransactionVoidingForm'
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
import {
  Item,
  ItemEntry,
  SalesTransaction,
  Stall,
} from '@/lib/constants/interface'
import { Client } from '@/lib/constants/types'
import { useCurrentUser } from '@/lib/hooks/useCurrentUser'
import { useEntitySheetDialog } from '@/lib/hooks/useEntityDialog'
import { useItemSelection } from '@/lib/hooks/useItemSelection'
import { usePrint } from '@/lib/hooks/usePrint'
import { useSalesTransactionMutations } from '@/lib/mutations/useSalesTransactionMutations'
import {
  useClientChoices,
  useItemChoices,
  useStallChoices,
} from '@/lib/queries/useChoices'
import { formatCurrency } from '@/lib/utils/helpers'
import { zodResolver } from '@hookform/resolvers/zod'
import { Printer, RotateCcw, Save, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import * as z from 'zod'

interface SalesTransactionFormProps {
  initialData?: SalesTransaction
  onClose: () => void
}

export default function SalesTransactionForm({
  initialData,
  onClose,
}: SalesTransactionFormProps) {
  const [isFakePrint, setIsFakePrint] = useState(false)
  const { assigned_stall, role } = useCurrentUser()
  const formSchema = z.object({
    stall:
      role === 'admin'
        ? z.number({
            required_error: 'Stall is required',
            invalid_type_error: 'Stall is required',
          })
        : z.number().nullable().optional(),
    client_id: z
      .number({
        required_error: 'Client is required',
      })
      .nullable(),
    manual_receipt_number: z.string().optional(),
    payments: z
      .array(
        z.object({
          payment_type: z.string().min(1, 'Payment type is required'),
          amount: z.number().min(1, 'Amount must be a positive number'),
        }),
      )
      .min(1, 'At least one payment is required'),
    items: z
      .array(
        z.object({
          item_id: z.number(),
          quantity: z.number().min(1, 'Quantity must be at least 1'),
          final_price_per_unit: z.number().min(0),
          print_price_per_unit: z.number().min(0).optional(),
        }),
      )
      .min(1, 'at least one item is required'),
  })

  type FormValues = z.infer<typeof formSchema>

  const resolver = zodResolver(formSchema)
  const form = useForm<FormValues>({
    resolver,
    defaultValues: {
      stall: initialData?.stall?.id ?? null,
      client_id: initialData?.client?.id,
      manual_receipt_number: initialData?.manual_receipt_number ?? '',
      payments:
        initialData?.payments?.map((i) => ({
          payment_type: i.payment_type,
          amount: Number(i.amount) ?? 0,
        })) ?? [],
      items:
        initialData?.items?.map((i) => ({
          item_id: i.item?.id ?? 0,
          quantity: i.quantity ?? 0,
          final_price_per_unit:
            Number(i.final_price_per_unit) ?? Number(i.item?.retail_price) ?? 0,
          print_price_per_unit: Number(i.item?.retail_price) ?? 0,
        })) ?? [],
    },
    mode: 'onChange',
  })

  const [stall, setStall] = useState<Stall | null>(null)
  const { data: stalls } = useStallChoices({})

  const [createdTransaction, setCreatedTransaction] =
    useState<SalesTransaction | null>(null)
  const { data: allItemsData } = useItemChoices()
  const { data: clientsData } = useClientChoices()
  const allItems: Item[] = allItemsData ?? []
  const clients: Client[] = clientsData ?? []
  const { addTransaction, updateTransaction } = useSalesTransactionMutations()
  const isVoided = initialData?.voided
  const isDisabled = form.formState.isSubmitting || isVoided

  const {
    entityState: voidingState,
    openEntity: openVoiding,
    closeEntity: closeVoiding,
  } = useEntitySheetDialog<SalesTransaction>()

  const {
    printRef,
    showPrintDialog,
    confirmPrint,
    cancelPrint,
    setShowPrintDialog,
  } = usePrint({
    documentTitle: 'Receipt',
    requireConfirmation: true,
  })

  const { fields, append, remove } = useFieldArray<FormValues, 'payments'>({
    control: form.control,
    name: 'payments',
  })

  const watchedItems = form.watch('items')
  const watchedPayments = form.watch('payments')

  const totalItemsAmount = watchedItems.reduce(
    (acc, i) => acc + i.quantity * i.final_price_per_unit,
    0,
  )
  const totalPayments = watchedPayments.reduce((acc, p) => acc + p.amount, 0)
  const changeDue = totalPayments - totalItemsAmount

  useEffect(() => {
    if (!initialData) return

    // Ensure choices are loaded before setting
    if (!allItemsData || (role === 'admin' && !stalls)) return

    // Stall setup
    if (role === 'admin') {
      const found = stalls?.find((s) => s.id === initialData.stall?.id) ?? null
      setStall(found)
      form.setValue('stall', found?.id ?? null)
    } else if (assigned_stall) {
      setStall(assigned_stall)
      form.setValue('stall', assigned_stall.id)
    }

    // Items setup
    const initialItems =
      initialData.items?.map((i) => ({
        item_id: i.item?.id ?? 0,
        quantity: i.quantity ?? 0,
        final_price_per_unit:
          Number(i.final_price_per_unit) ?? Number(i.item?.retail_price) ?? 0,
      })) ?? []
    form.setValue('items', initialItems)

    setItems(
      initialData.items?.map((i) => ({
        item: i.item ?? null,
        quantity: i.quantity ?? 0,
      })) ?? [],
    )

    // Payments, client, receipt
    form.setValue('client_id', initialData.client?.id ?? null)
    form.setValue(
      'manual_receipt_number',
      initialData.manual_receipt_number ?? '',
    )
    form.setValue(
      'payments',
      initialData.payments?.map((p) => ({
        payment_type: p.payment_type,
        amount: Number(p.amount) ?? 0,
      })) ?? [],
    )
  }, [initialData, allItemsData, stalls, assigned_stall, role, form.setValue])

  const handleSubmit = (data: FormValues) => {
    const payload = {
      stall: role == 'admin' ? data.stall : assigned_stall?.id ?? null,
      client: data.client_id ?? null,
      manual_receipt_number: data.manual_receipt_number ?? null,
      items: data.items.map((i) => ({
        item: i.item_id,
        quantity: i.quantity,
        final_price_per_unit: i.final_price_per_unit,
      })),
      payments: data.payments.map((p) => ({
        payment_type: p.payment_type,
        amount: p.amount,
      })),
    }

    if (initialData) {
      updateTransaction.mutate(
        { id: initialData.id, data: payload },
        { onSuccess: onClose },
      )
    } else {
      addTransaction.mutate(payload, {
        onSuccess: (data: { data: SalesTransaction }) => {
          const formItems = form.getValues().items

          const isFakePrint = formItems.some((item) => {
            const finalPrice = Number(item?.final_price_per_unit ?? 0)
            const printPrice = Number(item.print_price_per_unit ?? finalPrice)
            return printPrice !== finalPrice
          })

          setIsFakePrint(isFakePrint)

          const printPrices = formItems.map((i) => i.print_price_per_unit)
          console.log(printPrices)

          const itemsWithPrintPrice = data.data.items.map((item, idx) => ({
            ...item,
            final_price_per_unit: item.final_price_per_unit,
            print_price_per_unit: printPrices[idx],
          }))

          setCreatedTransaction({
            ...data.data,
            items: itemsWithPrintPrice,
          })

          setShowPrintDialog(true)
        },
      })
    }
  }

  const { items, setItems } = useItemSelection<
    Item,
    ItemEntry,
    SalesTransaction
  >({
    initialData,
    allItems,
    getInitialItems: (data) =>
      data.items?.map((i) => ({
        item: i.item ?? null,
        quantity: i.quantity ?? 0,
      })) ?? [],
  })

  return (
    <>
      <div className="hidden">
        <SalesTransactionPrintContent
          ref={printRef}
          entity={createdTransaction}
          stall={stall}
        />
      </div>

      {initialData && (
        <div className="w-full flex justify-end mb-4">
          <Button
            type="button"
            variant={isVoided ? 'secondary' : 'destructive'}
            onClick={() => openVoiding()}
          >
            {isVoided ? (
              <>
                <RotateCcw className="mr-2 h-4 w-4" /> Reactivate
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" /> Void Transaction
              </>
            )}
          </Button>
        </div>
      )}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-3"
        >
          <div className="grid grid-cols-1 space-y-3">
            {role && role === 'admin' && (
              <FormField
                name="stall"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Stall</FormLabel>
                    <ComboBox
                      disabled={isDisabled}
                      options={
                        stalls?.map((s) => ({
                          value: s.id,
                          label: s.name,
                        })) ?? []
                      }
                      value={field.value ? Number(field.value) : null}
                      onChange={(val) => {
                        field.onChange(val ?? null)
                        setStall(stalls?.find((s) => s.id === val) ?? null)
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
              name="manual_receipt_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Manual Receipt #</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isDisabled}
                      {...field}
                      placeholder="e.g. 001245"
                      className="rounded-md"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Client</FormLabel>
                  <ComboBox
                    disabled={isDisabled}
                    options={clients.map((c) => ({
                      value: c.id,
                      label: `${c.full_name} (${c.contact_number})`,
                    }))}
                    value={field.value ? Number(field.value) : null}
                    onChange={(val) => field.onChange(val ?? null)}
                    placeholder="Select client"
                  />

                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-3">
            <ItemQuantitySelector
              disabled={isDisabled}
              required
              items={items}
              allItems={allItems}
              onChange={(updatedItems) => {
                form.setValue(
                  'items',
                  updatedItems.map((i) => ({
                    item_id: i.item?.id ?? 0,
                    quantity: i.quantity,
                    final_price_per_unit:
                      i.final_price_per_unit ??
                      Number(i.item?.retail_price) ??
                      0,
                    print_price_per_unit:
                      i.print_price_per_unit ??
                      i.final_price_per_unit ??
                      Number(i.item?.retail_price) ??
                      0,
                  })),
                )
                setItems(updatedItems)
              }}
              allowPriceChange
            />
            {form.formState.errors.items && (
              <p className="text-sm font-medium text-destructive">
                {form.formState.errors.items.message}
              </p>
            )}
          </div>

          <div className="grid gap-3">
            <PaymentMethodSelector
              control={form.control}
              fields={fields}
              append={append}
              remove={remove}
              disabled={isDisabled}
              required
            />
            {form.formState.errors.payments && (
              <p className="text-sm font-medium text-destructive">
                {form.formState.errors.payments?.root?.message}
              </p>
            )}
          </div>

          <div className="border-t pt-6 space-y-3 text-[15px]">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Items:</span>
              <span className="font-semibold text-base">
                {formatCurrency(totalItemsAmount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payments:</span>
              <span className="font-semibold text-base text-primary">
                {formatCurrency(totalPayments)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Change / Due:</span>
              <span
                className={`font-semibold text-base ${
                  changeDue >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-destructive'
                }`}
              >
                {formatCurrency(changeDue)}
              </span>
            </div>
          </div>

          {!isVoided && (
            <Button
              type="submit"
              className="w-full mt-6"
              disabled={
                !form.formState.isDirty ||
                form.formState.isSubmitting ||
                !form.formState.isValid
              }
            >
              <Save className="mr-2 h-4 w-4" />
              {initialData ? 'Update Transaction' : 'Create Transaction'}
            </Button>
          )}
        </form>
      </Form>
      <ConfirmDialog
        open={showPrintDialog}
        onConfirm={() => {
          confirmPrint()
          onClose()
        }}
        onCancel={() => {
          cancelPrint()
          onClose()
        }}
        title="Print Receipt?"
        description="Transaction created successfully. Would you like to print the receipt now?"
        Icon={Printer}
        confirmText="Print"
        cancelText="No, thanks"
      />

      <EntityDialog<SalesTransaction>
        open={voidingState.open}
        onClose={() => {
          closeVoiding()
          onClose()
        }}
        title="Void Transaction"
        description="Are you sure you want to void this transaction?"
        withCloseConfirmation
        renderForm={({ forceClose }) => (
          <SaleTransactionVoidingForm
            onClose={forceClose}
            entity={initialData}
          />
        )}
      />
    </>
  )
}
