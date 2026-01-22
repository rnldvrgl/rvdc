"use client";

import { getTechnicianColumns } from "@/app/(routes)/technicians/columns";
import EntitySheet from "@/components/custom/shared/EntitySheet";
import PageHeader from "@/components/custom/shared/PageHeader";
import { Wrapper } from "@/components/custom/shared/Wrapper";
import { DataTable } from "@/components/custom/table/DataTable";
import TechnicianForm from "@/components/forms/TechnicianForm";
import { Button } from "@/components/ui/button";
import { Technician } from "@/lib/constants/types";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useEntitySheet } from "@/lib/hooks/useEntitySheet";
import useSearchParameters from "@/lib/hooks/useSearchParameters";
import { useTechnicianMutations } from "@/lib/mutations/useTechnicianMutations";
import { useTechnicians } from "@/lib/queries/useTechnicians";
import { Plus, Users } from "lucide-react";

export default function TechniciansPage() {
	const { isAdmin } = useCurrentUser();
	const { page, limit, search, ordering, filter } = useSearchParameters();
	const { deleteTechnician } = useTechnicianMutations();
	const { data, isLoading, refetch } = useTechnicians({
		page,
		limit,
		search,
		ordering,
		filter,
	});

	// Separate sheets
	const {
		entityState: { open: editOpen, entity },
		openEntity: openEditSheet,
		closeEntity: closeEditSheet,
	} = useEntitySheet<Technician>();

	const {
		entityState: { open: addOpen },
		openEntity: openAddSheet,
		closeEntity: closeAddSheet,
	} = useEntitySheet<Technician>();

	const {
		entityState: { open: viewOpen, entity: viewEntity },
		openEntity: openViewSheet,
		closeEntity: closeViewSheet,
	} = useEntitySheet<Technician>();

	const handleDelete = (technician: Technician) => {
		if (technician.id !== undefined) {
			deleteTechnician.mutate(technician.id);
		}
	};

	const handleView = (technician: Technician) => {
		openViewSheet(technician);
	};

	const columns = getTechnicianColumns({
		onEdit: openEditSheet,
		onDelete: handleDelete,
		onView: handleView,
	});

	return (
		<Wrapper>
			<PageHeader
				icon={Users}
				title="Technician Management"
				description="Manage your technical staff, track their skills, certifications, and service assignments."
				breadcrumbs={["Dashboard", "Staff", "Technicians"]}
				isAdminOnly
				onRefresh={refetch}
				actionButton={
					isAdmin && (
						<Button onClick={() => openAddSheet()}>
							<Plus className="size-4 mr-2" />
							Add Technician
						</Button>
					)
				}
			/>

			{/* View Technician Sheet */}
			<EntitySheet<Technician>
				open={viewOpen}
				onClose={closeViewSheet}
				entity={viewEntity}
				title="Technician Details"
				description="View detailed information about this technician."
				renderForm={({ onClose, entity }) =>
					entity ? (
						<div className="space-y-6 p-6">
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div>
									<label className="text-sm font-medium text-muted-foreground">
										First Name
									</label>
									<p className="text-base font-medium">
										{entity.first_name || "N/A"}
									</p>
								</div>
								<div>
									<label className="text-sm font-medium text-muted-foreground">
										Last Name
									</label>
									<p className="text-base font-medium">
										{entity.last_name || "N/A"}
									</p>
								</div>
								<div>
									<label className="text-sm font-medium text-muted-foreground">
										Email
									</label>
									<p className="text-base font-medium">
										{entity.email || "N/A"}
									</p>
								</div>
								<div>
									<label className="text-sm font-medium text-muted-foreground">
										Contact Number
									</label>
									<p className="text-base font-medium">
										{entity.contact_number || "N/A"}
									</p>
								</div>
								<div className="sm:col-span-2">
									<label className="text-sm font-medium text-muted-foreground">
										Address
									</label>
									<p className="text-base font-medium">
										{entity.address || "N/A"}
									</p>
								</div>
								<div className="sm:col-span-2">
									<label className="text-sm font-medium text-muted-foreground">
										Province & City
									</label>
									<p className="text-base font-medium">
										{entity.province && entity.city
											? `${entity.city}, ${entity.province}`
											: "No location specified"}
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
										Edit Technician
									</Button>
								)}
							</div>
						</div>
					) : null
				}
			/>

			{/* Edit Technician Sheet */}
			<EntitySheet<Technician>
				open={editOpen}
				onClose={closeEditSheet}
				entity={entity}
				title="Edit Technician"
				description="Update the technician details below."
				withCloseConfirmation
				renderForm={({ forceClose, entity }) => (
					<TechnicianForm onClose={forceClose} technician={entity} />
				)}
			/>

			{/* Add Technician Sheet */}
			<EntitySheet<Technician>
				open={addOpen}
				onClose={closeAddSheet}
				title="Add Technician"
				description="Fill out the form below to add a new technician."
				withCloseConfirmation
				renderForm={({ forceClose }) => (
					<TechnicianForm onClose={forceClose} />
				)}
			/>

			{/* Main Content */}
			<DataTable
				title="Technicians"
				description="Manage your technical staff and their information"
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
