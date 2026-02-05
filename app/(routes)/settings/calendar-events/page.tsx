"use client"

import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { DataTable } from "@/components/custom/table/DataTable"
import { CustomCalendarEventDialog } from "@/components/dialogs/CustomCalendarEventDialog"
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
import useSearchParameters from "@/lib/hooks/useSearchParameters"
import {
  CustomCalendarEvent,
  useCustomCalendarEvents,
  useDeleteCustomCalendarEvent,
} from "@/lib/queries/calendar/useCustomCalendarEvents"
import { CalendarDays, Plus } from "lucide-react"
import { useState } from "react"
import { getCalendarEventColumns } from "./columns"

export default function CalendarEventsPage() {
  const { page, limit, search, ordering, filter } = useSearchParameters()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] =
    useState<CustomCalendarEvent | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<number | null>(null)

  const { data, isLoading } = useCustomCalendarEvents({
    page,
    limit,
    search,
    ordering,
    filter,
  })
  const deleteEvent = useDeleteCustomCalendarEvent()

  const handleEdit = (event: CustomCalendarEvent) => {
    setSelectedEvent(event)
    setDialogOpen(true)
  }

  const handleDelete = (id: number) => {
    setEventToDelete(id)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = () => {
    if (eventToDelete) {
      deleteEvent.mutate(eventToDelete)
      setDeleteConfirmOpen(false)
      setEventToDelete(null)
    }
  }

  const handleAddEvent = () => {
    setSelectedEvent(null)
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setSelectedEvent(null)
  }

  const columns = getCalendarEventColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
  })

  return (
    <Wrapper>
      <PageHeader
        title="Calendar Events"
        description="Manage custom calendar events for the analytics dashboard"
        icon={CalendarDays}
        actionButton={
          <Button onClick={handleAddEvent}>
            <Plus className="size-4 mr-2" />
            Add Event
          </Button>
        }
      />

      <CustomCalendarEventDialog
        open={dialogOpen}
        onOpenChange={handleCloseDialog}
        event={selectedEvent}
      />

      <AlertDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this calendar event? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>

      <DataTable
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
  )
}
