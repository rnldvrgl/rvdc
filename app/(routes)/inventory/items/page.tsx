"use client";

import { getItemColumns } from "@/app/(routes)/inventory/items/columns";
import EntitySheet from "@/components/custom/shared/EntitySheet";
import PageHeader from "@/components/custom/shared/PageHeader";
import { Wrapper } from "@/components/custom/shared/Wrapper";
import { DataTable } from "@/components/custom/table/DataTable";
import ItemForm from "@/components/forms/inventory/ItemForm";
import { Button } from "@/components/ui/button";
import { Item } from "@/lib/constants/interface";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useEntitySheet } from "@/lib/hooks/useEntitySheet";
import useSearchParameters from "@/lib/hooks/useSearchParameters";
import { useItemMutations } from "@/lib/mutations/useItemMutations";
import { useItemFilters, useItems } from "@/lib/queries/inventory/useItems";
import { Plus, Package } from "lucide-react";

export default function ItemsPage() {
	const { isAdmin, role } = useCurrentUser();
	const { page, limit, search, ordering, filter } = useSearchParameters();
	const { deleteItem } = useItemMutations();
	const { data, isLoading, refetch } = useItems({
		page,
		limit,
		search,
		ordering,
		filter,
	});
	const { filters, orderingOptions } = useItemFilters();

	const {
		entityState: { open: editOpen, entity },
		openEntity: openEditSheet,
		closeEntity: closeEditSheet,
	} = useEntitySheet<Item>();

	const {
		entityState: { open: addOpen },
		openEntity: openAddSheet,
		closeEntity: closeAddSheet,
	} = useEntitySheet<Item>();

	const handleDelete = (item: Item) => {
		if (item.id !== undefined) {
			deleteItem.mutate(item.id);
		}
	};

	const columns = getItemColumns({
		onEdit: openEditSheet,
		onDelete: handleDelete,
		role: role || "guest",
	});

	return (
		<Wrapper>
			<PageHeader
				icon={Package}
				title="Inventory Items"
				description="Manage your product catalog, track item details, and monitor inventory levels across all categories."
				breadcrumbs={["Dashboard", "Inventory", "Items"]}
				isAdminOnly
				actionButton={
					isAdmin && (
						<Button onClick={() => openAddSheet()}>
							<Plus className="size-4 mr-2" />
							Add Item
						</Button>
					)
				}
			/>

			{/* Edit Item Sheet */}
			<EntitySheet<Item>
				open={editOpen}
				onClose={closeEditSheet}
				entity={entity}
				title="Edit Item"
				description="Update the item details below."
				withCloseConfirmation
				renderForm={({ forceClose, entity }) => (
					<ItemForm onClose={forceClose} item={entity} />
				)}
			/>

			{/* Add Item Sheet */}
			<EntitySheet<Item>
				open={addOpen}
				onClose={closeAddSheet}
				title="Add Item"
				description="Fill out the form below to add a new item."
				withCloseConfirmation
				renderForm={({ forceClose }) => (
					<ItemForm onClose={forceClose} />
				)}
			/>

			{/* Main Content */}
			<DataTable
				title="Inventory Items"
				description="Manage your product catalog and inventory"
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
			/>
		</Wrapper>
	);
}
