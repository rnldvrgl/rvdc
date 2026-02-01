"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	ServiceAppliance,
	ServiceAppliancePayload,
	ApplianceStatus,
} from "@/lib/constants/interface";
import { useApplianceTypeChoices } from "@/lib/queries/useChoices";
import { Plus, Trash2, Edit, Save, X } from "lucide-react";
import { useState } from "react";
import { formatCurrency } from "@/lib/utils/helpers";

interface ServiceApplianceManagerProps {
	serviceId?: number;
	appliances: ServiceAppliance[];
	onUpdate: (appliances: ServiceAppliancePayload[]) => void;
	disabled?: boolean;
}

interface EditingAppliance extends Partial<ServiceAppliancePayload> {
	tempId?: string;
}

const applianceStatusOptions: { value: ApplianceStatus; label: string }[] = [
	{ value: "received", label: "Received" },
	{ value: "diagnosed", label: "Diagnosed" },
	{ value: "in_repair", label: "In Repair" },
	{ value: "completed", label: "Completed" },
	{ value: "ready_for_pickup", label: "Ready for Pickup" },
	{ value: "delivered", label: "Delivered" },
];

export default function ServiceApplianceManager({
	serviceId,
	appliances,
	onUpdate,
	disabled = false,
}: ServiceApplianceManagerProps) {
	const { data: applianceTypes = [] } = useApplianceTypeChoices();
	const [editingAppliance, setEditingAppliance] =
		useState<EditingAppliance | null>(null);
	const [isAdding, setIsAdding] = useState(false);

	const handleAdd = () => {
		setEditingAppliance({
			tempId: `temp-${Date.now()}`,
			appliance_type: null,
			brand: "",
			model: "",
			issue_reported: "",
			diagnosis_notes: "",
			status: "received",
			labor_fee: 0,
			labor_is_free: false,
			labor_original_amount: 0,
		});
		setIsAdding(true);
	};

	const handleEdit = (appliance: ServiceAppliance) => {
		setEditingAppliance({
			tempId: appliance.id.toString(),
			appliance_type: appliance.appliance_type?.id ?? null,
			brand: appliance.brand || "",
			model: appliance.model || "",
			issue_reported: appliance.issue_reported || "",
			diagnosis_notes: appliance.diagnosis_notes || "",
			status: appliance.status,
			labor_fee: parseFloat(appliance.labor_fee) || 0,
			labor_is_free: appliance.labor_is_free,
			labor_original_amount: appliance.labor_original_amount
				? parseFloat(appliance.labor_original_amount)
				: 0,
		});
		setIsAdding(false);
	};

	const handleSave = () => {
		if (!editingAppliance) return;

		const newAppliance: ServiceAppliancePayload = {
			service: serviceId,
			appliance_type: editingAppliance.appliance_type ?? null,
			brand: editingAppliance.brand || "",
			model: editingAppliance.model || "",
			issue_reported: editingAppliance.issue_reported || "",
			diagnosis_notes: editingAppliance.diagnosis_notes || "",
			status: editingAppliance.status || "received",
			labor_fee: editingAppliance.labor_fee || 0,
			labor_is_free: editingAppliance.labor_is_free || false,
			labor_original_amount: editingAppliance.labor_original_amount || 0,
		};

		let updatedAppliances: ServiceAppliancePayload[];

		if (isAdding) {
			// Add new appliance
			updatedAppliances = [
				...appliances.map((a) => ({
					service: serviceId,
					appliance_type: a.appliance_type?.id ?? null,
					brand: a.brand || "",
					model: a.model || "",
					issue_reported: a.issue_reported || "",
					diagnosis_notes: a.diagnosis_notes || "",
					status: a.status,
					labor_fee: parseFloat(a.labor_fee) || 0,
					labor_is_free: a.labor_is_free,
					labor_original_amount: a.labor_original_amount
						? parseFloat(a.labor_original_amount)
						: 0,
				})),
				newAppliance,
			];
		} else {
			// Update existing appliance
			updatedAppliances = appliances.map((a) =>
				a.id.toString() === editingAppliance.tempId
					? newAppliance
					: {
							service: serviceId,
							appliance_type: a.appliance_type?.id ?? null,
							brand: a.brand || "",
							model: a.model || "",
							issue_reported: a.issue_reported || "",
							diagnosis_notes: a.diagnosis_notes || "",
							status: a.status,
							labor_fee: parseFloat(a.labor_fee) || 0,
							labor_is_free: a.labor_is_free,
							labor_original_amount: a.labor_original_amount
								? parseFloat(a.labor_original_amount)
								: 0,
						},
			);
		}

		onUpdate(updatedAppliances);
		setEditingAppliance(null);
		setIsAdding(false);
	};

	const handleCancel = () => {
		setEditingAppliance(null);
		setIsAdding(false);
	};

	const handleDelete = (applianceId: number) => {
		const updatedAppliances = appliances
			.filter((a) => a.id !== applianceId)
			.map((a) => ({
				service: serviceId,
				appliance_type: a.appliance_type?.id ?? null,
				brand: a.brand || "",
				model: a.model || "",
				issue_reported: a.issue_reported || "",
				diagnosis_notes: a.diagnosis_notes || "",
				status: a.status,
				labor_fee: parseFloat(a.labor_fee) || 0,
				labor_is_free: a.labor_is_free,
				labor_original_amount: a.labor_original_amount
					? parseFloat(a.labor_original_amount)
					: 0,
			}));
		onUpdate(updatedAppliances);
	};

	const getStatusLabel = (status: ApplianceStatus) => {
		const option = applianceStatusOptions.find((o) => o.value === status);
		return option?.label || status;
	};

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle className="text-lg">Appliances</CardTitle>
				{!disabled && !editingAppliance && (
					<Button
						type="button"
						size="sm"
						onClick={handleAdd}
						variant="outline"
					>
						<Plus className="mr-2 h-4 w-4" />
						Add Appliance
					</Button>
				)}
			</CardHeader>
			<CardContent>
				{editingAppliance ? (
					<div className="space-y-4 rounded-lg border p-4">
						<h4 className="font-medium">
							{isAdding ? "Add New Appliance" : "Edit Appliance"}
						</h4>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<label className="text-sm font-medium">
									Appliance Type
								</label>
								<Select
									value={
										editingAppliance.appliance_type?.toString() ||
										""
									}
									onValueChange={(value) =>
										setEditingAppliance({
											...editingAppliance,
											appliance_type: value
												? parseInt(value)
												: null,
										})
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select type" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="null">
											N/A
										</SelectItem>
										{applianceTypes.map((type) => (
											<SelectItem
												key={type.id}
												value={type.id.toString()}
											>
												{type.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium">
									Status
								</label>
								<Select
									value={
										editingAppliance.status || "received"
									}
									onValueChange={(value: ApplianceStatus) =>
										setEditingAppliance({
											...editingAppliance,
											status: value,
										})
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{applianceStatusOptions.map(
											(option) => (
												<SelectItem
													key={option.value}
													value={option.value}
												>
													{option.label}
												</SelectItem>
											),
										)}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium">
									Brand
								</label>
								<Input
									value={editingAppliance.brand || ""}
									onChange={(e) =>
										setEditingAppliance({
											...editingAppliance,
											brand: e.target.value,
										})
									}
									placeholder="e.g., Samsung, LG"
								/>
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium">
									Model
								</label>
								<Input
									value={editingAppliance.model || ""}
									onChange={(e) =>
										setEditingAppliance({
											...editingAppliance,
											model: e.target.value,
										})
									}
									placeholder="Model number"
								/>
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium">
									Labor Fee (₱)
								</label>
								<Input
									type="number"
									min="0"
									step="0.01"
									value={editingAppliance.labor_fee || 0}
									onChange={(e) =>
										setEditingAppliance({
											...editingAppliance,
											labor_fee:
												parseFloat(e.target.value) || 0,
										})
									}
								/>
							</div>

							<div className="flex items-center space-x-2 pt-6">
								<input
									type="checkbox"
									id="labor_is_free"
									checked={
										editingAppliance.labor_is_free || false
									}
									onChange={(e) =>
										setEditingAppliance({
											...editingAppliance,
											labor_is_free: e.target.checked,
										})
									}
									className="h-4 w-4"
								/>
								<label
									htmlFor="labor_is_free"
									className="text-sm font-medium"
								>
									Labor is Free
								</label>
							</div>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium">
								Issue Reported
							</label>
							<Textarea
								value={editingAppliance.issue_reported || ""}
								onChange={(e) =>
									setEditingAppliance({
										...editingAppliance,
										issue_reported: e.target.value,
									})
								}
								placeholder="Describe the issue reported by the client"
								rows={2}
							/>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium">
								Diagnosis Notes
							</label>
							<Textarea
								value={editingAppliance.diagnosis_notes || ""}
								onChange={(e) =>
									setEditingAppliance({
										...editingAppliance,
										diagnosis_notes: e.target.value,
									})
								}
								placeholder="Technician's diagnosis and findings"
								rows={2}
							/>
						</div>

						<div className="flex justify-end gap-2">
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={handleCancel}
							>
								<X className="mr-2 h-4 w-4" />
								Cancel
							</Button>
							<Button
								type="button"
								size="sm"
								onClick={handleSave}
							>
								<Save className="mr-2 h-4 w-4" />
								Save
							</Button>
						</div>
					</div>
				) : appliances.length > 0 ? (
					<div className="rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Type</TableHead>
									<TableHead>Brand/Model</TableHead>
									<TableHead>Issue</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Labor Fee</TableHead>
									<TableHead className="text-right">
										Actions
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{appliances.map((appliance) => (
									<TableRow key={appliance.id}>
										<TableCell>
											{appliance.appliance_type?.name ||
												"N/A"}
										</TableCell>
										<TableCell>
											<div className="text-sm">
												<div className="font-medium">
													{appliance.brand || "—"}
												</div>
												{appliance.model && (
													<div className="text-muted-foreground">
														{appliance.model}
													</div>
												)}
											</div>
										</TableCell>
										<TableCell>
											<div className="max-w-xs truncate text-sm">
												{appliance.issue_reported ||
													"—"}
											</div>
										</TableCell>
										<TableCell>
											<Badge variant="outline">
												{getStatusLabel(
													appliance.status,
												)}
											</Badge>
										</TableCell>
										<TableCell>
											{appliance.labor_is_free ? (
												<Badge variant="success">
													FREE
												</Badge>
											) : (
												<span className="font-medium">
													{formatCurrency(
														parseFloat(
															appliance.labor_fee,
														),
													)}
												</span>
											)}
										</TableCell>
										<TableCell className="text-right">
											<div className="flex justify-end gap-2">
												{!disabled && (
													<>
														<Button
															type="button"
															variant="ghost"
															size="sm"
															onClick={() =>
																handleEdit(
																	appliance,
																)
															}
														>
															<Edit className="h-4 w-4" />
														</Button>
														<Button
															type="button"
															variant="ghost"
															size="sm"
															onClick={() =>
																handleDelete(
																	appliance.id,
																)
															}
														>
															<Trash2 className="h-4 w-4 text-destructive" />
														</Button>
													</>
												)}
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				) : (
					<div className="rounded-lg border border-dashed p-8 text-center">
						<p className="text-muted-foreground text-sm">
							No appliances added yet.
							{!disabled &&
								" Click 'Add Appliance' to add an appliance to this service."}
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
