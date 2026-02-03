"use client"

import clsx from "clsx"
import {
  AlertTriangle,
  Bell,
  Calendar,
  Check,
  Package,
  Receipt,
  Trash2,
  Truck,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useInView } from "react-intersection-observer"

import NotificationSheet from "@/components/custom/shared/NotificationSheet"
import { DataTableActions } from "@/components/custom/table/components/DataTableActions"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  restock: Package,
  transfer_created: Truck,
}

const NotificationArea = ({ align }: { align: "start" | "end" | "center" }) => {
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

  const handleNotificationClick = (notif: Notification) => {
    switch (notif.type) {
      case "expense_created": {
        const expenseId = notif.data?.expense_id
        if (typeof expenseId === "number") {
          setSheet({ type: "expense_created", id: expenseId })
        } else {
          console.error("Missing or invalid expense_id", notif)
        }
        break
      }

      case "transfer_created": {
        const transferId = notif.data?.transfer_id
        if (typeof transferId === "number") {
          setSheet({ type: "transfer_created", id: transferId })
        } else {
          console.error("Missing or invalid transfer_id", notif)
        }
        break
      }

      default:
        console.warn("Unhandled notification type:", notif.type)
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
            <Bell className="size-5 text-foreground" />
            {unreadCountData && unreadCountData?.unread_count > 0 && (
              <span className="absolute top-0 right-0 inline-flex size-4 items-center justify-center rounded-full bg-destructive text-white text-[10px]">
                {unreadCountData.unread_count}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-96"
          align={align}
        >
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-sm font-semibold">Notifications</span>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() =>
                markAllAsRead.mutate(undefined, {
                  onSuccess: () => setOpen(false),
                })
              }
              disabled={!hasUnread}
            >
              Mark all as read
            </Button>
          </div>

          <DropdownMenuSeparator />

          <div className="max-h-64 overflow-y-auto flex flex-col gap-1">
            {notifications.length > 0 ? (
              <>
                {notifications.map((n) => {
                  const Icon = typeToIcon[n.type] ?? Bell
                  return (
                    <div
                      key={n.id ?? `${n.summary}-${n.created_at}`}
                      className={clsx(
                        "flex items-center p-3 rounded-lg hover:bg-accent transition relative cursor-pointer",
                        !n.is_read && "bg-muted/50",
                      )}
                      onClick={() => {
                        handleNotificationClick(n)
                        if (!n.is_read) {
                          markAsRead.mutate(n.id)
                        }
                      }}
                    >
                      <div className="shrink-0">
                        <Icon
                          className={clsx(
                            "size-5",
                            n.type === "stock_low" &&
                              "text-yellow-600 dark:text-yellow-400",
                            n.type === "expense_created" &&
                              "text-blue-600 dark:text-blue-400",
                            n.type === "appointment_reminder" &&
                              "text-green-600 dark:text-green-400",
                            n.type === "restock" &&
                              "text-purple-600 dark:text-purple-400",
                            n.type === "transfer_created" &&
                              "text-orange-600 dark:text-orange-400",
                            !n.type && "text-muted-foreground",
                          )}
                        />
                      </div>
                      <div className="ml-3 grow">
                        <p className="text-sm font-semibold">{n.summary}</p>
                        <p className="text-xs text-muted-foreground">
                          {n.relative_time}
                        </p>
                      </div>
                      {!n.is_read && (
                        <span className="absolute top-1/2 right-2 inline-block size-2 rounded-full bg-destructive -translate-y-1/2" />
                      )}
                      <DataTableActions
                        items={[
                          ...(!n.is_read
                            ? [
                                {
                                  label: "Mark as read",
                                  icon: Check,
                                  onClick: () => markAsRead.mutate(n.id),
                                },
                              ]
                            : []),
                          {
                            label: "Delete",
                            icon: Trash2,
                            destructive: true,
                            onClick: () => deleteNotification.mutate(n.id),
                            confirmText: "Delete notification?",
                            confirmDescription: "This cannot be undone.",
                          },
                        ]}
                      />
                    </div>
                  )
                })}
                {hasNextPage && (
                  <div
                    ref={loadMoreRef}
                    className="flex w-full justify-center py-2 text-xs text-muted-foreground"
                  >
                    {isFetchingNextPage ? "Loading more..." : "Load more..."}
                  </div>
                )}
              </>
            ) : (
              <DropdownMenuItem
                disabled
                className="text-muted-foreground"
              >
                No notifications
              </DropdownMenuItem>
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
