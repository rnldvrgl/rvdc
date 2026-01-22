"use client";

import EntitySheet from "@/components/custom/shared/EntitySheet";
import PageHeader from "@/components/custom/shared/PageHeader";
import { Wrapper } from "@/components/custom/shared/Wrapper";
import { DataTable } from "@/components/custom/table/DataTable";
import { ChequeCollectionDetails } from "@/components/details/ChequeCollectionDetails";
import ChequeCollectionForm from "@/components/forms/ChequeCollectionForm";
import { Button } from "@/components/ui/button";
import { ChequeCollection } from "@/lib/constants/interface";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useEntitySheet } from "@/lib/hooks/useEntitySheet";
import useSearchParameters from "@/lib/hooks/useSearchParameters";
import { useChequeCollectionMutations } from "@/lib/mutations/useChequeCollectionMutations";
import {
	useChequeCollectionFilters,
	useChequeCollections,
} from "@/lib/queries/useChequeCollections";
import { Plus, Receipt } from "lucide-react";
import { getChequeCollectionColumns } from "./columns";

export default function ChequeCollectionsPage() {
	const { role, isAdmin } = useCurrentUser();
	const { page, limit, search, ordering, filter } = useSearchParameters();
	const { data, isLoading, refetch } = useChequeCollections({
		page,
		limit,
		search,
		ordering,
		filter,
	});

	const { filters, orderingOptions } = useChequeCollectionFilters();
	const { deleteChequeCollection } = useChequeCollectionMutations();

	const {
		entityState: viewSheet,
		openEntity: openView,
		closeEntity: closeView,
	} = useEntitySheet<ChequeCollection>();
	const {
		entityState: createSheet,
		openEntity: openCreate,
		closeEntity: closeCreate,
	} = useEntitySheet<ChequeCollection>();
	const {
		entityState: editSheet,
		openEntity: openEdit,
		closeEntity: closeEdit,
	} = useEntitySheet<ChequeCollection>();

	const columns = getChequeCollectionColumns({
		onView: openView,
		onEdit: openEdit,
		onDelete: (record) => {
			if (record?.id) deleteChequeCollection.mutate(record.id);
		},
		role: role ?? "guest",
	});

	return (
		<Wrapper>
			<PageHeader
				icon={Receipt}
				title="Cheque Collections"
				description="Manage and track cheque collections from clients with comprehensive payment monitoring and reconciliation."
				variant="default"
				theme="default"
				breadcrumbs={["Dashboard", "Receivables", "Cheques"]}
				isAdminOnly={!isAdmin}
				actionButton={
					isAdmin && (
						<Button onClick={() => openCreate()}>
							<Plus className="size-4 mr-2" />
							New Collection
						</Button>
					)
				}
			/>

			{/* Create Cheque Collection Sheet */}
			<EntitySheet
				open={createSheet.open}
				onClose={closeCreate}
				title="New Cheque Collection"
				description="Record a new cheque collection from a client."
				withCloseConfirmation
				renderForm={({ forceClose }) => (
					<ChequeCollectionForm onClose={forceClose} />
				)}
			/>

			{/* Edit Cheque Collection Sheet */}
			<EntitySheet
				open={editSheet.open}
				onClose={closeEdit}
				entity={editSheet.entity}
				title="Edit Cheque Collection"
				description="Update cheque collection details and information."
				withCloseConfirmation
				renderForm={({ forceClose, entity }) =>
					entity ? (
						<ChequeCollectionForm
							initialData={entity}
							onClose={forceClose}
						/>
					) : null
				}
			/>

			{/* View Cheque Collection Sheet */}
			<EntitySheet
				open={viewSheet.open}
				onClose={closeView}
				entity={viewSheet.entity}
				title="Cheque Collection Details"
				description="View comprehensive cheque collection information and status."
				renderForm={({ entity, onClose }) =>
					entity ? (
						<ChequeCollectionDetails
							entity={entity}
							onClose={onClose}
						/>
					) : null
				}
			/>

			{/* Main Content */}
			<DataTable
				title="Cheque Collections"
				description="Client cheque payments and collection tracking"
				isLoading={isLoading}
				columns={columns}
				data={
					data ?? {
						count: 0,
						next: null,
						previous: null,
						results: [],
					}
				}
				defaultRangePreset="Last 30 Days"
				filters={filters}
				orderingOptions={orderingOptions}
				onRefresh={refetch}
			/>
		</Wrapper>
	);
}
