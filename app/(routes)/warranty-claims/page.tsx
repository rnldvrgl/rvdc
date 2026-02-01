"use client";

import { getWarrantyClaimColumns } from "@/app/(routes)/warranty-claims/columns";
import { ConfirmDialog } from "@/components/custom/shared/ConfirmDialog";
import EntitySheet from "@/components/custom/shared/EntitySheet";
import PageHeader from "@/components/custom/shared/PageHeader";
import { Wrapper } from "@/components/custom/shared/Wrapper";
import { DataTable } from "@/components/custom/table/DataTable";
import WarrantyClaimForm from "@/components/forms/WarrantyClaimForm";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WarrantyClaim } from "@/lib/constants/interface";
import { PaginatedResult } from "@/lib/constants/types";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useEntitySheet } from "@/lib/hooks/useEntitySheet";
import useSearchParameters from "@/lib/hooks/useSearchParameters";
import { useWarrantyClaimMutations } from "@/lib/mutations/installations/useWarrantyClaimMutations";
import {
	useWarrantyClaimFilters,
	useWarrantyClaims,
} from "@/lib/queries/useAircons";
import { formatCurrency } from "@/lib/utils/helpers";
import { formatDate } from "@/lib/utils/helpers/date";
import { ShieldCheck, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function WarrantyClaimsPage() {
	const { role } = useCurrentUser();
	const [detailsOpen, setDetailsOpen] = useState(false);
	const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [approveDialogOpen, setApproveDialogOpen] = useState(false);
	const [selectedClaim, setSelectedClaim] = useState<WarrantyClaim | null>(
		null,
	);
	const [claimToDelete, setClaimToDelete] = useState<WarrantyClaim | null>(
		null,
	);
	const [claimToApprove, setClaimToApprove] = useState<WarrantyClaim | null>(
		null,
	);
	const [rejectionReason, setRejectionReason] = useState("");

	// Search params
	const { filter, ordering, search, page, limit } = useSearchParameters();

	// Data fetching
	const { data: claims, isLoading } = useWarrantyClaims({
		page,
		limit,
		search,
		filter,
		ordering,
	});

	const { filters: filterDefs, orderingOptions } = useWarrantyClaimFilters();

	// Mutations
	const { deleteWarrantyClaim, approveWarrantyClaim, rejectWarrantyClaim } =
		useWarrantyClaimMutations();

	// Entity sheet for create/edit
	const { entityState, openEntity, closeEntity } =
		useEntitySheet<WarrantyClaim>();

	const handleView = (claim: WarrantyClaim) => {
		setSelectedClaim(claim);
		setDetailsOpen(true);
	};

	const handleEdit = (claim: WarrantyClaim) => {
		openEntity(claim);
	};

	const handleDelete = (claim: WarrantyClaim) => {
		setClaimToDelete(claim);
		setDeleteDialogOpen(true);
	};

	const confirmDelete = () => {
		if (claimToDelete) {
			deleteWarrantyClaim.mutate(claimToDelete.id, {
				onSuccess: () => {
					setDeleteDialogOpen(false);
					setClaimToDelete(null);
				},
			});
		}
	};

	const handleApprove = (claim: WarrantyClaim) => {
		setClaimToApprove(claim);
		setApproveDialogOpen(true);
	};

	const confirmApprove = () => {
		if (claimToApprove) {
			approveWarrantyClaim.mutate(claimToApprove.id, {
				onSuccess: () => {
					toast.success("Warranty claim approved!");
					setApproveDialogOpen(false);
					setClaimToApprove(null);
				},
			});
		}
	};

	const handleReject = (claim: WarrantyClaim) => {
		setSelectedClaim(claim);
		setRejectionReason("");
		setRejectDialogOpen(true);
	};

	const confirmReject = () => {
		if (!selectedClaim) return;

		if (!rejectionReason.trim()) {
			toast.error("Please provide a rejection reason");
			return;
		}

		rejectWarrantyClaim.mutate(
			{ id: selectedClaim.id, reason: rejectionReason },
			{
				onSuccess: () => {
					toast.success("Warranty claim rejected");
					setRejectDialogOpen(false);
					setRejectionReason("");
					setSelectedClaim(null);
				},
			},
		);
	};

	const columns = getWarrantyClaimColumns({
		role,
		onView: handleView,
		onEdit: handleEdit,
		onDelete: handleDelete,
		onApprove: role === "admin" ? handleApprove : undefined,
		onReject: role === "admin" ? handleReject : undefined,
	});

	return (
		<Wrapper>
			<PageHeader
				icon={ShieldCheck}
				title="Warranty Claims"
				description="Manage aircon warranty claims and approvals"
			/>

			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-2">
					<span className="text-sm text-muted-foreground">
						{claims?.count ?? 0} claim(s)
					</span>
				</div>

				<Button onClick={() => openEntity()} size="sm">
					<Plus className="mr-2 h-4 w-4" />
					New Claim
				</Button>
			</div>

			<DataTable<WarrantyClaim, unknown>
				columns={columns}
				data={
					claims ??
					({
						count: 0,
						next: null,
						previous: null,
						results: [],
					} as PaginatedResult<WarrantyClaim>)
				}
				isLoading={isLoading}
				filters={filterDefs ?? []}
				orderingOptions={orderingOptions ?? []}
			/>

			{/* Create/Edit Sheet */}
			<EntitySheet
				open={entityState.open}
				onClose={closeEntity}
				title={
					entityState.entity
						? "Edit Warranty Claim"
						: "Submit New Warranty Claim"
				}
				description={
					entityState.entity
						? "Update warranty claim information"
						: "Submit a new warranty claim for an aircon unit"
				}
				entity={entityState.entity}
				renderForm={({ onClose, entity }) => (
					<WarrantyClaimForm
						initialData={entity as WarrantyClaim}
						onClose={onClose}
					/>
				)}
			/>

			{/* Details Sheet */}
			{detailsOpen && selectedClaim && (
				<EntitySheet
					open={detailsOpen}
					onClose={() => setDetailsOpen(false)}
					title={`Warranty Claim #${selectedClaim.id}`}
					description="Warranty claim details"
					entity={selectedClaim}
					renderForm={() => (
						<div className="space-y-4">
							{/* Unit Info */}
							<div className="rounded-lg border p-3 space-y-2">
								<h3 className="font-semibold text-sm">
									Aircon Unit
								</h3>
								<div className="text-sm space-y-1">
									<p>
										<span className="text-muted-foreground">
											Serial:
										</span>{" "}
										{selectedClaim.unit?.serial_number}
									</p>
									<p>
										<span className="text-muted-foreground">
											Model:
										</span>{" "}
										{selectedClaim.unit?.model?.brand?.name}{" "}
										{selectedClaim.unit?.model?.name}
									</p>
									<p>
										<span className="text-muted-foreground">
											Warranty Status:
										</span>{" "}
										{selectedClaim.unit?.warranty_status}
									</p>
									{selectedClaim.warranty_days_remaining_at_claim !==
										undefined && (
										<p>
											<span className="text-muted-foreground">
												Days Remaining (at claim):
											</span>{" "}
											{
												selectedClaim.warranty_days_remaining_at_claim
											}{" "}
											days
										</p>
									)}
								</div>
							</div>

							{/* Claim Info */}
							<div>
								<h3 className="font-semibold text-sm mb-2">
									Claim Information
								</h3>
								<div className="text-sm space-y-2">
									<div>
										<span className="text-muted-foreground">
											Type:
										</span>{" "}
										{selectedClaim.claim_type}
									</div>
									<div>
										<span className="text-muted-foreground">
											Status:
										</span>{" "}
										{selectedClaim.status}
									</div>
									<div>
										<span className="text-muted-foreground">
											Valid Claim:
										</span>{" "}
										{selectedClaim.is_valid_claim
											? "Yes"
											: "No"}
									</div>
									<div>
										<span className="text-muted-foreground">
											Claim Date:
										</span>{" "}
										{formatDate(
											new Date(selectedClaim.claim_date),
											"MMM dd, yyyy",
										)}
									</div>
								</div>
							</div>

							{/* Issue Description */}
							<div>
								<h3 className="font-semibold text-sm mb-2">
									Issue Description
								</h3>
								<p className="text-sm text-muted-foreground">
									{selectedClaim.issue_description}
								</p>
							</div>

							{/* Customer Notes */}
							{selectedClaim.customer_notes && (
								<div>
									<h3 className="font-semibold text-sm mb-2">
										Customer Notes
									</h3>
									<p className="text-sm text-muted-foreground">
										{selectedClaim.customer_notes}
									</p>
								</div>
							)}

							{/* Technician Assessment */}
							{selectedClaim.technician_assessment && (
								<div>
									<h3 className="font-semibold text-sm mb-2">
										Technician Assessment
									</h3>
									<p className="text-sm text-muted-foreground">
										{selectedClaim.technician_assessment}
									</p>
								</div>
							)}

							{/* Rejection Reason */}
							{selectedClaim.rejection_reason && (
								<div>
									<h3 className="font-semibold text-sm mb-2 text-destructive">
										Rejection Reason
									</h3>
									<p className="text-sm text-muted-foreground">
										{selectedClaim.rejection_reason}
									</p>
								</div>
							)}

							{/* Cost Info */}
							<div className="rounded-lg border p-3 space-y-2">
								<h3 className="font-semibold text-sm">
									Cost Information
								</h3>
								<div className="text-sm space-y-1">
									<p>
										<span className="text-muted-foreground">
											Estimated:
										</span>{" "}
										{formatCurrency(
											Number(
												selectedClaim.estimated_cost,
											),
										)}
									</p>
									<p>
										<span className="text-muted-foreground">
											Actual:
										</span>{" "}
										{formatCurrency(
											Number(selectedClaim.actual_cost),
										)}
									</p>
								</div>
							</div>

							{/* Actions */}
							<div className="flex gap-2">
								<Button
									onClick={() => handleEdit(selectedClaim)}
									className="flex-1"
									variant="outline"
								>
									Edit Claim
								</Button>
								{role === "admin" &&
									selectedClaim.status === "pending" && (
										<>
											<Button
												onClick={() =>
													handleApprove(selectedClaim)
												}
												className="flex-1"
											>
												Approve
											</Button>
											<Button
												onClick={() =>
													handleReject(selectedClaim)
												}
												variant="destructive"
												className="flex-1"
											>
												Reject
											</Button>
										</>
									)}
							</div>
						</div>
					)}
				/>
			)}

			{/* Reject Dialog */}
			<Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Reject Warranty Claim</DialogTitle>
						<DialogDescription>
							Please provide a reason for rejecting this claim.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-2">
						<Label htmlFor="rejection-reason">
							Rejection Reason
						</Label>
						<Input
							id="rejection-reason"
							value={rejectionReason}
							onChange={(e) => setRejectionReason(e.target.value)}
							placeholder="Enter rejection reason"
						/>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setRejectDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={confirmReject}
							disabled={!rejectionReason.trim()}
						>
							Reject Claim
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<ConfirmDialog
				open={deleteDialogOpen}
				onCancel={() => setDeleteDialogOpen(false)}
				title="Delete Warranty Claim"
				description={
					claimToDelete
						? `Are you sure you want to delete warranty claim #${claimToDelete.id}? This action cannot be undone.`
						: ""
				}
				onConfirm={confirmDelete}
				confirmText="Delete"
			/>

			{/* Approve Confirmation Dialog */}
			<ConfirmDialog
				open={approveDialogOpen}
				onCancel={() => setApproveDialogOpen(false)}
				title="Approve Warranty Claim"
				description={
					claimToApprove
						? `Approve warranty claim #${claimToApprove.id}? This will allow the claim to proceed.`
						: ""
				}
				onConfirm={confirmApprove}
				confirmText="Approve"
			/>
		</Wrapper>
	);
}
