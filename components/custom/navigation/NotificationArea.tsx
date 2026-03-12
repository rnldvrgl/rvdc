"use client"

import clsx from "clsx"
import {
  AlertTriangle,
  Bell,
  BellOff,
  Calendar,
  Check,
  Package,
  Receipt,
  Truck,
  X,
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

const typeToIcon: Record<string, typeof Bell> = {
  expense_created: Receipt,
  appointment_reminder: Calendar,
  stock_low: AlertTriangle,
  stock_out: AlertTriangle,
  stock_reorder: Package,
  stock_restocked: Package,
  transfer_created: Truck,
  service_created: Calendar,
  service_updated: Calendar,
  service_completed: Check,
  service_cancelled: AlertTriangle,
  service_assigned: Calendar,
  payment_received: Receipt,
  payment_overdue: AlertTriangle,
  warranty_claim_created: AlertTriangle,
  warranty_claim_approved: Check,
  warranty_expiring: AlertTriangle,
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
      case "stock_reorder":
      case "stock_restocked": {
        router.push("/inventory/stocks/stockroom")
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
          <Button
            size="icon"
            variant="ghost"
            className="relative"
          >
            <Bell className="size-4 text-foreground" />
            {unreadCountData && unreadCountData?.unread_count > 0 && (
              <span className="absolute top-0 right-0 inline-flex size-4 items-center justify-center rounded-full bg-destructive text-white text-[10px]">
                {unreadCountData.unread_count}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-[420px] p-0"
          align={align}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="font-semibold text-base">Notifications</h3>
            {hasUnread && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs font-medium hover:bg-accent"
                onClick={(e) => {
                  e.stopPropagation()
                  markAllAsRead.mutate(undefined)
                }}
              >
                <Check className="size-3.5 mr-1.5" />
                Mark all read
              </Button>
            )}
          </div>

          <div className="max-h-[520px] overflow-y-auto">
            {grouped.length > 0 ? (
              <>
                {grouped.map((group) => (
                  <div key={group.label}>
                    <div className="sticky top-0 z-10 bg-popover/95 backdrop-blur-sm px-4 py-2 border-b">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {group.label}
                      </span>
                    </div>
                    <div className="divide-y">
                      {group.items.map((n) => {
                        const Icon = typeToIcon[n.type] ?? Bell
                        return (
                          <div
                            key={n.id ?? `${n.type}-${n.created_at}`}
                            className={clsx(
                              "group relative flex items-start gap-3 px-4 py-3 transition-colors hover:bg-accent/50",
                              !n.is_read && "bg-accent/20",
                            )}
                          >
                            <div
                              className="flex-1 flex items-start gap-3 cursor-pointer"
                              onClick={() => {
                                handleNotificationClick(n)
                                if (!n.is_read) {
                                  markAsRead.mutate(n.id)
                                }
                              }}
                            >
                              <div
                                className={clsx(
                                  "shrink-0 mt-0.5 p-2 rounded-lg",
                                  n.type === "stock_low" &&
                                    "bg-yellow-100 dark:bg-yellow-950",
                                  n.type === "stock_out" &&
                                    "bg-red-100 dark:bg-red-950",
                                  n.type === "expense_created" &&
                                    "bg-blue-100 dark:bg-blue-950",
                                  n.type === "appointment_reminder" &&
                                    "bg-green-100 dark:bg-green-950",
                                  n.type === "stock_restocked" &&
                                    "bg-purple-100 dark:bg-purple-950",
                                  n.type === "transfer_created" &&
                                    "bg-orange-100 dark:bg-orange-950",
                                  n.type === "payment_received" &&
                                    "bg-emerald-100 dark:bg-emerald-950",
                                  n.type === "payment_overdue" &&
                                    "bg-red-100 dark:bg-red-950",
                                  (n.type === "service_created" ||
                                    n.type === "service_updated" ||
                                    n.type === "service_assigned") &&
                                    "bg-indigo-100 dark:bg-indigo-950",
                                  n.type === "service_completed" &&
                                    "bg-green-100 dark:bg-green-950",
                                  n.type === "service_cancelled" &&
                                    "bg-gray-100 dark:bg-gray-950",
                                  !n.type && "bg-muted",
                                )}
                              >
                                <Icon
                                  className={clsx(
                                    "size-4",
                                    n.type === "stock_low" &&
                                      "text-yellow-700 dark:text-yellow-400",
                                    n.type === "stock_out" &&
                                      "text-red-700 dark:text-red-400",
                                    n.type === "expense_created" &&
                                      "text-blue-700 dark:text-blue-400",
                                    n.type === "appointment_reminder" &&
                                      "text-green-700 dark:text-green-400",
                                    n.type === "stock_restocked" &&
                                      "text-purple-700 dark:text-purple-400",
                                    n.type === "transfer_created" &&
                                      "text-orange-700 dark:text-orange-400",
                                    n.type === "payment_received" &&
                                      "text-emerald-700 dark:text-emerald-400",
                                    n.type === "payment_overdue" &&
                                      "text-red-700 dark:text-red-400",
                                    (n.type === "service_created" ||
                                      n.type === "service_updated" ||
                                      n.type === "service_assigned") &&
                                      "text-indigo-700 dark:text-indigo-400",
                                    n.type === "service_completed" &&
                                      "text-green-700 dark:text-green-400",
                                    n.type === "service_cancelled" &&
                                      "text-gray-700 dark:text-gray-400",
                                    !n.type && "text-muted-foreground",
                                  )}
                                />
                              </div>
                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm font-medium leading-tight">
                                    {n.title || n.message}
                                  </p>
                                  {!n.is_read && (
                                    <span className="shrink-0 mt-1 size-2 rounded-full bg-blue-600 dark:bg-blue-500" />
                                  )}
                                </div>
                                {n.title &&
                                  n.message &&
                                  n.message !== n.title && (
                                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                      {n.message}
                                    </p>
                                  )}
                                <p className="text-xs text-muted-foreground font-medium">
                                  {n.relative_time}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!n.is_read && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 shrink-0"
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
                                className="h-7 w-7 shrink-0 hover:bg-destructive/10 hover:text-destructive"
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
                  </div>
                ))}
                {hasNextPage && (
                  <div
                    ref={loadMoreRef}
                    className="flex justify-center py-4 border-t"
                  >
                    <span className="text-xs text-muted-foreground font-medium">
                      {isFetchingNextPage
                        ? "Loading more..."
                        : "Scroll for more"}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <BellOff className="size-8 text-muted-foreground" />
                </div>
                <h4 className="font-semibold text-sm mb-1">
                  No notifications yet
                </h4>
                <p className="text-xs text-muted-foreground max-w-[280px]">
                  When you receive notifications, they&apos;ll appear here
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
