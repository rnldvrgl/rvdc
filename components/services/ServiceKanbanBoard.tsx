"use client"

import {
  applianceStatusLabels,
  serviceModeLabels,
  serviceStatusLabels,
  serviceTypeColors,
  serviceTypeLabels,
  statusConfig,
} from "@/app/(routes)/services/columns"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Service, ServiceStatus } from "@/lib/constants/interface"
import { formatCurrency, getBadgeVariant, safeCell } from "@/lib/utils/helpers"

import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
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
import { formatDistanceToNow } from "date-fns"
import { AnimatePresence, motion } from "framer-motion"
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Clock,
  Eye,
  Loader2,
  Shield,
  Sparkles,
  User,
  Wrench,
  XCircle,
} from "lucide-react"
import { useCallback, useMemo, useState } from "react"

// --- Types ---

interface ServiceKanbanBoardProps {
  services: Service[]
  onView?: (service: Service) => void
  onStatusChange?: (service: Service, newStatus: string) => void
  isUpdating?: boolean
}

type KanbanColumn = {
  id: ServiceStatus
  label: string
  icon: React.ReactNode
}

// --- Allowed transitions ---
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
}

function isTransitionAllowed(from: string, to: string): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false
}

// --- Kanban columns config ---
const COLUMNS: KanbanColumn[] = [
  { id: "pending", label: "Pending", icon: <Clock className="h-4 w-4" /> },
  {
    id: "in_progress",
    label: "In Progress",
    icon: <Loader2 className="h-4 w-4" />,
  },
  {
    id: "completed",
    label: "Completed",
    icon: <CheckCircle className="h-4 w-4" />,
  },
  {
    id: "cancelled",
    label: "Cancelled",
    icon: <XCircle className="h-4 w-4" />,
  },
]

// --- Droppable Column ---

function DroppableColumn({
  column,
  services,
  isOver,
  canDrop,
  onView,
  activeId,
  isDragging,
  isValidTarget,
}: {
  column: KanbanColumn
  services: Service[]
  isOver: boolean
  canDrop: boolean
  onView?: (service: Service) => void
  activeId: number | null
  isDragging: boolean
  isValidTarget: boolean
}) {
  const { setNodeRef } = useDroppable({ id: column.id })
  const config = statusConfig[column.id]

  return (
    <div
      ref={setNodeRef}
      className={`
        flex flex-col rounded-xl border transition-all duration-200
        ${config.borderColor} ${config.bgColor}
        ${isOver && canDrop ? "ring-2 ring-primary/40 scale-[1.01]" : ""}
        ${isOver && !canDrop ? "ring-2 ring-destructive/40 opacity-70" : ""}
        min-h-[400px] max-h-[calc(100vh-280px)]
      `}
    >
      {/* Column header */}
      <div
        className={`flex items-center justify-between px-4 py-3 border-b rounded-t-xl ${config.borderColor}`}
      >
        <div className="flex items-center gap-2">
          <span className={config.color}>{column.icon}</span>
          <h3 className={`font-semibold text-sm ${config.color}`}>
            {column.label}
          </h3>
        </div>
        <Badge
          variant="outline"
          className={`text-xs ${config.color}`}
        >
          {services.length}
        </Badge>
      </div>

      {/* Drop indicator when dragging */}
      {isDragging && isValidTarget && (
        <div
          className={`mx-2 mt-2 rounded-lg border-2 border-dashed ${config.borderColor} py-2 text-center text-xs ${config.color} ${isOver ? "opacity-100 bg-background/50" : "opacity-60"}`}
        >
          Drop here
        </div>
      )}

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        <SortableContext
          items={services.map((s) => `service-${s.id}`)}
          strategy={verticalListSortingStrategy}
        >
          <AnimatePresence mode="popLayout">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onView={onView}
                isDragging={activeId === service.id}
              />
            ))}
          </AnimatePresence>
        </SortableContext>

        {services.length === 0 && !isDragging && (
          <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
            No services
          </div>
        )}
      </div>
    </div>
  )
}

// --- Service Card (fully draggable) ---

function ServiceCard({
  service,
  onView,
  isDragging,
  isOverlay,
}: {
  service: Service
  onView?: (service: Service) => void
  isDragging?: boolean
  isOverlay?: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: `service-${service.id}`,
    data: { service },
    disabled: service.status === "completed" || service.status === "cancelled",
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isTerminal =
    service.status === "completed" || service.status === "cancelled"

  const hasWarranty = service.appliances?.some(
    (a) => a.is_labor_warranty_active || a.is_unit_warranty_active,
  )
  const hasFreeCleaning = service.installation_units?.some(
    (u) =>
      u.free_cleaning_redeemed === false &&
      u.free_cleaning_status === "available",
  )
  const applianceCount = service.appliances?.length || 0

  // Appliance status summary
  const applianceStatuses = useMemo(() => {
    if (!service.appliances?.length) return null
    const counts: Record<string, number> = {}
    service.appliances.forEach((a) => {
      counts[a.status] = (counts[a.status] || 0) + 1
    })
    return counts
  }, [service.appliances])

  const cardContent = (
    <div
      className={`
        group rounded-lg border bg-card text-card-foreground
        transition-all duration-200
        ${isSortableDragging || isDragging ? "opacity-30 scale-95" : ""}
        ${isOverlay ? "shadow-2xl ring-2 ring-primary/50 scale-105" : ""}
        ${!isTerminal ? "hover:shadow-md hover:border-primary/30 cursor-grab active:cursor-grabbing" : "opacity-80 cursor-default"}
      `}
    >
      <div className="px-2.5 py-2.5 space-y-2">
        {/* Row 1: ID + client + view button */}
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                #{String(service.id).padStart(4, "0")}
              </span>
              {hasWarranty && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Shield className="h-3 w-3 text-blue-500 shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent>Active warranty</TooltipContent>
                </Tooltip>
              )}
              {hasFreeCleaning && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Sparkles className="h-3 w-3 text-emerald-500 shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent>Free cleaning available</TooltipContent>
                </Tooltip>
              )}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <User className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="font-medium text-sm truncate">
                {service.client?.full_name || "Unknown"}
              </span>
            </div>
          </div>
          <button
            aria-label="View service details"
            onClick={(e) => {
              e.stopPropagation()
              onView?.(service)
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-muted shrink-0"
          >
            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>

        {/* Row 2: Service type/mode badges */}
        <div className="flex items-center gap-1 flex-wrap">
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 h-4 ${serviceTypeColors[service.service_type] || ""}`}
          >
            {serviceTypeLabels[service.service_type] ||
              safeCell(service.service_type)}
          </Badge>
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0 h-4"
          >
            {serviceModeLabels[service.service_mode] ||
              safeCell(service.service_mode)}
          </Badge>
        </div>

        {/* Row 3: Appliance summary (if any) */}
        {applianceCount > 0 && applianceStatuses && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Wrench className="h-2.5 w-2.5 shrink-0" />
            <span>
              {applianceCount} unit{applianceCount > 1 ? "s" : ""}
            </span>
            <span className="mx-0.5">·</span>
            <div className="flex gap-1 flex-wrap">
              {Object.entries(applianceStatuses).map(([status, count]) => (
                <span
                  key={status}
                  className="inline-flex items-center gap-0.5"
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      status === "completed"
                        ? "bg-emerald-500"
                        : status === "in_repair"
                          ? "bg-blue-500"
                          : status === "diagnosed"
                            ? "bg-violet-500"
                            : "bg-gray-400"
                    }`}
                  />
                  {count} {applianceStatusLabels[status] || status}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Row 4: Revenue + payment + time */}
        <div className="flex items-center justify-between pt-1 border-t border-border/50">
          <div className="flex items-center gap-2">
            <span className="font-semibold tabular-nums text-xs">
              {service.total_revenue
                ? formatCurrency(Number(service.total_revenue))
                : "₱0"}
            </span>
            <Badge
              variant={getBadgeVariant(service.payment_status)}
              className="text-[9px] px-1 py-0 h-3.5"
            >
              {safeCell(service.payment_status)}
            </Badge>
          </div>
          <span className="text-[10px] text-muted-foreground">
            {service.created_at
              ? formatDistanceToNow(new Date(service.created_at), {
                  addSuffix: true,
                })
              : "—"}
          </span>
        </div>

        {/* Progress bar (non-terminal only) */}
        {!isTerminal && <StatusProgressBar status={service.status} />}
      </div>
    </div>
  )

  if (isOverlay) return cardContent

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      onClick={() => onView?.(service)}
      {...(!isTerminal ? { ...attributes, ...listeners } : {})}
    >
      {cardContent}
    </motion.div>
  )
}

// --- Status Progress Bar ---

function StatusProgressBar({ status }: { status: string }) {
  const steps = ["pending", "in_progress", "completed"]
  const currentIndex = steps.indexOf(status)

  return (
    <div className="flex items-center gap-0.5">
      {steps.map((step, i) => {
        const stepConfig = statusConfig[step]
        const isActive = i <= currentIndex
        const isCurrent = i === currentIndex

        return (
          <div
            key={step}
            className="flex items-center gap-0.5 flex-1"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={`
                    h-1 flex-1 rounded-full transition-all duration-300
                    ${isActive ? stepConfig.dotColor : "bg-muted"}
                    ${isCurrent ? "h-1.5" : ""}
                  `}
                />
              </TooltipTrigger>
              <TooltipContent className="text-xs">
                {serviceStatusLabels[step]}
              </TooltipContent>
            </Tooltip>
            {i < steps.length - 1 && (
              <ArrowRight
                className={`h-2 w-2 shrink-0 ${
                  isActive ? "text-foreground/50" : "text-muted"
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// --- Drag Overlay Card ---

function DragOverlayCard({ service }: { service: Service }) {
  return (
    <ServiceCard
      service={service}
      isOverlay
    />
  )
}

// --- Main Kanban Board ---

export default function ServiceKanbanBoard({
  services,
  onView,
  onStatusChange,
}: ServiceKanbanBoardProps) {
  const [activeId, setActiveId] = useState<number | null>(null)
  const [overColumnId, setOverColumnId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  )

  const groupedServices = useMemo(() => {
    const groups: Record<string, Service[]> = {
      pending: [],
      in_progress: [],
      completed: [],
      cancelled: [],
    }
    services.forEach((s) => {
      if (groups[s.status]) {
        groups[s.status].push(s)
      }
    })
    return groups
  }, [services])

  const activeService = useMemo(
    () => services.find((s) => s.id === activeId) ?? null,
    [services, activeId],
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const serviceData = event.active.data.current?.service as
      | Service
      | undefined
    if (serviceData) {
      setActiveId(serviceData.id)
    }
  }, [])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const overId = event.over?.id as string | null
    if (overId && COLUMNS.some((c) => c.id === overId)) {
      setOverColumnId(overId)
    } else {
      setOverColumnId(null)
    }
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      setActiveId(null)
      setOverColumnId(null)

      if (!over) return

      const serviceData = active.data.current?.service as Service | undefined
      if (!serviceData) return

      const targetColumnId = over.id as string

      if (!COLUMNS.some((c) => c.id === targetColumnId)) return
      if (serviceData.status === targetColumnId) return
      if (!isTransitionAllowed(serviceData.status, targetColumnId)) return

      onStatusChange?.(serviceData, targetColumnId)
    },
    [onStatusChange],
  )

  const handleDragCancel = useCallback(() => {
    setActiveId(null)
    setOverColumnId(null)
  }, [])

  const canDropOnHovered = useMemo(() => {
    if (!activeService || !overColumnId) return false
    return isTransitionAllowed(activeService.status, overColumnId)
  }, [activeService, overColumnId])

  // Compute which columns are valid drop targets for the active service
  const validTargets = useMemo(() => {
    if (!activeService) return new Set<string>()
    return new Set(ALLOWED_TRANSITIONS[activeService.status] || [])
  }, [activeService])

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {activeService && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mb-3 flex items-center justify-center gap-2 text-sm text-muted-foreground"
        >
          <AlertCircle className="h-4 w-4" />
          Drop on a column to change status. Allowed:{" "}
          {ALLOWED_TRANSITIONS[activeService.status]
            .map((s) => serviceStatusLabels[s])
            .join(", ") || "None"}
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map((column) => (
          <DroppableColumn
            key={column.id}
            column={column}
            services={groupedServices[column.id] || []}
            isOver={overColumnId === column.id}
            canDrop={canDropOnHovered && overColumnId === column.id}
            onView={onView}
            activeId={activeId}
            isDragging={!!activeService}
            isValidTarget={validTargets.has(column.id)}
          />
        ))}
      </div>

      <DragOverlay>
        {activeService ? <DragOverlayCard service={activeService} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
