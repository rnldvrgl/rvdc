"use client";

import { getStallColumns } from "@/app/(routes)/stalls/columns";
import EntitySheet from "@/components/custom/shared/EntitySheet";
import PageHeader from "@/components/custom/shared/PageHeader";
import { Wrapper } from "@/components/custom/shared/Wrapper";
import { DataTable } from "@/components/custom/table/DataTable";
import StallForm from "@/components/forms/inventory/StallForm";
import { Button } from "@/components/ui/button";
import { Stall } from "@/lib/constants/interface";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useEntitySheet } from "@/lib/hooks/useEntitySheet";
import { useStallMutations } from "@/lib/mutations/useStallMutations";
import { useStalls } from "@/lib/queries/inventory/useStalls";
import { Plus, Store, MapPin } from "lucide-react";

export default function StallsPage() {
	const { isAdmin } = useCurrentUser();
	const { data, isLoading, refetch } = useStalls();
	const { deleteStall } = useStallMutations();

	const {
		entityState: { open: editOpen, entity },
		openEntity: openEditSheet,
		closeEntity: closeEditSheet,
	} = useEntitySheet<Stall>();

	const {
		entityState: { open: addOpen },
		openEntity: openAddSheet,
		closeEntity: closeAddSheet,
	} = useEntitySheet<Stall>();

	const {
		entityState: { open: viewOpen, entity: viewEntity },
		openEntity: openViewSheet,
		closeEntity: closeViewSheet,
	} = useEntitySheet<Stall>();

	const handleDelete = (stall: Stall) => {
		if (stall.id !== undefined) {
			deleteStall.mutate(stall.id);
		}
	};

	const handleView = (stall: Stall) => {
		openViewSheet(stall);
	};

	const columns = getStallColumns({
		onEdit: openEditSheet,
		onDelete: handleDelete,
		onView: handleView,
	});

	return (
		<Wrapper>
			<PageHeader
				icon={Store}
				title="Stall Management"
				description="Manage retail locations, track inventory distribution points, and monitor stall performance across your business network."
				breadcrumbs={["Dashboard", "Inventory", "Stalls"]}
				isAdminOnly={!isAdmin}
				onRefresh={refetch}
				actionButton={
					isAdmin && (
						<Button onClick={() => openAddSheet()}>
							<Plus className="size-4 mr-2" />
							Add Stall
						</Button>
					)
				}
			/>

			{/* View Stall Sheet */}
			<EntitySheet<Stall>
				open={viewOpen}
				onClose={closeViewSheet}
				entity={viewEntity}
				title="Stall Details"
				description="View detailed information about this stall location."
				renderForm={({ onClose, entity }) =>
					entity ? (
						<div className="space-y-6 p-6">
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div>
									<label className="text-sm font-medium text-muted-foreground">
										Stall Name
									</label>
									<p className="text-base font-medium">
										{entity.name || "N/A"}
									</p>
								</div>
								<div>
									<label className="text-sm font-medium text-muted-foreground">
										ID
									</label>
									<p className="text-base font-medium font-mono bg-muted px-2 py-1 rounded">
										{entity.id || "N/A"}
									</p>
								</div>
								<div className="sm:col-span-2">
									<label className="text-sm font-medium text-muted-foreground">
										Location
									</label>
									<p className="text-base font-medium flex items-center gap-2">
										<MapPin className="size-4 text-muted-foreground" />
										{entity.location ||
											"No location specified"}
									</p>
								</div>
								<div className="sm:col-span-2">
									<label className="text-sm font-medium text-muted-foreground">
										Created
									</label>
									<p className="text-base text-muted-foreground">
										{entity.created_at
											? new Date(
													entity.created_at,
												).toLocaleDateString()
											: "Unknown"}
									</p>
								</div>
								<div>
									<label className="text-sm font-medium text-muted-foreground">
										Status
									</label>
									<p className="text-base font-medium">
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
									</p>
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
										Edit Stall
									</Button>
								)}
							</div>
						</div>
					) : null
				}
			/>

			{/* Edit Stall Sheet */}
			<EntitySheet<Stall>
				open={editOpen}
				onClose={closeEditSheet}
				entity={entity}
				title="Edit Stall"
				description="Update the stall details below."
				withCloseConfirmation
				renderForm={({ forceClose, entity }) => (
					<StallForm onClose={forceClose} stall={entity} />
				)}
			/>

			{/* Add Stall Sheet */}
			<EntitySheet<Stall>
				open={addOpen}
				onClose={closeAddSheet}
				title="Add Stall"
				description="Fill out the form below to add a new stall location."
				withCloseConfirmation
				renderForm={({ forceClose }) => (
					<StallForm onClose={forceClose} />
				)}
			/>

			{/* Main Content */}
			<DataTable
				title="Stalls"
				description="Manage your retail locations and stall network"
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
