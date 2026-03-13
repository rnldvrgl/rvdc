"use client"

import { applianceStatusLabels } from "@/app/(routes)/services/columns"
import { Badge } from "@/components/ui/badge"
import type { ServiceAppliance } from "@/lib/constants/interface"
import { formatCurrency } from "@/lib/utils/helpers"

import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { motion } from "framer-motion"
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Package,
  Search,
  Truck,
  User,
  Wrench,
} from "lucide-react"
import { useCallback, useMemo, useState } from "react"

// --- Types ---
interface ApplianceKanbanBoardProps {
  appliances: ServiceAppliance[]
  onStatusChange?: (appliance: ServiceAppliance, newStatus: string) => void
  isUpdating?: boolean
}

type KanbanColumn = {
  id: string
  label: string
  icon: React.ReactNode
}

// --- Allowed appliance transitions ---
const APPLIANCE_TRANSITIONS: Record<string, string[]> = {
  received: ["diagnosed", "in_repair", "completed"],
  diagnosed: ["in_repair", "completed"],
  in_repair: ["completed", "ready_for_pickup"],
  completed: ["ready_for_pickup", "delivered"],
  ready_for_pickup: ["delivered"],
  delivered: [],
  reserved: ["installed"],
  installed: [],
}

function isTransitionAllowed(from: string, to: string): boolean {
  return APPLIANCE_TRANSITIONS[from]?.includes(to) ?? false
}

// --- Columns config ---
const REPAIR_COLUMNS: KanbanColumn[] = [
  { id: "received", label: "Received", icon: <Package className="h-4 w-4" /> },
  { id: "diagnosed", label: "Diagnosed", icon: <Search className="h-4 w-4" /> },
  {
    id: "in_repair",
    label: "In Repair",
    icon: <Wrench className="h-4 w-4" />,
  },
  {
    id: "completed",
    label: "Completed",
    icon: <CheckCircle className="h-4 w-4" />,
  },
  {
    id: "ready_for_pickup",
    label: "Ready for Pickup",
    icon: <Clock className="h-4 w-4" />,
  },
  {
    id: "delivered",
    label: "Delivered",
    icon: <Truck className="h-4 w-4" />,
  },
]

const INSTALLATION_COLUMNS: KanbanColumn[] = [
  { id: "reserved", label: "Reserved", icon: <Package className="h-4 w-4" /> },
  {
    id: "installed",
    label: "Installed",
    icon: <CheckCircle className="h-4 w-4" />,
  },
]

const statusColors: Record<string, string> = {
  received: "text-slate-500",
  diagnosed: "text-blue-500",
  in_repair: "text-amber-500",
  completed: "text-emerald-500",
  ready_for_pickup: "text-violet-500",
  delivered: "text-green-500",
  reserved: "text-orange-500",
  installed: "text-emerald-500",
}

// --- Droppable Column ---
function DroppableColumn({
  column,
  appliances,
  isOver,
  isDragging,
  isValidTarget,
}: {
  column: KanbanColumn
  appliances: ServiceAppliance[]
  isOver: boolean
  isDragging: boolean
  isValidTarget: boolean
}) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  })

  const showDropIndicator = isDragging && isValidTarget

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-lg border bg-muted/30 p-2 min-h-[120px] transition-all duration-200 ${
        isOver && isValidTarget
          ? "ring-2 ring-primary/50 bg-primary/5"
          : showDropIndicator
            ? "ring-1 ring-primary/20 bg-primary/2"
            : ""
      }`}
    >
      {/* Column header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-1.5">
          <span className={statusColors[column.id] || "text-muted-foreground"}>
            {column.icon}
          </span>
          <span className="text-xs font-medium">{column.label}</span>
        </div>
        <Badge
          variant="secondary"
          className="text-[10px] px-1.5 py-0"
        >
          {appliances.length}
        </Badge>
      </div>

      {/* Drop zone indicator */}
      {showDropIndicator && appliances.length === 0 && (
        <div className="flex-1 flex items-center justify-center border border-dashed border-primary/30 rounded-md py-3">
          <span className="text-xs text-primary/60">Drop here</span>
        </div>
      )}

      {/* Cards */}
      <SortableContext
        items={appliances.map((a) => `appliance-${a.id}`)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-1.5">
          {appliances.map((appliance) => (
            <ApplianceCard
              key={appliance.id}
              appliance={appliance}
            />
          ))}
        </div>
      </SortableContext>

      {/* Drop indicator at bottom when items exist */}
      {showDropIndicator && appliances.length > 0 && (
        <div className="mt-1.5 flex items-center justify-center border border-dashed border-primary/30 rounded-md py-1.5">
          <span className="text-[10px] text-primary/60">Drop here</span>
        </div>
      )}
    </div>
  )
}

// --- Appliance Card ---
function ApplianceCard({ appliance }: { appliance: ServiceAppliance }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `appliance-${appliance.id}` })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const laborFee = parseFloat(
    appliance.discounted_labor_fee || appliance.labor_fee || "0",
  )
  const partsCost = parseFloat(appliance.total_parts_cost || "0")

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      layout
      className={`rounded-md border bg-background p-2 cursor-grab active:cursor-grabbing transition-shadow ${
        isDragging ? "opacity-40 shadow-lg" : "shadow-sm hover:shadow"
      }`}
    >
      {/* Appliance type + model */}
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium truncate">
            {appliance.brand} {appliance.model || "N/A"}
          </p>
          {appliance.serial_number && (
            <p className="text-[10px] text-muted-foreground font-mono truncate">
              {appliance.serial_number}
            </p>
          )}
        </div>
        {appliance.appliance_type && (
          <Badge
            variant="outline"
            className="text-[9px] px-1 py-0 shrink-0"
          >
            {typeof appliance.appliance_type === "object"
              ? appliance.appliance_type.name
              : appliance.appliance_type}
          </Badge>
        )}
      </div>

      {/* Fees */}
      {(laborFee > 0 || partsCost > 0) && (
        <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
          {laborFee > 0 && <span>Labor: {formatCurrency(laborFee)}</span>}
          {partsCost > 0 && <span>Parts: {formatCurrency(partsCost)}</span>}
        </div>
      )}

      {appliance.labor_is_free && (
        <Badge
          variant="success"
          className="text-[9px] px-1 py-0 mt-1"
        >
          Free Labor
        </Badge>
      )}

      {/* Technicians */}
      {(appliance.technician_assignments?.length ?? 0) > 0 ? (
        <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground flex-wrap">
          <User className="h-2.5 w-2.5 shrink-0" />
          {appliance
            .technician_assignments!.map(
              (ta) => ta.technician_name || `Tech #${ta.technician}`,
            )
            .join(", ")}
        </div>
      ) : appliance.assigned_technician_name ? (
        <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
          <User className="h-2.5 w-2.5" />
          {appliance.assigned_technician_name}
        </div>
      ) : null}
    </motion.div>
  )
}

// --- Drag Overlay Card ---
function DragOverlayCard({ appliance }: { appliance: ServiceAppliance }) {
  return (
    <div className="rounded-md border bg-background p-2 shadow-xl w-56 opacity-95">
      <p className="text-xs font-medium truncate">
        {appliance.brand} {appliance.model || "N/A"}
      </p>
      {appliance.serial_number && (
        <p className="text-[10px] text-muted-foreground font-mono truncate">
          {appliance.serial_number}
        </p>
      )}
    </div>
  )
}

// --- Main Component ---
export default function ApplianceKanbanBoard({
  appliances,
  onStatusChange,
}: ApplianceKanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overColumnId, setOverColumnId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
  )

  // Determine if this is an installation service based on appliance statuses
  const hasInstallationStatuses = appliances.some(
    (a) =>
      (a.status as string) === "reserved" ||
      (a.status as string) === "installed",
  )
  const columns = hasInstallationStatuses
    ? INSTALLATION_COLUMNS
    : REPAIR_COLUMNS

  // Only show columns that have appliances or are transition targets
  const activeStatuses = new Set(appliances.map((a) => a.status as string))
  const transitionTargets = new Set<string>()
  appliances.forEach((a) => {
    const targets = APPLIANCE_TRANSITIONS[a.status] || []
    targets.forEach((t) => transitionTargets.add(t))
  })

  const visibleColumns = columns.filter(
    (c) => activeStatuses.has(c.id) || transitionTargets.has(c.id),
  )

  const groupedAppliances = useMemo(() => {
    const grouped: Record<string, ServiceAppliance[]> = {}
    for (const col of columns) {
      grouped[col.id] = []
    }
    for (const a of appliances) {
      if (grouped[a.status]) {
        grouped[a.status].push(a)
      }
    }
    return grouped
  }, [appliances, columns])

  const activeAppliance = useMemo(() => {
    if (!activeId) return null
    const id = parseInt(activeId.replace("appliance-", ""))
    return appliances.find((a) => a.id === id) || null
  }, [activeId, appliances])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event
    setOverColumnId(over ? (over.id as string) : null)
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null)
      setOverColumnId(null)

      const { active, over } = event
      if (!over || !active) return

      const applianceId = parseInt(
        (active.id as string).replace("appliance-", ""),
      )
      const applianceData = appliances.find((a) => a.id === applianceId)
      if (!applianceData) return

      const targetColumnId = over.id as string

      if (!visibleColumns.some((c) => c.id === targetColumnId)) return
      if (applianceData.status === targetColumnId) return
      if (!isTransitionAllowed(applianceData.status, targetColumnId)) return

      onStatusChange?.(applianceData, targetColumnId)
    },
    [appliances, onStatusChange, visibleColumns],
  )

  const handleDragCancel = useCallback(() => {
    setActiveId(null)
    setOverColumnId(null)
  }, [])

  const validTargets = useMemo(() => {
    if (!activeAppliance) return new Set<string>()
    return new Set(APPLIANCE_TRANSITIONS[activeAppliance.status] || [])
  }, [activeAppliance])

  if (appliances.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
        <div className="flex items-center justify-center size-14 rounded-xl bg-muted/60 text-muted-foreground">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-7"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect
              width="18"
              height="18"
              x="3"
              y="3"
              rx="2"
            />
            <path d="M3 9h18" />
            <path d="M9 21V9" />
          </svg>
        </div>
        <div className="space-y-1">
          <p className="text-base font-medium text-foreground">
            No appliances to display
          </p>
          <p className="text-sm text-muted-foreground">
            Add appliances to this service to see them here
          </p>
        </div>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {activeAppliance && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mb-2 flex items-center justify-center gap-2 text-xs text-muted-foreground"
        >
          <AlertCircle className="h-3.5 w-3.5" />
          Drop to change status. Allowed:{" "}
          {(APPLIANCE_TRANSITIONS[activeAppliance.status] || [])
            .map((s) => applianceStatusLabels[s] || s)
            .join(", ") || "None"}
        </motion.div>
      )}

      <div
        className="flex gap-3 overflow-x-auto pb-2 md:grid md:overflow-visible"
        style={{
          gridTemplateColumns: `repeat(${Math.min(visibleColumns.length, 6)}, minmax(0, 1fr))`,
        }}
      >
        {visibleColumns.map((column) => (
          <div
            key={column.id}
            className="min-w-[220px] md:min-w-0"
          >
            <DroppableColumn
              column={column}
              appliances={groupedAppliances[column.id] || []}
              isOver={overColumnId === column.id}
              isDragging={!!activeId}
              isValidTarget={validTargets.has(column.id)}
            />
          </div>
        ))}
      </div>

      <DragOverlay>
        {activeAppliance ? (
          <DragOverlayCard appliance={activeAppliance} />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
