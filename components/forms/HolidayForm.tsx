"use client"

import { useForm } from "react-hook-form"

import DatePicker from "@/components/custom/inputs/DatePicker"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { usePayrollAdminMutations } from "@/lib/mutations/usePayrollAdminMutations"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus } from "lucide-react"
import z from "zod"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select"

export default function HolidayForm({ onClose }: { onClose: () => void }) {
    const addHolidaySchema = z.object({
        date: z.string().min(1, "Date is required"),
        name: z.string().min(1, "Name is required"),
        kind: z.enum(["regular", "special_non_working"]),
    })
    const today = new Date().toISOString().slice(0, 10)
    const form = useForm<z.infer<typeof addHolidaySchema>>({
        resolver: zodResolver(addHolidaySchema),
        defaultValues: {
            date: today,
            name: "",
            kind: "regular",
        },
    })

    type FormValues = z.infer<typeof addHolidaySchema>
    const { isAdmin } = useCurrentUser()
    const { addHoliday } = usePayrollAdminMutations()

    const handleSubmit = (data: FormValues) => {
        if (!isAdmin) return
        addHoliday.mutate(data, {
            onSuccess: onClose,
        })
        form.reset({ date: "", name: "", kind: "regular" })
    }

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="grid gap-3"
            >
                {/* Date Input */}
                <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <DatePicker
                            field={{
                                value: field.value ? new Date(field.value) : undefined,
                                onChange: (date: Date | undefined) =>
                                    field.onChange(date ? date.toISOString().slice(0, 10) : ""),
                            }}
                            label="Holiday Date"
                            required
                            withMessage
                        />
                    )}
                />

                {/* Holiday Name Input */}
                <FormField
                    name="name"
                    render={({ field }) => (
                        <FormItem className="space-y-2">
                            <FormLabel required>Holiday Name</FormLabel>
                            <Input
                                placeholder="e.g., Christmas Day"
                                disabled={!isAdmin || addHoliday.isPending}
                                {...field}
                                className="h-10"
                            />
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    name="kind"
                    render={({ field }) => (
                        <FormItem className="space-y-2">
                            <FormLabel>Holiday Type</FormLabel>
                            <Select
                                disabled={!isAdmin || addHoliday.isPending}
                                {...field}
                            >
                                <SelectTrigger className="h-10 w-full">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="regular">Regular Holiday</SelectItem>
                                    <SelectItem value="special_non_working">
                                        Special Non-Working
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )}
                />

                {/* Submit Button */}
                <Button
                    disabled={!isAdmin || addHoliday.isPending}
                    className="h-10 md:w-auto w-full"
                >
                    <Plus className="size-4 mr-2" />
                    Add
                </Button>
            </form>
        </Form>
    )
}
