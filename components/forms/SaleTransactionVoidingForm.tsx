"use client"

import { Detail } from "@/components/details/Detail"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { SalesTransaction } from "@/lib/constants/interface"
import { useSalesTransactionMutations } from "@/lib/mutations/useSalesTransactionMutations"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

const voidSchema = z.object({
  void_reason: z.string().min(1, "Void reason is required."),
})

type FormValues = z.infer<typeof voidSchema>

const SaleTransactionVoidingForm = ({
  entity,
  onClose,
}: {
  entity?: SalesTransaction
  onClose: () => void
}) => {
  const { voidTransaction, unvoidTransaction } = useSalesTransactionMutations()

  const form = useForm<FormValues>({
    resolver: zodResolver(voidSchema),
    defaultValues: {
      void_reason: "",
    },
  })

  const handleVoid = async (values: FormValues) => {
    if (!entity) {
      toast.error("Failed to void transaction. Please try again.")
      return
    }
    voidTransaction.mutate(
      { id: entity.id, data: values },
      { onSuccess: onClose },
    )
  }

  const handleUnvoid = () => {
    if (!entity) {
      toast.error("Failed to unvoid transaction. Please try again.")
      return
    }
    unvoidTransaction.mutate(entity.id, { onSuccess: onClose })
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-[15px]">
        <Detail
          label="Client"
          value={entity?.client?.full_name ?? "N/A"}
        />
        <Detail
          label="Stall"
          value={entity?.stall?.name ?? "N/A"}
        />
        <Detail
          label="Total Amount"
          value={`₱ ${
            entity?.computed_total
              ? parseFloat(entity.computed_total).toLocaleString()
              : "0.00"
          }`}
        />
        <Detail
          label="Official Receipt #"
          value={
            entity?.manual_receipt_number ||
            entity?.system_receipt_number ||
            "N/A"
          }
        />
      </div>

      {!entity?.voided ? (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleVoid)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="void_reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Void Reason <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter reason for voiding..."
                      className="min-h-[80px] max-h-36"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 border-t mt-8 pt-6">
              <Button
                type="submit"
                variant="destructive"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "Voiding..." : "Confirm Void"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={onClose}
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      ) : (
        <div className="space-y-6">
          <p className="text-center text-lg font-medium text-muted-foreground">
            This sale is currently{" "}
            <span className="text-destructive font-bold">VOIDED</span>.
          </p>
          <div className="grid gap-4 border-t mt-6 pt-6">
            <Button
              type="button"
              variant="default"
              className="w-full"
              onClick={handleUnvoid}
              disabled={unvoidTransaction.isPending}
            >
              {unvoidTransaction.isPending
                ? "Restoring..."
                : "Unvoid Transaction"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SaleTransactionVoidingForm
