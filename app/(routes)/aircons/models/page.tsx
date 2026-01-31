"use client";

import { getAirconModelColumns } from "@/app/(routes)/aircons/models/columns";
import EntitySheet from "@/components/custom/shared/EntitySheet";
import PageHeader from "@/components/custom/shared/PageHeader";
import { Wrapper } from "@/components/custom/shared/Wrapper";
import { DataTable } from "@/components/custom/table/DataTable";
import AirconModelForm from "@/components/forms/installations/AirconModelForm";
import { Button } from "@/components/ui/button";
import { AirconModels } from "@/lib/constants/interface";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useEntitySheet } from "@/lib/hooks/useEntitySheet";
import useSearchParameters from "@/lib/hooks/useSearchParameters";
import { useAirconModelMutations } from "@/lib/mutations/installations/useAirconModelMutations";
import {
	useAirconModelFilters,
	useAirconModels,
} from "@/lib/queries/useAircons";
import { Plus, Monitor, Percent, Eye } from "lucide-react";

export default function AirconModelsPage() {
	const { isAdmin } = useCurrentUser();
	const { page, limit, search, ordering, filter } = useSearchParameters();
	const { filters, orderingOptions } = useAirconModelFilters();
	const { deleteModel } = useAirconModelMutations();
	const { data, isLoading, refetch } = useAirconModels({
		page,
		limit,
		search,
		ordering,
		filter,
	});

	// Edit sheet state
	const {
		entityState: { open: editOpen, entity },
		openEntity: openEditSheet,
		closeEntity: closeEditSheet,
	} = useEntitySheet<AirconModels>();

	// Add sheet state
	const {
		entityState: { open: addOpen },
		openEntity: openAddSheet,
		closeEntity: closeAddSheet,
	} = useEntitySheet<AirconModels>();

	// View sheet state
	const {
		entityState: { open: viewOpen, entity: viewEntity },
		openEntity: openViewSheet,
		closeEntity: closeViewSheet,
	} = useEntitySheet<AirconModels>();

	// Discount sheet state
	const {
		entityState: { open: discountOpen, entity: discountEntity },
		openEntity: openDiscountSheet,
		closeEntity: closeDiscountSheet,
	} = useEntitySheet<AirconModels>();

	// Delete handler
	const handleDelete = (model: AirconModels) => {
		if (model.id !== undefined) {
			deleteModel.mutate(model.id);
		}
	};

	const handleView = (model: AirconModels) => {
		openViewSheet(model);
	};

	const columns = getAirconModelColumns({
		onEdit: openEditSheet,
		onDelete: handleDelete,
		onCustomAction: openDiscountSheet,
		onView: handleView,
	});

	return (
		<Wrapper>
			<PageHeader
				icon={Monitor}
				title="Aircon Models"
				description="Manage air conditioning unit models, specifications, pricing, and promotional discounts for your installation services."
				breadcrumbs={["Dashboard", "Aircons", "Models"]}
				isAdminOnly={!isAdmin}
				actionButton={
					isAdmin && (
						<Button onClick={() => openAddSheet()}>
							<Plus className="size-4 mr-2" />
							Add Model
						</Button>
					)
				}
			/>

			{/* View Model Sheet */}
			<EntitySheet<AirconModels>
				open={viewOpen}
				onClose={closeViewSheet}
				entity={viewEntity}
				title="Model Details"
				description="View detailed information about this aircon model."
				renderForm={({ onClose, entity }) =>
					entity ? (
						<div className="space-y-6 p-6">
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div>
									<label className="text-sm font-medium text-muted-foreground">
										Model Name
									</label>
									<p className="text-base font-medium">
										{entity.name || "N/A"}
									</p>
								</div>
								<div>
									<label className="text-sm font-medium text-muted-foreground">
										Brand
									</label>
									<p className="text-base font-medium">
										{entity.brand?.name || "N/A"}
									</p>
								</div>
								<div>
									<label className="text-sm font-medium text-muted-foreground">
										Price
									</label>
									<p className="text-base font-medium">
										₱
										{entity.retail_price?.toLocaleString() ||
											"0.00"}
									</p>
								</div>
								{/*<div>
									<label className="text-sm font-medium text-muted-foreground">
										Installation Fee
									</label>
									<p className="text-base font-medium">
										₱
										{entity.installation_fee?.toLocaleString() ||
											"0.00"}
									</p>
								</div>*/}
								<div>
									<label className="text-sm font-medium text-muted-foreground">
										Discount
									</label>
									<p className="text-base font-medium">
										{entity.discount_percentage ? (
											<span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
												<Percent className="size-3" />
												{entity.discount_percentage}%
												OFF
											</span>
										) : (
											"No discount"
										)}
									</p>
								</div>
							</div>
							<div className="flex justify-end gap-2 pt-4 border-t">
								<Button variant="outline" onClick={onClose}>
									Close
								</Button>
								{isAdmin && (
									<>
										<Button
											variant="outline"
											onClick={() => {
												onClose();
												openDiscountSheet(entity);
											}}
										>
											<Percent className="size-4 mr-2" />
											{entity.discount_percentage
												? "Update"
												: "Add"}{" "}
											Discount
										</Button>
										<Button
											onClick={() => {
												onClose();
												openEditSheet(entity);
											}}
										>
											<Eye className="size-4 mr-2" />
											Edit Model
										</Button>
									</>
								)}
							</div>
						</div>
					) : null
				}
			/>

			{/* Edit Aircon Model Sheet */}
			<EntitySheet<AirconModels>
				open={editOpen}
				onClose={closeEditSheet}
				entity={entity}
				title="Edit Aircon Model"
				description="Update the aircon model details below."
				withCloseConfirmation
				renderForm={({ forceClose, entity }) => (
					<AirconModelForm
						onClose={forceClose}
						initialData={entity}
					/>
				)}
			/>

			{/* Add Aircon Model Sheet */}
			<EntitySheet<AirconModels>
				open={addOpen}
				onClose={closeAddSheet}
				title="Add Aircon Model"
				description="Fill out the form below to add a new aircon model."
				withCloseConfirmation
				renderForm={({ forceClose }) => (
					<AirconModelForm onClose={forceClose} />
				)}
			/>

			{/* Discount Sheet */}
			<EntitySheet<AirconModels>
				open={discountOpen}
				onClose={closeDiscountSheet}
				entity={discountEntity}
				title={
					discountEntity?.discount_percentage
						? "Update Discount"
						: "Add Discount"
				}
				description={
					discountEntity?.discount_percentage
						? "Update the promotional discount for this model."
						: "Apply a promotional discount to this model."
				}
				withCloseConfirmation
				renderForm={({ forceClose, entity }) => (
					<AirconModelForm
						onClose={forceClose}
						initialData={entity}
						isAddingDiscount
					/>
				)}
			/>

			{/* Main Content */}
			<DataTable
				title="Aircon Models"
				description="Manage air conditioning unit specifications and pricing"
				isLoading={isLoading}
				columns={columns}
				data={
					data || {
						count: 0,
						next: null,
						previous: null,
						results: [],
					}
				}
				filters={filters}
				orderingOptions={orderingOptions}
				onRefresh={refetch}
				withoutDateRangeFilter
			/>
		</Wrapper>
	);
}
