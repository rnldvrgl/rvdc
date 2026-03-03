"use client"

import { ArchiveToggle } from "@/components/custom/shared/ArchiveToggle"
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
import { useArchive } from "@/lib/hooks/useArchive"
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
  const searchParams = useSearchParameters()
  const { page, limit, search, ordering, filter } = searchParams
  const [activeTab, setActiveTab] = useState("events")

  // Archive state
  const [isEventsArchived, setIsEventsArchived] = useState(false)
  const [isHalfDaysArchived, setIsHalfDaysArchived] = useState(false)

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

  // Archive hooks
  const {
    archivedQuery: archivedEventsQuery,
    restoreItem: restoreEvent,
    hardDeleteItem: hardDeleteEvent,
  } = useArchive<CustomCalendarEvent>(
    "/analytics/calendar-events/",
    "custom-calendar-events",
    searchParams,
    isEventsArchived,
  )
  const {
    archivedQuery: archivedHalfDaysQuery,
    restoreItem: restoreHalfDay,
    hardDeleteItem: hardDeleteHalfDay,
  } = useArchive<HalfDaySchedule>(
    "/attendance/half-day-schedules/",
    "half-day-schedules",
    searchParams,
    isHalfDaysArchived,
  )

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

  // Archive handlers
  const handleRestoreEvent = (event: CustomCalendarEvent) => {
    restoreEvent.mutate(event.id)
  }
  const handleHardDeleteEvent = (event: CustomCalendarEvent) => {
    hardDeleteEvent.mutate(event.id)
  }
  const handleRestoreHalfDay = (schedule: HalfDaySchedule) => {
    restoreHalfDay.mutate(schedule.id)
  }
  const handleHardDeleteHalfDay = (schedule: HalfDaySchedule) => {
    hardDeleteHalfDay.mutate(schedule.id)
  }

  const eventColumns = isEventsArchived
    ? getCalendarEventColumns({
        onEdit: () => {},
        onDelete: () => {},
        onRestore: handleRestoreEvent,
        onHardDelete: handleHardDeleteEvent,
      })
    : getCalendarEventColumns({
        onEdit: handleEditEvent,
        onDelete: handleDeleteEvent,
      })

  const halfDayColumns = isHalfDaysArchived
    ? getHalfDayScheduleColumns({
        onEdit: () => {},
        onDelete: () => {},
        onRestore: handleRestoreHalfDay,
        onHardDelete: handleHardDeleteHalfDay,
      })
    : getHalfDayScheduleColumns({
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
          ((activeTab === "events" && !isEventsArchived) ||
            (activeTab === "half-days" && !isHalfDaysArchived)) && (
            <Button
              onClick={
                activeTab === "events" ? handleAddEvent : handleAddHalfDay
              }
            >
              <Plus className="size-4 mr-2" />
              {activeTab === "events" ? "Add Event" : "Add Half-Day"}
            </Button>
          )
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

      {/* Archive confirmations */}
      <AlertDialog
        open={eventDeleteConfirmOpen}
        onOpenChange={setEventDeleteConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive this calendar event? You can
              restore it from the Archived tab.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={confirmDeleteEvent}>
            Archive
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={halfDayDeleteConfirmOpen}
        onOpenChange={setHalfDayDeleteConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Half-Day Schedule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive this half-day schedule? Employees
              will no longer be capped at half-day hours for this date. You can
              restore it from the Archived tab.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={confirmDeleteHalfDay}>
            Archive
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
          <ArchiveToggle
            isArchived={isEventsArchived}
            onToggle={setIsEventsArchived}
            archivedCount={archivedEventsQuery.data?.count}
          />
          <DataTable
            isLoading={
              isEventsArchived ? archivedEventsQuery.isLoading : eventsLoading
            }
            columns={eventColumns}
            data={
              (isEventsArchived ? archivedEventsQuery.data : eventsData) || {
                count: 0,
                next: null,
                previous: null,
                results: [],
              }
            }
            withoutDateRangeFilter
            emptyIcon={CalendarDays}
            emptyTitle={
              isEventsArchived ? "No archived events" : "No calendar events"
            }
            emptyDescription={
              isEventsArchived
                ? "Archived events will appear here"
                : "Add events to manage company holidays and closures"
            }
          />
        </TabsContent>

        <TabsContent value="half-days">
          <ArchiveToggle
            isArchived={isHalfDaysArchived}
            onToggle={setIsHalfDaysArchived}
            archivedCount={archivedHalfDaysQuery.data?.count}
          />
          <DataTable
            isLoading={
              isHalfDaysArchived
                ? archivedHalfDaysQuery.isLoading
                : halfDaysLoading
            }
            columns={halfDayColumns}
            data={
              (isHalfDaysArchived
                ? archivedHalfDaysQuery.data
                : halfDaysData) || {
                count: 0,
                next: null,
                previous: null,
                results: [],
              }
            }
            withoutDateRangeFilter
            emptyIcon={Clock4}
            emptyTitle={
              isHalfDaysArchived
                ? "No archived half-day schedules"
                : "No half-day schedules"
            }
            emptyDescription={
              isHalfDaysArchived
                ? "Archived schedules will appear here"
                : "Add half-day schedules for special work periods"
            }
          />
        </TabsContent>
      </Tabs>
    </Wrapper>
  )
}
