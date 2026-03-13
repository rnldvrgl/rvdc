"use client"

import { getOffenseColumns } from "@/app/(routes)/attendance/offenses/columns"
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
  const searchParams = useSearchParameters()
  const { page, limit, search, filter, ordering } = searchParams
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [offenseToDelete, setOffenseToDelete] = useState<number | null>(null)

  const { archivedQuery, restoreItem, hardDeleteItem } = useArchive<Offense>(
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
    if (offenseToDelete) {
      await deleteOffense.mutateAsync(offenseToDelete)
      setDeleteDialogOpen(false)
      setOffenseToDelete(null)
    }
  }

  const handleRestore = (offense: Offense) => {
    if (offense.id !== undefined) restoreItem.mutate(offense.id)
  }

  const handleHardDelete = (offense: Offense) => {
    if (offense.id !== undefined) hardDeleteItem.mutate(offense.id)
  }

  const columns = isArchived
    ? getOffenseColumns({
        onEdit: () => {},
        onDelete: () => {},
        onRestore: handleRestore,
        onHardDelete: handleHardDelete,
        isAdmin,
      })
    : getOffenseColumns({
        onEdit: openEdit,
        onDelete: handleDelete,
        isAdmin,
      })

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

        {!isArchived && statistics && statistics.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-yellow-200 dark:border-yellow-800 bg-linear-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/20 dark:to-yellow-900/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold text-yellow-900 dark:text-yellow-200">
                  Total Employees with Offenses
                </CardTitle>
                <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">
                  {statistics.length}
                </div>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                  {
                    statistics.filter((s: OffenseStatistics) => s.is_at_limit)
                      .length
                  }{" "}
                  at limit (≥3 offenses)
                </p>
              </CardContent>
            </Card>

            <Card className="border-orange-200 dark:border-orange-800 bg-linear-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold text-orange-900 dark:text-orange-200">
                  Total Offenses
                </CardTitle>
                <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <UserX className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                  {statistics.reduce(
                    (sum: number, s: OffenseStatistics) =>
                      sum + s.total_offenses,
                    0,
                  )}
                </div>
                <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                  Across all employees
                </p>
              </CardContent>
            </Card>

            <Card className="border-red-200 dark:border-red-800 bg-linear-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold text-red-900 dark:text-red-200">
                  Critical Attention
                </CardTitle>
                <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-900 dark:text-red-100">
                  {
                    statistics.filter((s: OffenseStatistics) => s.is_at_limit)
                      .length
                  }
                </div>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                  Employees need immediate action
                </p>
              </CardContent>
            </Card>
          </div>
        )}
        {/* DataTable */}
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
          {/* Edit Offense Sheet */}
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

          {/* Add Offense Sheet */}
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

          {/* Archive Confirmation Dialog */}
          <ConfirmDialog
            open={deleteDialogOpen}
            onCancel={() => setDeleteDialogOpen(false)}
            onConfirm={confirmDelete}
            title="Archive Offense"
            description="Are you sure you want to archive this offense record? You can restore it from the Archived tab."
            confirmText="Archive"
          />
        </>
      )}
    </Wrapper>
  )
}
