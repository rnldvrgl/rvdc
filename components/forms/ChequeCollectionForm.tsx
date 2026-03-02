"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"

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
import {
  useBanksChoices,
  useClientChoices,
  useUsersChoices,
} from "@/lib/queries/useChoices"
import { formatBackDate } from "@/lib/utils/helpers/date"
import {
  Banknote,
  CalendarCheck,
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

const STATUS_VARIANT: Record<
  string,
  "default" | "success" | "destructive" | "secondary" | "outline"
> = {
  pending: "secondary",
  deposited: "default",
  encashed: "success",
  returned: "outline",
  bounced: "destructive",
  cancelled: "destructive",
}

// ── Section wrapper ────────────────────────────────────

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-4 rounded-xl border bg-background p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold leading-tight">{title}</h3>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      <Separator />
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
  const [sameAsClient, setSameAsClient] = useState(true)
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

  const clientOptions = useMemo(() => {
    if (clientsLoading) return [{ value: "", label: "Loading..." }]
    return clients?.map((c) => ({ value: c.id, label: c.full_name })) ?? []
  }, [clients, clientsLoading])

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

  const difference =
    chequeAmount && billingAmount
      ? Number(chequeAmount) - Number(billingAmount)
      : null

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-5"
      >
        {/* ── Section 1: Status & Client ── */}
        <Section
          icon={Users}
          title="Client & Status"
          description="Who is this cheque from?"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>
                    <span className="flex items-center gap-2">
                      Status
                      {field.value && (
                        <Badge
                          variant={STATUS_VARIANT[field.value] ?? "secondary"}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {field.value}
                        </Badge>
                      )}
                    </span>
                  </FormLabel>
                  <FormControl>
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
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

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
        </Section>

        {/* ── Section 2: Cheque Details ── */}
        <Section
          icon={CreditCard}
          title="Cheque Details"
          description="Bank, number, amount, and date"
        >
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

          <Separator />

          {/* Issued by */}
          <div className="flex items-center gap-2 mb-1">
            <Checkbox
              id="sameAsClient"
              checked={sameAsClient}
              onCheckedChange={(checked) => setSameAsClient(!!checked)}
              disabled={mutationLoading}
            />
            <label
              htmlFor="sameAsClient"
              className="text-sm font-medium leading-none cursor-pointer select-none"
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
        </Section>

        {/* ── Section 3: Billing & Amount Summary ── */}
        <Section
          icon={Banknote}
          title="Billing"
          description="Billing amount and official receipt"
        >
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
                      placeholder="e.g. OR-2025-0001"
                      disabled={mutationLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Quick amount comparison */}
          {difference !== null && (
            <div className="rounded-lg bg-muted/60 border px-4 py-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Cheque vs Billing difference
              </span>
              <span
                className={`font-semibold ${
                  difference > 0
                    ? "text-emerald-600"
                    : difference < 0
                      ? "text-rose-600"
                      : "text-muted-foreground"
                }`}
              >
                {difference > 0 ? "+" : ""}₱
                {Math.abs(difference).toLocaleString("en-PH", {
                  minimumFractionDigits: 2,
                })}
                {difference === 0 && " (exact match)"}
              </span>
            </div>
          )}
        </Section>

        {/* ── Section 4: Collection Info ── */}
        <Section
          icon={CalendarCheck}
          title="Collection"
          description="When and who collected the cheque"
        >
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
                  <p className="text-xs text-muted-foreground">
                    Leave empty if delivered by client
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Section>

        {/* ── Section 5: Notes ── */}
        <Section
          icon={FileText}
          title="Notes"
          description="Any additional remarks"
        >
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Add optional notes here..."
                    rows={3}
                    disabled={mutationLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </Section>

        {/* ── Actions ── */}
        <div className="flex justify-end gap-2 pt-2">
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
            {mutationLoading ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <Save className="size-4 mr-2" />
            )}
            {isEditing ? "Update Cheque" : "Save Cheque"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
