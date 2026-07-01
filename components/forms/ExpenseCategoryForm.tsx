"use client";

import { ComboBox } from "@/components/custom/inputs/ComboBox";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ExpenseCategory } from "@/lib/constants/interface";
import { useExpenseCategoryMutations } from "@/lib/mutations/useExpenseCategoryMutations";
import { useExpenseCategoryChoices } from "@/lib/queries/useChoices";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";
import { Loader2 } from "lucide-react";

interface ExpenseCategoryFormProps {
    category?: ExpenseCategory;
    onClose: () => void;
}

export default function ExpenseCategoryForm({
    category,
    onClose,
}: ExpenseCategoryFormProps) {
    const formSchema = z.object({
        name: z
            .string()
            .min(1, { message: "Category name is required" })
            .max(100, { message: "Name must be less than 100 characters" }),
        description: z.string().optional(),
        monthly_budget: z
            .number()
            .min(0, { message: "Budget must be 0 or greater" })
            .optional(),
        parent: z.number().optional().nullable(),
        is_active: z.boolean(),
    });

    type FormValues = z.infer<typeof formSchema>;

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: category?.name ?? "",
            description: category?.description ?? "",
            monthly_budget: category?.monthly_budget ?? 0,
            parent: category?.parent ?? null,
            is_active: category?.is_active ?? true,
        },
    });

    const { addExpenseCategory, updateExpenseCategory } =
        useExpenseCategoryMutations();
    const { data: allCategories, isLoading: isLoadingParents } =
        useExpenseCategoryChoices();

    const onSubmit = (data: FormValues) => {
        const payload = {
            ...data,
            parent: data.parent ?? undefined,
            monthly_budget: data.monthly_budget || 0,
        };

        if (category?.id) {
            updateExpenseCategory.mutate(
                { id: category.id, data: payload },
                { onSuccess: onClose },
            );
        } else {
            addExpenseCategory.mutate(payload, { onSuccess: onClose });
        }
    };

    const isLoading =
        addExpenseCategory.isPending || updateExpenseCategory.isPending;

    // Filter for parent categories only (no parent) and exclude current category
    const parentOptions =
        allCategories
            ?.filter(
                (cat: ExpenseCategory) =>
                    !cat.parent && cat.id !== category?.id,
            )
            .map((cat: ExpenseCategory) => ({
                value: cat.id,
                label: cat.name,
            })) ?? [];

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6 max-w-md"
            >
                <div className="space-y-4">
                    {/* Category Name */}
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel required>Category Name</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="e.g., Utilities, Rent, Supplies"
                                        {...field}
                                        disabled={isLoading}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Description */}
                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Brief description of this category"
                                        className="resize-none"
                                        rows={3}
                                        {...field}
                                        disabled={isLoading}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Optional: Describe what expenses belong in
                                    this category
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Monthly Budget */}
                    <FormField
                        control={form.control}
                        name="monthly_budget"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Monthly Budget (₱)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        {...field}
                                        onChange={(e) =>
                                            field.onChange(
                                                e.target.value
                                                    ? parseFloat(e.target.value)
                                                    : 0,
                                            )
                                        }
                                        disabled={isLoading}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Set a monthly budget limit for this category
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Parent Category */}
                    <FormField
                        control={form.control}
                        name="parent"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Parent Category</FormLabel>
                                <FormControl>
                                    <ComboBox
                                        options={parentOptions}
                                        value={field.value ?? null}
                                        onChange={(val) => field.onChange(val)}
                                        placeholder="Select parent category (optional)"
                                        disabled={isLoading || isLoadingParents}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Optional: Create a subcategory under an
                                    existing category
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Is Active */}
                    <FormField
                        control={form.control}
                        name="is_active"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">
                                        Active Status
                                    </FormLabel>
                                    <FormDescription>
                                        Inactive categories won&apos;t appear in
                                        expense forms
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        disabled={isLoading}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 justify-end pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && (
                            <Loader2 className="size-4 mr-2 animate-spin" />
                        )}
                        {category ? "Update Category" : "Create Category"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
