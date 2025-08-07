'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'

import { ComboBox } from '@/components/custom/inputs/ComboBox'
import DatePicker from '@/components/custom/inputs/DatePicker'
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

import { ChequeStatus } from '@/lib/constants/general'
import { ChequeCollection } from '@/lib/constants/interface'
import { ChequeCollectionSchema } from '@/lib/constants/schema'
import { ChequeCollectionPayload } from '@/lib/constants/types'
import { useChequeCollectionMutations } from '@/lib/mutations/useChequeCollectionMutations'
import {
  useBanksChoices,
  useClientChoices,
  useUsersChoices,
} from '@/lib/queries/useChoices'
import { formatBackDate } from '@/lib/utils/helpers/date'

interface Props {
  initialData?: ChequeCollection
  onClose: () => void
}

export default function ChequeCollectionForm({ initialData, onClose }: Props) {
  const { addChequeCollection, updateChequeCollection } =
    useChequeCollectionMutations()
  const { data: clients, isLoading: clientsLoading } = useClientChoices()
  const { data: users, isLoading: usersLoading } = useUsersChoices()
  const { data: banks } = useBanksChoices()

  const isEditing = !!initialData

  const form = useForm<ChequeCollectionPayload>({
    resolver: zodResolver(ChequeCollectionSchema),
    defaultValues: {
      client:
        typeof initialData?.client === 'number'
          ? initialData.client
          : undefined,
      or_number: initialData?.or_number ?? '',
      bank_name: initialData?.bank_name ?? '',
      issued_by: initialData?.issued_by ?? '',
      collected_by:
        typeof initialData?.collected_by === 'number'
          ? initialData.collected_by
          : undefined,
      cheque_number: initialData?.cheque_number ?? '',
      billing_amount: initialData?.billing_amount
        ? Number(initialData.billing_amount)
        : undefined,
      date_collected: initialData?.date_collected
        ? new Date(initialData?.date_collected)
        : new Date(),
      cheque_amount:
        typeof initialData?.cheque_amount === 'number'
          ? initialData.cheque_amount
          : initialData?.cheque_amount
          ? Number(initialData.cheque_amount)
          : undefined,
      cheque_date: initialData?.cheque_date
        ? new Date(initialData.cheque_date)
        : undefined,
      notes: initialData?.notes ?? '',
      status: initialData?.status ?? ChequeStatus.PENDING,
    },
  })

  const mutationLoading =
    addChequeCollection.isPending || updateChequeCollection.isPending

  const clientOptions = useMemo(() => {
    if (clientsLoading) return [{ value: '', label: 'Loading...' }]
    return clients?.map((c) => ({ value: c.id, label: c.full_name })) ?? []
  }, [clients, clientsLoading])

  const userOptions = useMemo(() => {
    if (usersLoading) return [{ value: '', label: 'Loading...' }]
    return users?.map((u) => ({ value: u.id, label: u.full_name ?? '' })) ?? []
  }, [users, usersLoading])

  const onSubmit = (data: ChequeCollectionPayload) => {
    const payload = {
      ...data,
      cheque_date: new Date(formatBackDate(data.cheque_date)),
      date_collected: data.date_collected,
    }
    if (isEditing) {
      updateChequeCollection.mutate(
        { id: initialData!.id, data: payload },
        { onSuccess: onClose },
      )
    } else {
      addChequeCollection.mutate(payload, { onSuccess: onClose })
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 max-w-2xl"
      >
        {/* --- Section 1: Client & Billing --- */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-1">
            Client & Billing
          </h3>

          <FormField
            control={form.control}
            name="client"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Client</FormLabel>
                <FormControl>
                  <ComboBox
                    options={clientOptions}
                    value={field.value ?? null}
                    onChange={field.onChange}
                    placeholder="Select client"
                    disabled={mutationLoading || clientsLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {isEditing && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-1">
                Cheque Status
              </h3>
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Status</FormLabel>
                    <FormControl>
                      <ComboBox
                        options={[
                          { value: 'pending', label: 'Pending' },
                          { value: 'deposited', label: 'Deposited' },
                          { value: 'encashed', label: 'Encashed' },
                          { value: 'returned', label: 'Returned' },
                          { value: 'bounced', label: 'Bounced' },
                          { value: 'cancelled', label: 'Cancelled' },
                        ]}
                        value={field.value ?? null}
                        onChange={field.onChange}
                        placeholder="Select status"
                        disabled={mutationLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="billing_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Billing Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="1"
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(e.target.valueAsNumber || undefined)
                      }
                      placeholder="Enter amount"
                      disabled={mutationLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="or_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>OR Number</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter OR number"
                      disabled={mutationLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* --- Section 2: Cheque Details --- */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-1">
            Cheque Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="bank_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Bank</FormLabel>
                  <FormControl>
                    <ComboBox
                      options={banks ?? []}
                      value={field.value || null}
                      onChange={field.onChange}
                      placeholder="Select bank"
                      disabled={mutationLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cheque_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Cheque Number</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter cheque number"
                      disabled={mutationLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="cheque_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Cheque Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="1"
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(e.target.valueAsNumber || undefined)
                      }
                      placeholder="Enter amount"
                      disabled={mutationLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cheque_date"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <DatePicker
                      field={field}
                      placeholder="Pick a date"
                      className="w-full"
                      disabled={mutationLoading}
                      required
                      label="Cheque Date"
                      maxDate={
                        new Date(
                          new Date().setFullYear(new Date().getFullYear() + 1),
                        )
                      }
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="issued_by"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Issued By</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter issuer's name"
                    disabled={mutationLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* --- Section 3: Additional Info --- */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-1">
            Additional Info
          </h3>
          <FormField
            control={form.control}
            name="date_collected"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <DatePicker
                    field={field}
                    label="Date Collected"
                    placeholder="Pick a date"
                    className="w-full"
                    disabled={mutationLoading}
                    required
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="collected_by"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Collected By</FormLabel>
                <FormControl>
                  <ComboBox
                    options={userOptions}
                    value={field.value ?? null}
                    onChange={field.onChange}
                    placeholder="Select collector"
                    disabled={mutationLoading || usersLoading}
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty if delivered by client
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Optional notes..."
                    disabled={mutationLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* --- Actions --- */}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={mutationLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={mutationLoading}
          >
            {isEditing ? 'Update Cheque' : 'Save Cheque'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
