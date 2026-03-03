"use client"

import { ArchiveToggle } from "@/components/custom/shared/ArchiveToggle"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { DataTable } from "@/components/custom/table/DataTable"
import { HalfDayScheduleDialog } from "@/components/dialogs/HalfDayScheduleDialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { useArchive } from "@/lib/hooks/useArchive"
import useSearchParameters from "@/lib/hooks/useSearchParameters"
import {
  HalfDaySchedule,
  useDeleteHalfDaySchedule,
  useHalfDaySchedules,
} from "@/lib/queries/useHalfDaySchedules"
import { CalendarClock, Plus } from "lucide-react"
import { useState } from "react"
import { getHalfDayScheduleColumns } from "./columns"

export default function HalfDaySchedulesPage() {
  const searchParams = useSearchParameters()
  const { page, limit, search, ordering, filter } = searchParams
  const [isArchived, setIsArchived] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedSchedule, setSelectedSchedule] =
    useState<HalfDaySchedule | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [scheduleToDelete, setScheduleToDelete] = useState<number | null>(null)

  const { data, isLoading } = useHalfDaySchedules({
    page,
    limit,
    search,
    ordering,
    filter,
  })
  const deleteSchedule = useDeleteHalfDaySchedule()

  const { archivedQuery, restoreItem, hardDeleteItem } =
    useArchive<HalfDaySchedule>(
      "/attendance/half-day-schedules/",
      "half-day-schedules",
      searchParams,
      isArchived,
    )

  const handleEdit = (schedule: HalfDaySchedule) => {
    setSelectedSchedule(schedule)
    setDialogOpen(true)
  }

  const handleDelete = (id: number) => {
    setScheduleToDelete(id)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = () => {
    if (scheduleToDelete) {
      deleteSchedule.mutate(scheduleToDelete)
      setDeleteConfirmOpen(false)
      setScheduleToDelete(null)
    }
  }

  const handleAddSchedule = () => {
    setSelectedSchedule(null)
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setSelectedSchedule(null)
  }

  const handleRestoreSchedule = (schedule: HalfDaySchedule) => {
    restoreItem.mutate(schedule.id)
  }
  const handleHardDeleteSchedule = (schedule: HalfDaySchedule) => {
    hardDeleteItem.mutate(schedule.id)
  }

  const columns = isArchived
    ? getHalfDayScheduleColumns({
        onEdit: () => {},
        onDelete: () => {},
        onRestore: handleRestoreSchedule,
        onHardDelete: handleHardDeleteSchedule,
      })
    : getHalfDayScheduleColumns({
        onEdit: handleEdit,
        onDelete: handleDelete,
      })

  return (
    <Wrapper>
      <PageHeader
        title="Half-Day Schedules"
        description="Manage forced half-day dates. Employees will be capped at 4 paid hours on these dates."
        icon={CalendarClock}
        actionButton={
          !isArchived && (
            <Button onClick={handleAddSchedule}>
              <Plus className="size-4 mr-2" />
              Add Half-Day
            </Button>
          )
        }
      />

      <ArchiveToggle
        isArchived={isArchived}
        onToggle={setIsArchived}
        archivedCount={archivedQuery.data?.count}
      />

      {!isArchived && (
        <>
          <HalfDayScheduleDialog
            open={dialogOpen}
            onOpenChange={handleCloseDialog}
            schedule={selectedSchedule}
          />

          <AlertDialog
            open={deleteConfirmOpen}
            onOpenChange={setDeleteConfirmOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Archive Half-Day Schedule</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to archive this half-day schedule?
                  Employees will no longer be capped at half-day hours for this
                  date. You can restore it from the Archived tab.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>
                Archive
              </AlertDialogAction>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}

      <DataTable
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
        withoutDateRangeFilter
        emptyIcon={CalendarClock}
        emptyTitle={
          isArchived
            ? "No archived half-day schedules"
            : "No half-day schedules"
        }
        emptyDescription={
          isArchived
            ? "Archived schedules will appear here"
            : "Create schedules to define half-day work periods"
        }
      />
    </Wrapper>
  )
}
