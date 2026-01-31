"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
} from "@/components/ui/form";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { usePayrollMutations } from "@/lib/mutations/usePayrollMutations";
import { useEmployees } from "@/lib/queries/useEmployees";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info, Loader2, PhilippinePesoIcon } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const payrollFormSchema = z.object({
	employee: z.number({
		required_error: "Please select an employee",
	}),
	notes: z.string().optional(),
});

type PayrollFormValues = z.infer<typeof payrollFormSchema>;

interface PayrollFormProps {
	onClose: () => void;
}

export default function PayrollForm({ onClose }: PayrollFormProps) {
	// Queries
	const { data: employees } = useEmployees();

	// Mutations
	const { generatePayroll } = usePayrollMutations();

	// Form
	const form = useForm<PayrollFormValues>({
		resolver: zodResolver(payrollFormSchema),
		defaultValues: {
			employee: employees?.results[0]?.id || 0,
			notes: "",
		},
	});

	// Set default employee when employees load
	useEffect(() => {
		if (
			employees?.results &&
			employees.results.length > 0 &&
			form.getValues("employee") === 0
		) {
			form.setValue("employee", employees.results[0].id);
		}
	}, [employees, form]);

	const onSubmit = async (data: PayrollFormValues) => {
		const payload = {
			employee_id: data.employee,
			notes: data.notes || "",
			include_unapproved: false,
		};

		try {
			await generatePayroll.mutateAsync(payload);
			onClose();
		} catch {
			// Error is handled by useApiMutation
		}
	};

	const isLoading = generatePayroll.isPending;

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				<Alert>
					<Info className="h-4 w-4" />
					<AlertDescription>
						Payroll will be automatically generated for the most
						recent completed week based on your payroll cutoff
						settings.
					</AlertDescription>
				</Alert>

				<div className="space-y-4">
					{/* Employee Selection */}
					<FormField
						control={form.control}
						name="employee"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Employee</FormLabel>
								<Select
									disabled={isLoading}
									value={field.value?.toString()}
									onValueChange={(value) =>
										field.onChange(Number(value))
									}
								>
									<FormControl>
										<SelectTrigger className="w-full">
											<SelectValue
												placeholder="Select employee"
												className="capitalize"
											/>
										</SelectTrigger>
									</FormControl>
									<SelectContent className="max-h-[300px]">
										{employees?.results?.map((employee) => (
											<SelectItem
												key={employee.id}
												value={employee.id.toString()}
												className="capitalize"
											>
												{employee.first_name}{" "}
												{employee.last_name}
												<span className="capitalize">
													{employee.role &&
														` (${employee.role})`}
												</span>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormDescription>
									Select the employee for payroll generation
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
								<FormLabel>Notes (Optional)</FormLabel>
								<FormControl>
									<Textarea
										{...field}
										disabled={isLoading}
										placeholder="Add any notes about this payroll..."
										rows={3}
									/>
								</FormControl>
							</FormItem>
						)}
					/>
				</div>

				{/* Actions */}
				<div className="flex justify-end gap-2">
					<Button
						type="button"
						variant="outline"
						onClick={onClose}
						disabled={isLoading}
					>
						Cancel
					</Button>
					<Button type="submit" disabled={isLoading}>
						{isLoading ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin" />
								Generating...
							</>
						) : (
							<>
								<PhilippinePesoIcon className="h-4 w-4" />
								Generate Payroll
							</>
						)}
					</Button>
				</div>
			</form>
		</Form>
	);
}
