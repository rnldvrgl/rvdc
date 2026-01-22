"use client";

import EntitySheet from "@/components/custom/shared/EntitySheet";
import PageHeader from "@/components/custom/shared/PageHeader";
import { Wrapper } from "@/components/custom/shared/Wrapper";
import { DataTable } from "@/components/custom/table/DataTable";
import { StockTransferDetails } from "@/components/details/StockTransferDetails";
import StockTransferForm from "@/components/forms/inventory/StockTransferForm";
import { Button } from "@/components/ui/button";
import { StockTransfer } from "@/lib/constants/interface";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useEntitySheet } from "@/lib/hooks/useEntitySheet";
import useSearchParameters from "@/lib/hooks/useSearchParameters";
import { useStockTransferMutations } from "@/lib/mutations/useStockTransferMutations";
import {
	useStockTransferFilters,
	useStockTransfers,
} from "@/lib/queries/inventory/useStocks";
import { Plus, ArrowRightLeft, RefreshCw, Eye } from "lucide-react";
import { getStockTransferColumns } from "./columns";

export default function StockTransfersPage() {
	const { isAdmin } = useCurrentUser();
	const { page, limit, search, ordering, filter } = useSearchParameters();
	const { deleteStockTransfer, markTransferExpenseAsPaid } =
		useStockTransferMutations();
	const { data, isLoading, refetch } = useStockTransfers({
		page,
		limit,
		search,
		ordering,
		filter,
	});
	const { filters, orderingOptions } = useStockTransferFilters();

	const handleDelete = (stockTransfer: StockTransfer) => {
		if (stockTransfer.id !== undefined) {
			deleteStockTransfer.mutate(stockTransfer.id);
		}
	};

	const handleMarkAsPaid = (stockTransfer: StockTransfer) => {
		if (stockTransfer?.id) {
			markTransferExpenseAsPaid.mutate(stockTransfer.id);
		}
	};

	// Sheets
	const {
		entityState: viewSheet,
		openEntity: openView,
		closeEntity: closeView,
	} = useEntitySheet<StockTransfer>();
	const {
		entityState: createSheet,
		openEntity: openCreate,
		closeEntity: closeCreate,
	} = useEntitySheet<StockTransfer>();
	const {
		entityState: editSheet,
		openEntity: openEdit,
		closeEntity: closeEdit,
	} = useEntitySheet<StockTransfer>();

	const columns = getStockTransferColumns({
		onView: openView,
		onEdit: openEdit,
		onDelete: handleDelete,
	});

	return (
		<Wrapper>
			<PageHeader
				icon={ArrowRightLeft}
				title="Stock Transfers"
				description="Manage inventory transfers between stockroom and stalls with comprehensive tracking and expense management."
				variant="default"
				theme="default"
				breadcrumbs={["Dashboard", "Inventory", "Stocks", "Transfers"]}
				isAdminOnly={!isAdmin}
				actions={
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => refetch()}
							disabled={isLoading}
						>
							<RefreshCw
								className={`size-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
							/>
							Refresh
						</Button>
						{isAdmin && (
							<Button onClick={() => openCreate()}>
								<Plus className="size-4 mr-2" />
								New Transfer
							</Button>
						)}
					</div>
				}
			/>

			{/* Create Transfer Sheet */}
			<EntitySheet<StockTransfer>
				open={createSheet.open}
				onClose={closeCreate}
				title="New Stock Transfer"
				description="Create a new stock transfer by selecting technician, destination stall, and items."
				withCloseConfirmation
				renderForm={({ forceClose }) => (
					<StockTransferForm onClose={forceClose} />
				)}
			/>

			{/* Edit Transfer Sheet */}
			<EntitySheet<StockTransfer>
				open={editSheet.open}
				onClose={closeEdit}
				entity={editSheet.entity}
				title="Edit Stock Transfer"
				description="Update the details of this stock transfer."
				withCloseConfirmation
				renderForm={({ forceClose, entity }) => (
					<StockTransferForm
						onClose={forceClose}
						initialData={entity}
					/>
				)}
			/>

			{/* View Transfer Sheet */}
			<EntitySheet<StockTransfer>
				open={viewSheet.open}
				onClose={closeView}
				entity={viewSheet.entity}
				title="Transfer Details"
				description="Review the complete details of this stock transfer."
				withCloseConfirmation={false}
				renderForm={({ onClose, entity }) =>
					entity ? (
						<StockTransferDetails
							entity={entity}
							onClose={onClose}
							onMarkAsPaid={() => {
								handleMarkAsPaid(entity);
								closeView();
							}}
							markAsPaidPending={
								markTransferExpenseAsPaid.isPending
							}
						/>
					) : null
				}
			/>

			{/* Main Content */}
			<DataTable
				title="Stock Transfers"
				description="Track and manage inventory movements between locations"
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
				headerActions={
					isAdmin && (
						<Button onClick={() => openCreate()}>
							<Plus className="size-4 mr-2" />
							Transfer Stock
						</Button>
					)
				}
				defaultRangePreset="Last 30 Days"
				filters={filters}
				orderingOptions={orderingOptions}
				onRefresh={refetch}
			/>
		</Wrapper>
	);
}
