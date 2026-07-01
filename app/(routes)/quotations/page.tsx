"use client"

import { getQuotationColumns } from "@/app/(routes)/quotations/columns"
import QuotationTemplatesManager from "@/app/(routes)/quotations/templates"
import QuotationViewSheet from "@/app/(routes)/quotations/view"
import { ArchiveToggle } from "@/components/custom/shared/ArchiveToggle"
import EntitySheet from "@/components/custom/shared/EntitySheet"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { DataTable } from "@/components/custom/table/DataTable"
import QuotationForm from "@/components/forms/QuotationForm"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Quotation } from "@/lib/constants/types"
import { useArchive } from "@/lib/hooks/useArchive"
import { useEntitySheet } from "@/lib/hooks/useEntitySheet"
import useSearchParameters from "@/lib/hooks/useSearchParameters"
import { useQuotationMutations } from "@/lib/mutations/useQuotationMutations"
import { useQuotation, useQuotations } from "@/lib/queries/useQuotations"
import { FileText, Loader2, Plus, Settings } from "lucide-react"
import { useState } from "react"

const emptyData = {
    count: 0,
    next: null,
    previous: null,
    results: [] as Quotation[],
}

export default function QuotationsPage() {
    const searchParams = useSearchParameters({})
    const { page, limit, search, filter, ordering } = searchParams
    const [isArchived, setIsArchived] = useState(false)
    const { deleteQuotation } = useQuotationMutations()

    const { data, isLoading, refetch } = useQuotations({
        page,
        limit,
        search,
        ordering,
        filter,
    })

    const { archivedQuery, restoreItem } = useArchive<Quotation>(
        "quotations/",
        "quotations",
        searchParams,
        isArchived,
    )

    const {
        entityState: viewSheet,
        openEntity: openView,
        closeEntity: closeView,
    } = useEntitySheet<Quotation>()

    const {
        entityState: editSheet,
        openEntity: openEdit,
        closeEntity: closeEdit,
    } = useEntitySheet<Quotation>()

    const {
        entityState: { open: addOpen },
        openEntity: openAddSheet,
        closeEntity: closeAddSheet,
    } = useEntitySheet<Quotation>()

    const handleDelete = (q: Quotation) => {
        if (q.id !== undefined) deleteQuotation.mutate(q.id)
    }
    const handleRestore = (q: Quotation) => {
        if (q.id !== undefined) restoreItem.mutate(q.id)
    }

    const columns = isArchived
        ? getQuotationColumns({
            onEdit: () => { },
            onDelete: () => { },
            onRestore: handleRestore,
        })
        : getQuotationColumns({
            onView: openView,
            onEdit: openEdit,
            onDelete: handleDelete,
        })

    const tableData = isArchived
        ? archivedQuery.data || emptyData
        : data || emptyData

    return (
        <Wrapper>
            <PageHeader
                icon={FileText}
                title="Quotations"
                description="Create, manage, and track quotations for clients."
                breadcrumbs={["Dashboard", "Quotations"]}
                onRefresh={isArchived ? archivedQuery.refetch : refetch}
                actionButton={
                    !isArchived ? (
                        <Button
                            onClick={() => openAddSheet()}
                            size="default"
                        >
                            <Plus className="size-5 mr-2" />
                            New Quotation
                        </Button>
                    ) : undefined
                }
            />

            <Tabs defaultValue="quotations">
                <TabsList>
                    <TabsTrigger value="quotations">
                        <FileText className="mr-1.5 h-3.5 w-3.5" />
                        Quotations
                    </TabsTrigger>
                    <TabsTrigger value="templates">
                        <Settings className="mr-1.5 h-3.5 w-3.5" />
                        Templates
                    </TabsTrigger>
                </TabsList>

                {/* Sheets rendered OUTSIDE tabs so they're always available */}
                {viewSheet.entity && (
                    <QuotationViewSheet
                        open={viewSheet.open}
                        onClose={closeView}
                        quotation={viewSheet.entity}
                    />
                )}

                {!isArchived && (
                    <EditQuotationSheet
                        open={editSheet.open}
                        onClose={closeEdit}
                        quotation={editSheet.entity}
                    />
                )}

                {!isArchived && (
                    <EntitySheet<Quotation>
                        open={addOpen}
                        onClose={closeAddSheet}
                        title="New Quotation"
                        description="Fill out the form to create a new quotation."
                        withCloseConfirmation
                        className="w-full max-w-[95vw] md:max-w-[85vw] lg:max-w-4xl xl:max-w-5xl"
                        renderForm={({ forceClose }) => (
                            <QuotationForm onCloseAction={forceClose} />
                        )}
                    />
                )}

                <TabsContent value="quotations">
                    <ArchiveToggle
                        isArchived={isArchived}
                        onToggle={setIsArchived}
                        archivedCount={archivedQuery.data?.count}
                    />

                    <DataTable
                        enableVirtualization
                        title={isArchived ? "Archived Quotations" : "Quotations"}
                        description={
                            isArchived
                                ? "Restore or permanently delete archived quotations"
                                : "All quotations created for clients"
                        }
                        isLoading={isArchived ? archivedQuery.isLoading : isLoading}
                        columns={columns}
                        data={tableData}
                        onRefresh={isArchived ? archivedQuery.refetch : refetch}
                        emptyIcon={FileText}
                        emptyTitle={
                            isArchived ? "No archived quotations" : "No quotations yet"
                        }
                        emptyDescription={
                            isArchived
                                ? "Archived quotations will appear here"
                                : "Create your first quotation to get started"
                        }
                    />
                </TabsContent>

                <TabsContent value="templates">
                    <QuotationTemplatesManager />
                </TabsContent>
            </Tabs>
        </Wrapper>
    )
}

/* ── Edit Sheet with detail fetch ── */
function EditQuotationSheet({
    open,
    onClose,
    quotation,
}: {
    open: boolean
    onClose: () => void
    quotation?: Quotation
}) {
    const { data: detail, isLoading } = useQuotation(
        quotation?.id != null ? String(quotation.id) : "",
    )

    return (
        <EntitySheet<Quotation>
            open={open}
            onClose={onClose}
            entity={detail || quotation}
            title="Edit Quotation"
            description="Update the quotation details below."
            withCloseConfirmation
            className="w-full max-w-[95vw] md:max-w-[85vw] lg:max-w-4xl xl:max-w-5xl"
            renderForm={({ forceClose, entity }) =>
                isLoading ? (
                    <div className="flex items-center justify-center py-20 text-muted-foreground">
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Loading quotation...
                    </div>
                ) : (
                    <QuotationForm
                        onCloseAction={forceClose}
                        quotation={entity}
                    />
                )
            }
        />
    )
}
