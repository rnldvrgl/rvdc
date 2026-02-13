"use client"

import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { DataTable } from "@/components/custom/table/DataTable"
import { CustomCalendarEventDialog } from "@/components/dialogs/CustomCalendarEventDialog"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import useSearchParameters from "@/lib/hooks/useSearchParameters"
import {
  CustomCalendarEvent,
  useCustomCalendarEvents,
  useDeleteCustomCalendarEvent,
} from "@/lib/queries/calendar/useCustomCalendarEvents"
import {
  HalfDaySchedule,
  useDeleteHalfDaySchedule,
  useHalfDaySchedules,
} from "@/lib/queries/useHalfDaySchedules"
import { CalendarDays, Clock4, Plus } from "lucide-react"
import { useState } from "react"
import { getHalfDayScheduleColumns } from "../half-day-schedules/columns"
import { getCalendarEventColumns } from "./columns"

export default function CalendarEventsPage() {
  const { page, limit, search, ordering, filter } = useSearchParameters()
  const [activeTab, setActiveTab] = useState("events")

  // Custom Events state
  const [eventDialogOpen, setEventDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] =
    useState<CustomCalendarEvent | null>(null)
  const [eventDeleteConfirmOpen, setEventDeleteConfirmOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<number | null>(null)

  // Half-Day state
  const [halfDayDialogOpen, setHalfDayDialogOpen] = useState(false)
  const [selectedHalfDay, setSelectedHalfDay] =
    useState<HalfDaySchedule | null>(null)
  const [halfDayDeleteConfirmOpen, setHalfDayDeleteConfirmOpen] =
    useState(false)
  const [halfDayToDelete, setHalfDayToDelete] = useState<number | null>(null)

  // Queries
  const { data: eventsData, isLoading: eventsLoading } =
    useCustomCalendarEvents({ page, limit, search, ordering, filter })
  const deleteEvent = useDeleteCustomCalendarEvent()

  const { data: halfDaysData, isLoading: halfDaysLoading } =
    useHalfDaySchedules({ page, limit, search, ordering, filter })
  const deleteHalfDay = useDeleteHalfDaySchedule()

  // Custom Events handlers
  const handleEditEvent = (event: CustomCalendarEvent) => {
    setSelectedEvent(event)
    setEventDialogOpen(true)
  }
  const handleDeleteEvent = (id: number) => {
    setEventToDelete(id)
    setEventDeleteConfirmOpen(true)
  }
  const confirmDeleteEvent = () => {
    if (eventToDelete) {
      deleteEvent.mutate(eventToDelete)
      setEventDeleteConfirmOpen(false)
      setEventToDelete(null)
    }
  }
  const handleAddEvent = () => {
    setSelectedEvent(null)
    setEventDialogOpen(true)
  }

  // Half-Day handlers
  const handleEditHalfDay = (schedule: HalfDaySchedule) => {
    setSelectedHalfDay(schedule)
    setHalfDayDialogOpen(true)
  }
  const handleDeleteHalfDay = (id: number) => {
    setHalfDayToDelete(id)
    setHalfDayDeleteConfirmOpen(true)
  }
  const confirmDeleteHalfDay = () => {
    if (halfDayToDelete) {
      deleteHalfDay.mutate(halfDayToDelete)
      setHalfDayDeleteConfirmOpen(false)
      setHalfDayToDelete(null)
    }
  }
  const handleAddHalfDay = () => {
    setSelectedHalfDay(null)
    setHalfDayDialogOpen(true)
  }

  const eventColumns = getCalendarEventColumns({
    onEdit: handleEditEvent,
    onDelete: handleDeleteEvent,
  })

  const halfDayColumns = getHalfDayScheduleColumns({
    onEdit: handleEditHalfDay,
    onDelete: handleDeleteHalfDay,
  })

  return (
    <Wrapper>
      <PageHeader
        title="Calendar Events"
        description="Manage custom calendar events and half-day schedules"
        icon={CalendarDays}
        actionButton={
          <Button
            onClick={activeTab === "events" ? handleAddEvent : handleAddHalfDay}
          >
            <Plus className="size-4 mr-2" />
            {activeTab === "events" ? "Add Event" : "Add Half-Day"}
          </Button>
        }
      />

      {/* Dialogs */}
      <CustomCalendarEventDialog
        open={eventDialogOpen}
        onOpenChange={() => {
          setEventDialogOpen(false)
          setSelectedEvent(null)
        }}
        event={selectedEvent}
      />

      <HalfDayScheduleDialog
        open={halfDayDialogOpen}
        onOpenChange={() => {
          setHalfDayDialogOpen(false)
          setSelectedHalfDay(null)
        }}
        schedule={selectedHalfDay}
      />

      {/* Delete confirmations */}
      <AlertDialog
        open={eventDeleteConfirmOpen}
        onOpenChange={setEventDeleteConfirmOpen}
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
            onClick={confirmDeleteEvent}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={halfDayDeleteConfirmOpen}
        onOpenChange={setHalfDayDeleteConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Half-Day Schedule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this half-day schedule? Employees
              will no longer be capped at half-day hours for this date.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmDeleteHalfDay}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList>
          <TabsTrigger
            value="events"
            className="gap-2"
          >
            <CalendarDays className="size-4" />
            Custom Events
          </TabsTrigger>
          <TabsTrigger
            value="half-days"
            className="gap-2"
          >
            <Clock4 className="size-4" />
            Half-Day Schedules
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          <DataTable
            isLoading={eventsLoading}
            columns={eventColumns}
            data={
              eventsData || {
                count: 0,
                next: null,
                previous: null,
                results: [],
              }
            }
            withoutDateRangeFilter
          />
        </TabsContent>

        <TabsContent value="half-days">
          <DataTable
            isLoading={halfDaysLoading}
            columns={halfDayColumns}
            data={
              halfDaysData || {
                count: 0,
                next: null,
                previous: null,
                results: [],
              }
            }
            withoutDateRangeFilter
          />
        </TabsContent>
      </Tabs>
    </Wrapper>
  )
}
