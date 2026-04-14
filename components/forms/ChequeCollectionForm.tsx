"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useMemo, useRef, useState } from "react"
import { useForm } from "react-hook-form"

import {
  ClientComboBox,
  useClients,
} from "@/components/custom/inputs/ClientComboBox"
import { ComboBox } from "@/components/custom/inputs/ComboBox"
import DatePicker from "@/components/custom/inputs/DatePicker"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

import { ChequeStatus } from "@/lib/constants/general"
import { ChequeCollection } from "@/lib/constants/interface"
import { ChequeCollectionSchema } from "@/lib/constants/schema"
import { ChequeCollectionPayload } from "@/lib/constants/types"
import { useChequeCollectionMutations } from "@/lib/mutations/useChequeCollectionMutations"
import { useBanksChoices, useUsersChoices } from "@/lib/queries/useChoices"
import { getBadgeVariant } from "@/lib/utils/helpers"
import { formatBackDate } from "@/lib/utils/helpers/date"
import {
  Banknote,
  CreditCard,
  FileText,
  Loader2,
  Save,
  Users,
} from "lucide-react"

// ── Status colour map ──────────────────────────────────

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "deposited", label: "Deposited" },
  { value: "encashed", label: "Encashed" },
  { value: "returned", label: "Returned" },
  { value: "bounced", label: "Bounced" },
  { value: "cancelled", label: "Cancelled" },
] as const

// ── Section wrapper ────────────────────────────────────

function Section({
  icon: Icon,
  title,
  children,
  className,
}: {
  icon: React.ElementType
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`space-y-4 rounded-xl border bg-card p-5 shadow-sm ${className || ""}`}
    >
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center size-9 rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <h3 className="text-sm font-semibold sm:text-base">{title}</h3>
      </div>
      <Separator className="bg-border/60" />
      {children}
    </div>
  )
}

// ── Form ───────────────────────────────────────────────

interface Props {
  initialData?: ChequeCollection
  onClose: () => void
}

export default function ChequeCollectionForm({ initialData, onClose }: Props) {
  const submitLockRef = useRef(false)
  const [sameAsClient, setSameAsClient] = useState(true)
  const { addChequeCollection, updateChequeCollection } =
    useChequeCollectionMutations()
  const { clients, isLoading: clientsLoading } = useClients()
  const { data: users, isLoading: usersLoading } = useUsersChoices()
  const { data: banks } = useBanksChoices()

  const isEditing = !!initialData

  const form = useForm<ChequeCollectionPayload>({
    resolver: zodResolver(ChequeCollectionSchema),
    defaultValues: {
      client:
        typeof initialData?.client === "number"
          ? initialData.client
          : undefined,
      status: initialData?.status ?? ChequeStatus.PENDING,
      bank_name: initialData?.bank_name ?? "",
      deposit_bank: initialData?.deposit_bank ?? "",
      cheque_number: initialData?.cheque_number ?? "",
      cheque_amount: initialData?.cheque_amount
        ? Number(initialData.cheque_amount)
        : undefined,
      cheque_date: initialData?.cheque_date
        ? new Date(initialData.cheque_date)
        : undefined,
      issued_by: initialData?.issued_by ?? "",
      billing_amount: initialData?.billing_amount
        ? Number(initialData.billing_amount)
        : undefined,
      or_number: initialData?.or_number ?? "",
      date_collected: initialData?.date_collected
        ? new Date(initialData.date_collected)
        : undefined,
      collected_by:
        typeof initialData?.collected_by === "number"
          ? initialData.collected_by
          : undefined,
      notes: initialData?.notes ?? "",
    },
  })

  const mutationLoading =
    addChequeCollection.isPending || updateChequeCollection.isPending

  const userOptions = useMemo(() => {
    if (usersLoading) return [{ value: "", label: "Loading..." }]
    return users?.map((u) => ({ value: u.id, label: u.full_name ?? "" })) ?? []
  }, [users, usersLoading])

  const selectedClientId = form.watch("client")
  const selectedStatus = form.watch("status")
  const chequeAmount = form.watch("cheque_amount")
  const billingAmount = form.watch("billing_amount")

  // Auto-fill issued_by when sameAsClient is true
  useEffect(() => {
    if (sameAsClient && selectedClientId && clients) {
      const clientName =
        clients.find((c) => c.id === selectedClientId)?.full_name || ""
      form.setValue("issued_by", clientName)
    }
  }, [sameAsClient, selectedClientId, clients, form])

  useEffect(() => {
    if (!["deposited", "encashed"].includes(selectedStatus || "")) {
      form.setValue("deposit_bank", "")
    }
  }, [selectedStatus, form])

  const onSubmit = async (data: ChequeCollectionPayload) => {
    if (submitLockRef.current || mutationLoading) return
    submitLockRef.current = true

    const payload = {
      ...data,
      cheque_date: new Date(formatBackDate(data.cheque_date)),
      date_collected: data.date_collected,
    }

    try {
      if (isEditing) {
        await updateChequeCollection.mutateAsync({ id: initialData!.id, data: payload })
      } else {
        await addChequeCollection.mutateAsync(payload)
      }

      onClose()
    } finally {
      submitLockRef.current = false
    }
  }

  const difference =
    chequeAmount && billingAmount
      ? Number(chequeAmount) - Number(billingAmount)
      : null

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
      >
        {/* Client & Status */}
        <Section
          icon={Users}
          title="Client & Status"
        >
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="client"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Client</FormLabel>
                  <FormControl>
                    <ClientComboBox
                      value={field.value ?? null}
                      onChange={field.onChange}
                      disabled={mutationLoading || clientsLoading}
                      nameOnly
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Status</FormLabel>
                  <div className="flex items-center gap-2">
                    <FormControl className="flex-1">
                      <ComboBox
                        options={STATUS_OPTIONS.map((o) => ({
                          value: o.value,
                          label: o.label,
                        }))}
                        value={field.value ?? null}
                        onChange={field.onChange}
                        placeholder="Select status"
                        disabled={mutationLoading}
                      />
                    </FormControl>
                    {field.value && (
                      <Badge
                        variant={getBadgeVariant(field.value)}
                        className="px-2.5 py-1"
                      >
                        {field.value}
                      </Badge>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Conditional Deposit Bank */}
            {["deposited", "encashed"].includes(selectedStatus || "") && (
              <FormField
                control={form.control}
                name="deposit_bank"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Deposit Bank</FormLabel>
                    <FormControl>
                      <ComboBox
                        options={banks ?? []}
                        value={field.value || null}
                        onChange={field.onChange}
                        placeholder="Select deposit bank"
                        disabled={mutationLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </Section>

        {/* Cheque Information */}
        <Section
          icon={CreditCard}
          title="Cheque Information"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bank_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Issuing Bank</FormLabel>
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
                        placeholder="e.g. 001234567"
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
                    <FormLabel required>Cheque Amount (₱)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.valueAsNumber || undefined)
                        }
                        placeholder="0.00"
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
                    <DatePicker
                      field={field}
                      placeholder="Pick a date"
                      label="Cheque Date"
                      disabled={mutationLoading}
                      required
                      maxDate={
                        new Date(
                          new Date().setFullYear(new Date().getFullYear() + 1),
                        )
                      }
                    />
                  </FormItem>
                )}
              />
            </div>

            <Separator className="my-2" />

            <div className="flex items-center gap-2.5 mb-3">
              <Checkbox
                id="sameAsClient"
                checked={sameAsClient}
                onCheckedChange={(checked) => setSameAsClient(!!checked)}
                disabled={mutationLoading}
              />
              <label
                htmlFor="sameAsClient"
                className="text-sm font-medium cursor-pointer select-none"
              >
                Issuer is same as client
              </label>
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
                      placeholder="Name on the cheque"
                      disabled={mutationLoading || sameAsClient}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Section>

        {/* Billing & Collection */}
        <Section
          icon={Banknote}
          title="Billing & Collection"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="billing_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Billing Amount (₱)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.valueAsNumber || undefined)
                        }
                        placeholder="0.00"
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
                        placeholder="e.g. OR-2026-0001"
                        disabled={mutationLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Amount Comparison */}
            {difference !== null && (
              <div
                className={`rounded-lg border-2 px-4 py-3 flex items-center justify-between ${
                  difference > 0
                    ? "bg-emerald-50 border-emerald-200"
                    : difference < 0
                      ? "bg-rose-50 border-rose-200"
                      : "bg-muted border-border"
                }`}
              >
                <span className="text-sm font-medium text-muted-foreground">
                  {difference === 0 ? "Exact Match" : "Difference"}
                </span>
                <span
                  className={`text-lg font-bold ${
                    difference > 0
                      ? "text-success"
                      : difference < 0
                        ? "text-rose-700"
                        : "text-muted-foreground"
                  }`}
                >
                  {difference > 0 ? "+" : ""}₱
                  {Math.abs(difference).toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            )}

            <Separator className="my-2" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date_collected"
                render={({ field }) => (
                  <FormItem>
                    <DatePicker
                      field={field}
                      label="Date Collected"
                      placeholder="Pick a date"
                      disabled={mutationLoading}
                    />
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
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Leave empty if delivered by client
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </Section>

        {/* Notes */}
        <Section
          icon={FileText}
          title="Notes"
        >
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Add any additional remarks or important information..."
                    rows={4}
                    disabled={mutationLoading}
                    className="resize-none"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </Section>

        {/* Actions */}
        <div className="sticky bottom-0 z-10 -mx-1 mt-4 border-t bg-background/95 px-1 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={mutationLoading}
              className="w-full sm:min-w-[100px] sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutationLoading}
              className="w-full sm:min-w-[140px] sm:w-auto"
            >
              {mutationLoading ? (
                <Loader2 className="size-4 mr-2 animate-spin" />
              ) : (
                <Save className="size-4 mr-2" />
              )}
              {mutationLoading ? "Saving..." : isEditing ? "Update Cheque" : "Save Cheque"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  )
}
