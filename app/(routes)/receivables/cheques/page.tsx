"use client"

import EntitySheet from "@/components/custom/shared/EntitySheet"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { DataTable } from "@/components/custom/table/DataTable"
import { ChequeCollectionDetails } from "@/components/details/ChequeCollectionDetails"
import ChequeCollectionForm from "@/components/forms/ChequeCollectionForm"
import { Button } from "@/components/ui/button"
import { ChequeCollection } from "@/lib/constants/interface"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useEntitySheet } from "@/lib/hooks/useEntitySheet"
import useSearchParameters from "@/lib/hooks/useSearchParameters"
import { useChequeCollectionMutations } from "@/lib/mutations/useChequeCollectionMutations"
import {
    useChequeCollectionFilters,
    useChequeCollections,
} from "@/lib/queries/useChequeCollections"
import { Plus, Receipt } from "lucide-react"
import { getChequeCollectionColumns } from "./columns"

export default function ChequeCollectionsPage() {
    const { role, canManage } = useCurrentUser()
    const { page, limit, search, ordering, filter } = useSearchParameters({
        defaultRangePreset: "Last 30 Days",
    })
    const { data, isLoading, refetch } = useChequeCollections({
        page,
        limit,
        search,
        ordering,
        filter,
    })

    const { filters, orderingOptions } = useChequeCollectionFilters()
    const { deleteChequeCollection } = useChequeCollectionMutations()

    const {
        entityState: viewSheet,
        openEntity: openView,
        closeEntity: closeView,
    } = useEntitySheet<ChequeCollection>()
    const {
        entityState: createSheet,
        openEntity: openCreate,
        closeEntity: closeCreate,
    } = useEntitySheet<ChequeCollection>()
    const {
        entityState: editSheet,
        openEntity: openEdit,
        closeEntity: closeEdit,
    } = useEntitySheet<ChequeCollection>()

    const columns = getChequeCollectionColumns({
        onView: openView,
        onEdit: openEdit,
        onDelete: (record) => {
            if (record?.id) deleteChequeCollection.mutate(record.id)
        },
        role: role ?? "guest",
    })

    const formSheetClassName = "sm:min-w-2xl!"

    return (
        <Wrapper>
            <PageHeader
                icon={Receipt}
                title="Cheque Collections"
                description="Manage and track cheque collections from clients with comprehensive payment monitoring and reconciliation."
                breadcrumbs={["Dashboard", "Receivables", "Cheques"]}
                isAdminOnly={!canManage}
                actionButton={
                    canManage && (
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
                className={formSheetClassName}
                withCloseConfirmation
                renderForm={({ forceClose }) => (
                    <ChequeCollectionForm onCloseAction={forceClose} />
                )}
            />

            {/* Edit Cheque Collection Sheet */}
            <EntitySheet
                open={editSheet.open}
                onClose={closeEdit}
                entity={editSheet.entity}
                title="Edit Cheque Collection"
                className={formSheetClassName}
                description="Update cheque collection details and information."
                withCloseConfirmation
                renderForm={({ forceClose, entity }) =>
                    entity ? (
                        <ChequeCollectionForm
                            initialData={entity}
                            onCloseAction={forceClose}
                        />
                    ) : null
                }
            />

            {/* View Cheque Collection Sheet */}
            <EntitySheet
                open={viewSheet.open}
                onClose={closeView}
                entity={viewSheet.entity}
                className={formSheetClassName}
                title="Cheque Collection Details"
                description="View comprehensive cheque collection information and status."
                renderForm={({ entity, onClose }) =>
                    entity ? (
                        <ChequeCollectionDetails
                            entity={entity}
                            onCloseAction={onClose}
                        />
                    ) : null
                }
            />

            {/* Main Content */}
            <DataTable
                enableVirtualization
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
                emptyIcon={Receipt}
                emptyTitle="No cheques collected"
                emptyDescription="Record your first cheque collection to start tracking"
            />
        </Wrapper>
    )
}
