"use client"

import DatePicker from "@/components/custom/inputs/DatePicker"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type {
    LeaveRequest,
    LeaveRequestPayload,
    ShiftPeriod,
} from "@/lib/constants/types"
import { useLeaveRequestMutations } from "@/lib/mutations/useAttendanceMutations"
import { useEmployeeChoices } from "@/lib/queries/useChoices"
import { formatDateToYMD } from "@/lib/utils/helpers"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarCheck2, Loader2 } from "lucide-react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"

const leaveAdminSchema = z
    .object({
        employee: z.number({ required_error: "Please select an employee" }),
        leave_type: z.enum(["SICK", "EMERGENCY", "SPECIAL"]),
        start_date: z.date({ required_error: "Start date is required" }),
        end_date: z.date({ required_error: "End date is required" }),
        is_half_day: z.boolean(),
        shift_period: z.enum(["AM", "PM", "FULL"]),
        reason: z.string().min(5, "Reason must be at least 5 characters"),
    })
    .superRefine((data, ctx) => {
        if (data.end_date < data.start_date) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["end_date"],
                message: "End date must be on or after start date.",
            })
        }

        if (data.is_half_day) {
            const isSameDay =
                data.start_date.getFullYear() === data.end_date.getFullYear() &&
                data.start_date.getMonth() === data.end_date.getMonth() &&
                data.start_date.getDate() === data.end_date.getDate()

            if (!isSameDay) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["is_half_day"],
                    message: "Half-day leave can only be used on a single day.",
                })
            }

            if (data.shift_period === "FULL") {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["shift_period"],
                    message: "Choose AM or PM when half-day is enabled.",
                })
            }
        }
    })

type LeaveAdminFormValues = z.infer<typeof leaveAdminSchema>

interface LeaveRequestAdminFormProps {
    leaveRequest?: LeaveRequest
    onClose: () => void
    forceClose?: () => void
}

function getDefaults(leaveRequest?: LeaveRequest): LeaveAdminFormValues {
    const startDate = leaveRequest?.start_date || leaveRequest?.date
    const endDate = leaveRequest?.end_date || leaveRequest?.date

    return {
        employee: leaveRequest?.employee || 0,
        leave_type: leaveRequest?.leave_type || "SICK",
        start_date: startDate ? new Date(startDate) : new Date(),
        end_date: endDate ? new Date(endDate) : new Date(),
        is_half_day: leaveRequest?.is_half_day || false,
        shift_period: (leaveRequest?.shift_period || "FULL") as ShiftPeriod,
        reason: leaveRequest?.reason || "",
    }
}

export default function LeaveRequestAdminForm({
    leaveRequest,
    onClose,
    forceClose,
}: LeaveRequestAdminFormProps) {
    const { data: employeeChoices = [] } = useEmployeeChoices({
        includeInPayroll: true,
    })
    const { createLeaveRequest, updateLeaveRequest } = useLeaveRequestMutations()

    const form = useForm<LeaveAdminFormValues>({
        resolver: zodResolver(leaveAdminSchema),
        defaultValues: getDefaults(leaveRequest),
    })

    const isHalfDay = form.watch("is_half_day")

    useEffect(() => {
        form.reset(getDefaults(leaveRequest))
    }, [form, leaveRequest])

    useEffect(() => {
        if (
            !leaveRequest &&
            employeeChoices.length > 0 &&
            form.getValues("employee") === 0
        ) {
            form.setValue("employee", employeeChoices[0].id)
        }
    }, [employeeChoices, form, leaveRequest])

    useEffect(() => {
        if (!isHalfDay) {
            form.setValue("shift_period", "FULL")
        }
    }, [isHalfDay, form])

    const onSubmit = async (data: LeaveAdminFormValues) => {
        const payload: LeaveRequestPayload = {
            employee: data.employee,
            leave_type: data.leave_type,
            start_date: formatDateToYMD(data.start_date),
            end_date: formatDateToYMD(data.end_date),
            is_half_day: data.is_half_day,
            shift_period: data.is_half_day ? data.shift_period : "FULL",
            reason: data.reason,
        }

        try {
            if (leaveRequest) {
                await updateLeaveRequest.mutateAsync({
                    id: leaveRequest.id,
                    data: payload,
                })
            } else {
                await createLeaveRequest.mutateAsync(payload)
            }

            if (forceClose) forceClose()
            else onClose()
        } catch {
            // handled by mutation hook
        }
    }

    const isPending = createLeaveRequest.isPending || updateLeaveRequest.isPending

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5"
            >
                <Alert className="border-primary/30 bg-primary/5">
                    <CalendarCheck2 className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                        Admin leave entries will participate in the same approval and
                        balance rules as employee-submitted requests.
                    </AlertDescription>
                </Alert>

                <FormField
                    control={form.control}
                    name="employee"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel required>Employee</FormLabel>
                            <Select
                                onValueChange={(value) =>
                                    field.onChange(Number.parseInt(value, 10))
                                }
                                value={field.value ? String(field.value) : ""}
                            >
                                <FormControl>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select employee" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {employeeChoices.map((employee) => (
                                        <SelectItem
                                            key={employee.id}
                                            value={String(employee.id)}
                                        >
                                            {employee.full_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="leave_type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel required>Leave Type</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="SICK">Sick Leave</SelectItem>
                                        <SelectItem value="EMERGENCY">Emergency Leave</SelectItem>
                                        <SelectItem value="SPECIAL">Special Leave</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="is_half_day"
                        render={({ field }) => (
                            <FormItem className="rounded-lg border border-border/60 px-3 py-2">
                                <div className="flex items-center gap-3">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={(checked) =>
                                                field.onChange(Boolean(checked))
                                            }
                                        />
                                    </FormControl>
                                    <div>
                                        <FormLabel className="cursor-pointer">
                                            Half-day leave
                                        </FormLabel>
                                        <FormDescription>
                                            Use for single-day AM/PM leave.
                                        </FormDescription>
                                    </div>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="start_date"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormControl>
                                    <DatePicker
                                        label="Start Date"
                                        required
                                        field={field}
                                        withoutLabel
                                        withMessage
                                        captionLayout="dropdown-months"
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="end_date"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormControl>
                                    <DatePicker
                                        label="End Date"
                                        required
                                        field={field}
                                        withoutLabel
                                        withMessage
                                        captionLayout="dropdown-months"
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>

                {isHalfDay && (
                    <FormField
                        control={form.control}
                        name="shift_period"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel required>Half-day Period</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="AM">Morning (AM)</SelectItem>
                                        <SelectItem value="PM">Afternoon (PM)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel required>Reason</FormLabel>
                            <FormControl>
                                <Textarea
                                    {...field}
                                    rows={4}
                                    placeholder="Provide context for this leave request."
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex items-center justify-end gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isPending}
                    >
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {leaveRequest ? "Update Leave" : "Create Leave"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
