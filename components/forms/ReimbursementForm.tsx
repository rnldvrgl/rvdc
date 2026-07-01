"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Expense } from "@/lib/constants/interface"
import { useExpenseMutations } from "@/lib/mutations/useExpenseMutations"
import { formatCurrency } from "@/lib/utils/helpers"
import { formatDate } from "@/lib/utils/helpers/date"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import z from "zod"

interface ReimbursementFormProps {
    expense: Expense
    onClose: () => void
}

export default function ReimbursementForm({
    expense,
    onClose,
}: ReimbursementFormProps) {
    const remainingBalance =
        (expense.total_price ?? 0) - (expense.reimbursed_amount ?? 0)

    const formSchema = z.object({
        amount: z
            .number()
            .min(0.01, { message: "Amount must be greater than 0" })
            .max(remainingBalance, {
                message: `Amount cannot exceed remaining balance of ${formatCurrency(remainingBalance)}`,
            }),
        reimbursement_method: z.string().min(1, {
            message: "Reimbursement method is required",
        }),
        notes: z.string().optional(),
    })

    type FormValues = z.infer<typeof formSchema>

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            amount: remainingBalance,
            reimbursement_method: "cash",
            notes: "",
        },
    })

    const { recordReimbursement } = useExpenseMutations()

    const onSubmit = (data: FormValues) => {
        recordReimbursement.mutate(
            {
                id: expense.id,
                data: {
                    amount: data.amount,
                    reimbursement_method: data.reimbursement_method,
                    notes: data.notes,
                },
            },
            { onSuccess: onClose },
        )
    }

    const isLoading = recordReimbursement.isPending

    return (
        <div className="space-y-6 max-w-2xl">
            {/* Expense Summary - Read-only reference */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Expense Reference</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <p className="text-muted-foreground">Description</p>
                            <p className="font-medium">{expense.description}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Date</p>
                            <p className="font-medium">
                                {expense.expense_date
                                    ? formatDate(new Date(expense.expense_date), "MMM dd, yyyy")
                                    : "N/A"}
                            </p>
                        </div>
                        {expense.vendor && (
                            <div>
                                <p className="text-muted-foreground">Vendor</p>
                                <p className="font-medium">{expense.vendor}</p>
                            </div>
                        )}
                        {expense.category_data?.name && (
                            <div>
                                <p className="text-muted-foreground">Category</p>
                                <p className="font-medium">{expense.category_data.name}</p>
                            </div>
                        )}
                        <div>
                            <p className="text-muted-foreground">Total Amount</p>
                            <p className="font-medium">
                                {formatCurrency(expense.total_price)}
                            </p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Already Reimbursed</p>
                            <p className="font-medium">
                                {formatCurrency(expense.reimbursed_amount ?? 0)}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t">
                        <span className="text-sm text-muted-foreground">
                            Remaining Balance:
                        </span>
                        <Badge variant={remainingBalance > 0 ? "destructive" : "default"}>
                            {formatCurrency(remainingBalance)}
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Reimbursement Form */}
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                >
                    {/* Amount */}
                    <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel required>Reimbursement Amount (₱)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        max={remainingBalance}
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
                                    Max: {formatCurrency(remainingBalance)}
                                </FormDescription>
                            </FormItem>
                        )}
                    />

                    {/* Reimbursement Method */}
                    <FormField
                        control={form.control}
                        name="reimbursement_method"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel required>Reimbursement Method</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled={isLoading}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="How was the reimbursement received?" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="cash">Cash</SelectItem>
                                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                        <SelectItem value="gcash">GCash</SelectItem>
                                        <SelectItem value="cheque">Cheque</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormDescription>
                                    How did you receive the reimbursement?
                                </FormDescription>
                            </FormItem>
                        )}
                    />

                    {/* Notes */}
                    <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Notes</FormLabel>
                                <FormControl>
                                    <Textarea
                                        {...field}
                                        placeholder="Optional notes about the reimbursement..."
                                        maxLength={500}
                                        className="resize-none"
                                        rows={3}
                                        disabled={isLoading}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />

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
                            Record Reimbursement
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    )
}
