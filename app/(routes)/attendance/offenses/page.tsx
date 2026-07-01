"use client"

import { getOffenseColumns } from "@/app/(routes)/attendance/offenses/columns"
import { AnimatedNumber } from "@/components/custom/shared/AnimatedNumber"
import { ArchiveToggle } from "@/components/custom/shared/ArchiveToggle"
import { ConfirmDialog } from "@/components/custom/shared/ConfirmDialog"
import EntitySheet from "@/components/custom/shared/EntitySheet"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { DataTable } from "@/components/custom/table/DataTable"
import OffenseForm from "@/components/forms/OffenseForm"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Offense, OffenseStatistics } from "@/lib/constants/types"
import { useArchive } from "@/lib/hooks/useArchive"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useEntitySheet } from "@/lib/hooks/useEntitySheet"
import useSearchParameters from "@/lib/hooks/useSearchParameters"
import { useOffenseMutations } from "@/lib/mutations/useAttendanceMutations"
import {
    useOffenseFilters,
    useOffenses,
    useOffenseStatistics,
} from "@/lib/queries/useAttendance"
import { AlertCircle, AlertTriangle, Plus, UserX } from "lucide-react"
import { useState } from "react"

export default function OffensesPage() {
    const { isAdmin } = useCurrentUser()
    const [isArchived, setIsArchived] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [offenseToDelete, setOffenseToDelete] = useState<number | null>(null)

    const searchParams = useSearchParameters()
    const { page, limit, search, filter, ordering } = searchParams

    const { archivedQuery, restoreItem } = useArchive<Offense>(
        "/attendance/offenses/",
        "offenses",
        searchParams,
        isArchived,
    )

    const { data, isLoading, refetch } = useOffenses({
        page,
        limit,
        search,
        ordering,
        filter,
    })
    const { data: statistics } = useOffenseStatistics()
    const { deleteOffense } = useOffenseMutations()
    const { filters, orderingOptions } = useOffenseFilters()

    const {
        entityState: { open: editOpen, entity },
        openEntity: openEdit,
        closeEntity: closeEdit,
    } = useEntitySheet<Offense>()

    const {
        entityState: { open: addOpen },
        openEntity: openAdd,
        closeEntity: closeAdd,
    } = useEntitySheet<Offense>()

    const handleDelete = (id: number) => {
        setOffenseToDelete(id)
        setDeleteDialogOpen(true)
    }

    const confirmDelete = async () => {
        if (!offenseToDelete) return

        await deleteOffense.mutateAsync(offenseToDelete)
        setDeleteDialogOpen(false)
        setOffenseToDelete(null)
    }

    const handleRestore = (offense: Offense) => {
        if (offense.id !== undefined) restoreItem.mutate(offense.id)
    }

    const columns = isArchived
        ? getOffenseColumns({
              onEdit: () => {},
              onDelete: () => {},
              onRestore: handleRestore,
              isAdmin,
          })
        : getOffenseColumns({
              onEdit: openEdit,
              onDelete: handleDelete,
              isAdmin,
          })

    const offenseStats = statistics ?? []
    const offensesAtLimit = offenseStats.filter((item) => item.is_at_limit).length
    const totalOffenses = offenseStats.reduce(
        (sum: number, item: OffenseStatistics) => sum + item.total_offenses,
        0,
    )

    return (
        <Wrapper>
            <div className="space-y-4 md:space-y-6">
                <PageHeader
                    title="Offense Management"
                    description="Track and manage employee policy violations with automatic 3-strike system."
                    icon={UserX}
                    onRefresh={refetch}
                    actionButton={
                        !isArchived && (
                            <Button onClick={() => openAdd()}>
                                <Plus className="size-4 mr-2" />
                                Record Offense
                            </Button>
                        )
                    }
                    isAdminOnly
                />

                <ArchiveToggle
                    isArchived={isArchived}
                    onToggle={setIsArchived}
                    archivedCount={archivedQuery.data?.count}
                />

                {!isArchived && offenseStats.length > 0 && (
                    <div className="grid gap-4 lg:grid-cols-3">
                        <Card className="overflow-hidden border-border/70 bg-linear-to-br from-warning/10 via-background to-muted/30 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-2">
                                <CardTitle className="text-sm font-semibold text-warning">
                                    Total Employees with Offenses
                                </CardTitle>
                                <div className="flex size-11 items-center justify-center rounded-2xl bg-warning/10 text-warning ring-1 ring-warning/20">
                                    <AlertTriangle className="h-5 w-5" />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-1">
                                <AnimatedNumber
                                    value={offenseStats.length}
                                    className="text-3xl font-bold text-foreground sm:text-4xl"
                                />
                                <p className="text-xs text-muted-foreground">
                                    {offensesAtLimit} at limit (≥3 offenses)
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="overflow-hidden border-border/70 bg-linear-to-br from-info/10 via-background to-muted/30 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-2">
                                <CardTitle className="text-sm font-semibold text-info">
                                    Total Offenses
                                </CardTitle>
                                <div className="flex size-11 items-center justify-center rounded-2xl bg-info/10 text-info ring-1 ring-info/20">
                                    <UserX className="h-5 w-5" />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-1">
                                <AnimatedNumber
                                    value={totalOffenses}
                                    className="text-3xl font-bold text-foreground sm:text-4xl"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Across all employees
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="overflow-hidden border-border/70 bg-linear-to-br from-destructive/10 via-background to-muted/30 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-2">
                                <CardTitle className="text-sm font-semibold text-destructive">
                                    Critical Attention
                                </CardTitle>
                                <div className="flex size-11 items-center justify-center rounded-2xl bg-destructive/10 text-destructive ring-1 ring-destructive/20">
                                    <AlertCircle className="h-5 w-5" />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-1">
                                <AnimatedNumber
                                    value={offensesAtLimit}
                                    className="text-3xl font-bold text-foreground sm:text-4xl"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Employees need immediate action
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                <DataTable
                    enableVirtualization
                    title="Offense Records"
                    description="Track and manage employee policy violations"
                    isLoading={isArchived ? archivedQuery.isLoading : isLoading}
                    columns={columns}
                    data={
                        (isArchived ? archivedQuery.data : data) || {
                            count: 0,
                            next: null,
                            previous: null,
                            results: [],
                        }
                    }
                    filters={isArchived ? undefined : filters}
                    orderingOptions={isArchived ? undefined : orderingOptions}
                    onRefresh={isArchived ? archivedQuery.refetch : refetch}
                    withoutDateRangeFilter
                    emptyTitle={isArchived ? "No archived offenses" : undefined}
                    emptyDescription={
                        isArchived ? "Archived offenses will appear here" : undefined
                    }
                />
            </div>

            {!isArchived && (
                <>
                    <EntitySheet<Offense>
                        open={editOpen}
                        onClose={closeEdit}
                        entity={entity}
                        title="Edit Offense"
                        description="Update offense details. Severity and offense type are locked."
                        withCloseConfirmation
                        renderForm={({ forceClose, entity }) => (
                            <OffenseForm
                                offense={entity}
                                onClose={closeEdit}
                                forceClose={forceClose}
                            />
                        )}
                        className="min-w-xl"
                    />

                    <EntitySheet<Offense>
                        open={addOpen}
                        onClose={closeAdd}
                        title="Record New Offense"
                        description="Document employee policy violation. Severity will be automatically assigned."
                        withCloseConfirmation
                        renderForm={({ forceClose }) => (
                            <OffenseForm
                                onClose={closeAdd}
                                forceClose={forceClose}
                            />
                        )}
                        className="min-w-xl"
                    />

                    <ConfirmDialog
                        open={deleteDialogOpen}
                        onCancel={() => setDeleteDialogOpen(false)}
                        onConfirm={confirmDelete}
                        title="Archive Offense"
                        description="Are you sure you want to archive this offense record? You can restore it from the Archived tab."
                        confirmText="Archive"
                        variant="warning"
                    />
                </>
            )}
        </Wrapper>
    )
}
