"use client";

import { getAirconBrandColumns } from "@/app/(routes)/aircons/brands/columns";
import EntitySheet from "@/components/custom/shared/EntitySheet";
import PageHeader from "@/components/custom/shared/PageHeader";
import { Wrapper } from "@/components/custom/shared/Wrapper";
import { DataTable } from "@/components/custom/table/DataTable";
import AirconBrandForm from "@/components/forms/installations/AirconBrandForm";
import { Button } from "@/components/ui/button";
import { AirconBrands } from "@/lib/constants/interface";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useEntitySheet } from "@/lib/hooks/useEntitySheet";
import useSearchParameters from "@/lib/hooks/useSearchParameters";
import { useAirconBrandMutations } from "@/lib/mutations/installations/useAirconBrandMutations";
import { useAirconBrands } from "@/lib/queries/useAircons";
import { Plus, Wind } from "lucide-react";

export default function AirconBrandsPage() {
	const { isAdmin } = useCurrentUser();
	const { page, limit, search, ordering, filter } = useSearchParameters();
	const { deleteBrand } = useAirconBrandMutations();
	const { data, isLoading, refetch } = useAirconBrands({
		page,
		limit,
		search,
		ordering,
		filter,
	});

	const {
		entityState: { open: editOpen, entity },
		openEntity: openEditSheet,
		closeEntity: closeEditSheet,
	} = useEntitySheet<AirconBrands>();

	const {
		entityState: { open: addOpen },
		openEntity: openAddSheet,
		closeEntity: closeAddSheet,
	} = useEntitySheet<AirconBrands>();

	const {
		entityState: { open: viewOpen, entity: viewEntity },
		openEntity: openViewSheet,
		closeEntity: closeViewSheet,
	} = useEntitySheet<AirconBrands>();

	const handleDelete = (brand: AirconBrands) => {
		if (brand.id !== undefined) {
			deleteBrand.mutate(brand.id);
		}
	};

	const handleView = (brand: AirconBrands) => {
		openViewSheet(brand);
	};

	const columns = getAirconBrandColumns({
		onEdit: openEditSheet,
		onDelete: handleDelete,
		onView: handleView,
	});

	return (
		<Wrapper>
			<PageHeader
				icon={Wind}
				title="Aircon Brands"
				description="Manage air conditioning equipment brands and manufacturer information for installation and service operations."
				breadcrumbs={["Dashboard", "Aircons", "Brands"]}
				isAdminOnly={!isAdmin}
				onRefresh={refetch}
				actionButton={
					isAdmin && (
						<Button onClick={() => openAddSheet()}>
							<Plus className="size-4 mr-2" />
							Add Brand
						</Button>
					)
				}
			/>

			{/* View Brand Sheet */}
			<EntitySheet<AirconBrands>
				open={viewOpen}
				onClose={closeViewSheet}
				entity={viewEntity}
				title="Brand Details"
				description="View detailed information about this aircon brand."
				renderForm={({ onClose, entity }) =>
					entity ? (
						<div className="space-y-6 p-6">
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div>
									<label className="text-sm font-medium text-muted-foreground">
										Brand Name
									</label>
									<p className="text-base font-medium">
										{entity.name || "N/A"}
									</p>
								</div>
								<div>
									<label className="text-sm font-medium text-muted-foreground">
										Brand ID
									</label>
									<p className="text-base font-medium font-mono bg-muted px-2 py-1 rounded">
										{entity.id || "N/A"}
									</p>
								</div>
								<div>
									<label className="text-sm font-medium text-muted-foreground">
										Status
									</label>
									{/*<p className="text-base font-medium">
										{!entity.is_deleted ? (
											<span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
												<div className="size-1.5 rounded-full bg-current"></div>
												Active
											</span>
										) : (
											<span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
												<div className="size-1.5 rounded-full bg-current"></div>
												Deleted
											</span>
										)}
									</p>*/}
								</div>
							</div>
							<div className="flex justify-end gap-2 pt-4 border-t">
								<Button variant="outline" onClick={onClose}>
									Close
								</Button>
								{isAdmin && (
									<Button
										onClick={() => {
											onClose();
											openEditSheet(entity);
										}}
									>
										<Plus className="size-4 mr-2" />
										Edit Brand
									</Button>
								)}
							</div>
						</div>
					) : null
				}
			/>

			{/* Edit Aircon Brand Sheet */}
			<EntitySheet<AirconBrands>
				open={editOpen}
				onClose={closeEditSheet}
				entity={entity}
				title="Edit Aircon Brand"
				description="Update the aircon brand details below."
				withCloseConfirmation
				renderForm={({ forceClose, entity }) => (
					<AirconBrandForm onClose={forceClose} brand={entity} />
				)}
			/>

			{/* Add Aircon Brand Sheet */}
			<EntitySheet<AirconBrands>
				open={addOpen}
				onClose={closeAddSheet}
				title="Add Aircon Brand"
				description="Fill out the form below to add a new aircon brand."
				withCloseConfirmation
				renderForm={({ forceClose }) => (
					<AirconBrandForm onClose={forceClose} />
				)}
			/>

			{/* Main Content */}
			<DataTable
				title="Aircon Brands"
				description="Manage air conditioning equipment manufacturers"
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
				withoutDateRangeFilter
			/>
		</Wrapper>
	);
}
