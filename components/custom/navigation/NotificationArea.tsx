"use client"

import clsx from "clsx"
import {
  AlertTriangle,
  Bell,
  BellOff,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  DollarSign,
  Package,
  Receipt,
  ShieldCheck,
  Truck,
  UserCheck,
  X,
  XCircle,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { useInView } from "react-intersection-observer"

import NotificationSheet from "@/components/custom/shared/NotificationSheet"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Notification } from "@/lib/constants/interface"
import { useNotificationMutations } from "@/lib/mutations/useNotificationMutations"
import {
  useNotifications,
  useUnreadNotificationCount,
} from "@/lib/queries/useNotifications"

/* ─── Type → visual config ─── */
type NotifStyle = {
  icon: typeof Bell
  bg: string
  text: string
}

const typeStyles: Record<string, NotifStyle> = {
  // Inventory
  stock_low: {
    icon: AlertTriangle,
    bg: "bg-amber-100 dark:bg-amber-900/40",
    text: "text-amber-600 dark:text-amber-400",
  },
  stock_out: {
    icon: AlertTriangle,
    bg: "bg-red-100 dark:bg-red-900/40",
    text: "text-red-600 dark:text-red-400",
  },
  stock_reorder: {
    icon: Package,
    bg: "bg-amber-100 dark:bg-amber-900/40",
    text: "text-amber-600 dark:text-amber-400",
  },
  stock_restocked: {
    icon: Package,
    bg: "bg-purple-100 dark:bg-purple-900/40",
    text: "text-purple-600 dark:text-purple-400",
  },
  stock_request_created: {
    icon: Package,
    bg: "bg-purple-100 dark:bg-purple-900/40",
    text: "text-purple-600 dark:text-purple-400",
  },
  stock_request_approved: {
    icon: CheckCircle2,
    bg: "bg-green-100 dark:bg-green-900/40",
    text: "text-green-600 dark:text-green-400",
  },
  stock_request_declined: {
    icon: XCircle,
    bg: "bg-red-100 dark:bg-red-900/40",
    text: "text-red-600 dark:text-red-400",
  },
  stock_added_by_admin: {
    icon: CheckCircle2,
    bg: "bg-blue-100 dark:bg-blue-900/40",
    text: "text-blue-600 dark:text-blue-400",
  },
  transfer_created: {
    icon: Truck,
    bg: "bg-orange-100 dark:bg-orange-900/40",
    text: "text-orange-600 dark:text-orange-400",
  },
  // Expense
  expense_created: {
    icon: Receipt,
    bg: "bg-blue-100 dark:bg-blue-900/40",
    text: "text-blue-600 dark:text-blue-400",
  },
  // Service
  service_created: {
    icon: Calendar,
    bg: "bg-indigo-100 dark:bg-indigo-900/40",
    text: "text-indigo-600 dark:text-indigo-400",
  },
  service_updated: {
    icon: Calendar,
    bg: "bg-indigo-100 dark:bg-indigo-900/40",
    text: "text-indigo-600 dark:text-indigo-400",
  },
  service_completed: {
    icon: CheckCircle2,
    bg: "bg-green-100 dark:bg-green-900/40",
    text: "text-green-600 dark:text-green-400",
  },
  service_cancelled: {
    icon: XCircle,
    bg: "bg-gray-100 dark:bg-gray-800/40",
    text: "text-gray-600 dark:text-gray-400",
  },
  service_assigned: {
    icon: Calendar,
    bg: "bg-indigo-100 dark:bg-indigo-900/40",
    text: "text-indigo-600 dark:text-indigo-400",
  },
  appointment_reminder: {
    icon: Calendar,
    bg: "bg-blue-100 dark:bg-blue-900/40",
    text: "text-blue-600 dark:text-blue-400",
  },
  items_pending_review: {
    icon: Package,
    bg: "bg-amber-100 dark:bg-amber-900/40",
    text: "text-amber-600 dark:text-amber-400",
  },
  // Payment
  payment_received: {
    icon: Receipt,
    bg: "bg-emerald-100 dark:bg-emerald-900/40",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  payment_overdue: {
    icon: AlertTriangle,
    bg: "bg-red-100 dark:bg-red-900/40",
    text: "text-red-600 dark:text-red-400",
  },
  // Warranty
  warranty_claim_created: {
    icon: AlertTriangle,
    bg: "bg-amber-100 dark:bg-amber-900/40",
    text: "text-amber-600 dark:text-amber-400",
  },
  warranty_claim_approved: {
    icon: CheckCircle2,
    bg: "bg-green-100 dark:bg-green-900/40",
    text: "text-green-600 dark:text-green-400",
  },
  warranty_claim_rejected: {
    icon: XCircle,
    bg: "bg-red-100 dark:bg-red-900/40",
    text: "text-red-600 dark:text-red-400",
  },
  warranty_expiring: {
    icon: AlertTriangle,
    bg: "bg-amber-100 dark:bg-amber-900/40",
    text: "text-amber-600 dark:text-amber-400",
  },
  // Attendance / HR — Approved
  attendance_approved: {
    icon: CheckCircle2,
    bg: "bg-green-100 dark:bg-green-900/40",
    text: "text-green-600 dark:text-green-400",
  },
  leave_request_approved: {
    icon: CheckCircle2,
    bg: "bg-green-100 dark:bg-green-900/40",
    text: "text-green-600 dark:text-green-400",
  },
  work_request_approved: {
    icon: UserCheck,
    bg: "bg-green-100 dark:bg-green-900/40",
    text: "text-green-600 dark:text-green-400",
  },
  overtime_approved: {
    icon: Clock,
    bg: "bg-blue-100 dark:bg-blue-900/40",
    text: "text-blue-600 dark:text-blue-400",
  },
  // Attendance / HR — Rejected
  attendance_rejected: {
    icon: XCircle,
    bg: "bg-red-100 dark:bg-red-900/40",
    text: "text-red-600 dark:text-red-400",
  },
  leave_request_rejected: {
    icon: XCircle,
    bg: "bg-red-100 dark:bg-red-900/40",
    text: "text-red-600 dark:text-red-400",
  },
  work_request_declined: {
    icon: XCircle,
    bg: "bg-red-100 dark:bg-red-900/40",
    text: "text-red-600 dark:text-red-400",
  },
  overtime_rejected: {
    icon: XCircle,
    bg: "bg-red-100 dark:bg-red-900/40",
    text: "text-red-600 dark:text-red-400",
  },
  // Payroll
  payroll_available: {
    icon: DollarSign,
    bg: "bg-emerald-100 dark:bg-emerald-900/40",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  // System
  system_alert: {
    icon: Bell,
    bg: "bg-gray-100 dark:bg-gray-800/40",
    text: "text-gray-600 dark:text-gray-400",
  },
  report_ready: {
    icon: ShieldCheck,
    bg: "bg-blue-100 dark:bg-blue-900/40",
    text: "text-blue-600 dark:text-blue-400",
  },
}

const fallbackStyle: NotifStyle = {
  icon: Bell,
  bg: "bg-muted",
  text: "text-muted-foreground",
}

function getStyle(type: string): NotifStyle {
  return typeStyles[type] ?? fallbackStyle
}

/** Group notifications by "Today", "Yesterday", "Older" */
function groupByDate(notifications: Notification[]) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86_400_000)

  const groups: { label: string; items: Notification[] }[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "Older", items: [] },
  ]

  for (const n of notifications) {
    const created = new Date(n.created_at)
    if (created >= today) {
      groups[0].items.push(n)
    } else if (created >= yesterday) {
      groups[1].items.push(n)
    } else {
      groups[2].items.push(n)
    }
  }
  return groups.filter((g) => g.items.length > 0)
}

const NotificationArea = ({ align }: { align: "start" | "end" | "center" }) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [sheet, setSheet] = useState<{
    type: "expense_created" | "transfer_created"
    id: number
  } | null>(null)

  const {
    items: notifications,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useNotifications()
  const { data: unreadCountData } = useUnreadNotificationCount()
  const { deleteNotification, markAllAsRead, markAsRead } =
    useNotificationMutations()
  const { ref: loadMoreRef, inView } = useInView({ threshold: 0 })

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  const hasUnread = useMemo(
    () => notifications.some((n) => !n.is_read),
    [notifications],
  )

  const grouped = useMemo(() => groupByDate(notifications), [notifications])

  const handleNotificationClick = (notif: Notification) => {
    switch (notif.type) {
      case "expense_created": {
        const expenseId = notif.data?.expense_id
        if (typeof expenseId === "number") {
          setSheet({ type: "expense_created", id: expenseId })
        } else {
          router.push("/expenses/manage")
          setOpen(false)
        }
        break
      }

      case "transfer_created": {
        const transferId = notif.data?.transfer_id
        if (typeof transferId === "number") {
          setSheet({ type: "transfer_created", id: transferId })
        } else {
          router.push("/inventory/stocks/stockroom")
          setOpen(false)
        }
        break
      }

      case "appointment_reminder":
      case "service_created":
      case "service_updated":
      case "service_completed":
      case "service_cancelled":
      case "service_assigned": {
        const serviceId = notif.data?.service_id
        if (typeof serviceId === "number") {
          router.push(`/services/${serviceId}`)
        } else {
          router.push("/services")
        }
        setOpen(false)
        break
      }

      case "stock_low":
      case "stock_out":
      case "stock_reorder": {
        router.push("/inventory/stocks/stockroom")
        setOpen(false)
        break
      }

      case "stock_restocked": {
        router.push("/inventory/stock-requests")
        setOpen(false)
        break
      }

      case "stock_request_created":
      case "stock_request_approved":
      case "stock_request_declined": {
        router.push("/inventory/stock-requests")
        setOpen(false)
        break
      }

      case "stock_added_by_admin": {
        router.push("/inventory/stocks/stall")
        setOpen(false)
        break
      }

      case "payment_received":
      case "payment_overdue": {
        const serviceId = notif.data?.service_id
        if (typeof serviceId === "number") {
          router.push(`/services/${serviceId}`)
        } else {
          router.push("/services")
        }
        setOpen(false)
        break
      }

      case "warranty_claim_created":
      case "warranty_claim_approved":
      case "warranty_expiring": {
        router.push("/services")
        setOpen(false)
        break
      }

      case "attendance_approved":
      case "attendance_rejected": {
        router.push("/attendance")
        setOpen(false)
        break
      }

      case "leave_request_approved":
      case "leave_request_rejected": {
        router.push("/attendance/leave-requests")
        setOpen(false)
        break
      }

      case "overtime_approved":
      case "overtime_rejected": {
        router.push("/attendance/overtime")
        setOpen(false)
        break
      }

      case "work_request_approved":
      case "work_request_declined": {
        router.push("/attendance/work-requests")
        setOpen(false)
        break
      }

      case "payroll_available": {
        router.push("/payroll")
        setOpen(false)
        break
      }

      default:
        router.push("/")
        setOpen(false)
    }
  }

  return (
    <>
      <DropdownMenu
        open={open}
        onOpenChange={setOpen}
      >
        <DropdownMenuTrigger asChild>
          <button className="relative flex items-center justify-center size-9 rounded-xl text-primary bg-primary/90 dark:bg-primary/20 hover:bg-primary dark:hover:bg-primary/40 transition-colors cursor-pointer">
            <Bell className="size-4 text-white" />
            {unreadCountData && unreadCountData?.unread_count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 inline-flex size-[18px] items-center justify-center rounded-full bg-destructive text-white text-[10px] font-bold ring-2 ring-background">
                {unreadCountData.unread_count > 99
                  ? "99+"
                  : unreadCountData.unread_count}
              </span>
            )}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-[400px] p-0 rounded-xl shadow-xl border-border/50"
          align={align}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm">Notifications</h3>
              {unreadCountData && unreadCountData.unread_count > 0 && (
                <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
                  {unreadCountData.unread_count}
                </span>
              )}
            </div>
            {hasUnread && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs font-medium text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation()
                  markAllAsRead.mutate(undefined)
                }}
              >
                <Check className="size-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-[480px] overflow-y-auto">
            {grouped.length > 0 ? (
              <>
                {grouped.map((group) => (
                  <div key={group.label}>
                    {/* Group label */}
                    <div className="sticky top-0 z-10 bg-popover/95 backdrop-blur-sm px-4 py-1.5 border-b">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        {group.label}
                      </span>
                    </div>

                    {/* Items */}
                    {group.items.map((n) => {
                      const style = getStyle(n.type)
                      const Icon = style.icon
                      return (
                        <div
                          key={n.id ?? `${n.type}-${n.created_at}`}
                          className={clsx(
                            "group relative flex items-start gap-3 px-4 py-3 transition-all cursor-pointer",
                            "hover:bg-accent/40",
                            !n.is_read
                              ? "bg-primary/3 dark:bg-primary/6"
                              : "opacity-75 hover:opacity-100",
                          )}
                          onClick={() => {
                            handleNotificationClick(n)
                            if (!n.is_read) markAsRead.mutate(n.id)
                          }}
                        >
                          {/* Unread indicator line */}
                          {!n.is_read && (
                            <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-primary" />
                          )}

                          {/* Icon badge */}
                          <div
                            className={clsx(
                              "shrink-0 mt-0.5 flex items-center justify-center size-9 rounded-xl transition-transform group-hover:scale-105",
                              style.bg,
                            )}
                          >
                            <Icon className={clsx("size-4", style.text)} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 space-y-0.5">
                            <div className="flex items-start justify-between gap-2">
                              <p
                                className={clsx(
                                  "text-[13px] leading-snug line-clamp-1",
                                  !n.is_read
                                    ? "font-semibold text-foreground"
                                    : "font-medium text-foreground/80",
                                )}
                              >
                                {n.title || n.message}
                              </p>
                            </div>
                            {n.title && n.message && n.message !== n.title && (
                              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                {n.message}
                              </p>
                            )}
                            <p className="text-[11px] text-muted-foreground/70 font-medium">
                              {n.relative_time}
                              {n.formatted_date && (
                                <span className="text-muted-foreground/50">
                                  {" "}
                                  &middot; {n.formatted_date}
                                </span>
                              )}
                            </p>
                          </div>

                          {/* Actions (hover) */}
                          <div className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!n.is_read && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 rounded-lg"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  markAsRead.mutate(n.id)
                                }}
                                title="Mark as read"
                              >
                                <Check className="size-3.5" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteNotification.mutate(n.id)
                              }}
                              title="Delete"
                            >
                              <X className="size-3.5" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}

                {/* Infinite scroll trigger */}
                {hasNextPage && (
                  <div
                    ref={loadMoreRef}
                    className="flex justify-center py-3 border-t"
                  >
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {isFetchingNextPage
                        ? "Loading more..."
                        : "Scroll for more"}
                    </span>
                  </div>
                )}
              </>
            ) : (
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="rounded-2xl bg-muted/60 p-5 mb-4">
                  <BellOff className="size-7 text-muted-foreground/60" />
                </div>
                <h4 className="font-semibold text-sm mb-1 text-foreground/80">
                  All caught up!
                </h4>
                <p className="text-xs text-muted-foreground max-w-60 leading-relaxed">
                  You have no notifications right now. We&apos;ll let you know
                  when something needs your attention.
                </p>
              </div>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {sheet && (
        <NotificationSheet
          type={sheet.type}
          id={sheet.id}
          onClose={() => setSheet(null)}
        />
      )}
    </>
  )
}

export default NotificationArea
