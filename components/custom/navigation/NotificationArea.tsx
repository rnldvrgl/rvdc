'use client'

import { DataTableActions } from '@/components/custom/table/components/DataTableActions'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useNotificationMutations } from '@/lib/mutations/useNotificationMutations'
import {
  useNotifications,
  useUnreadNotificationCount,
} from '@/lib/queries/useNotifications'
import clsx from 'clsx'
import { AlertTriangle, Bell, Calendar, Receipt } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useInView } from 'react-intersection-observer'

const typeToIcon = {
  expense_created: Receipt,
  appointment_reminder: Calendar,
  stock_low: AlertTriangle,
}

const NotificationArea = ({ align }: { align: 'start' | 'end' | 'center' }) => {
  const [open, setOpen] = useState(false)
  const {
    items: notifications,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useNotifications()

  const { data: unreadCountData } = useUnreadNotificationCount()
  const { deleteNotification, markAllAsRead, markAsRead } =
    useNotificationMutations()

  // useInView to trigger fetching more
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
  })

  // auto-fetch when loadMoreRef is in view
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
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
        className="w-96 max-h-96 overflow-y-auto"
        align={align}
      >
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-sm font-semibold">Notifications</span>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => {
              markAllAsRead.mutate(undefined, {
                onSuccess: () => setOpen(false),
              })
            }}
          >
            Mark all as read
          </Button>
        </div>
        <DropdownMenuSeparator />

        {notifications.length > 0 ? (
          <>
            {notifications.map((n) => {
              const Icon =
                (typeToIcon as Record<string, typeof Bell>)[n.type] ?? Bell

              return (
                <div
                  key={n.id ?? `${n.summary}-${n.created_at}`}
                  className={clsx(
                    'flex items-center space-x-2 px-2 py-2 relative',
                    !n.is_read && 'bg-muted/50',
                  )}
                >
                  <Icon className="size-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <div className="flex flex-col flex-grow">
                    <p className="text-sm font-medium">{n.summary}</p>
                    <p className="text-xs text-muted-foreground">
                      {n.relative_time}
                    </p>
                  </div>
                  {!n.is_read && (
                    <span className="ml-auto mr-1 inline-block size-2 rounded-full bg-destructive" />
                  )}
                  <DataTableActions
                    items={[
                      {
                        label: 'Mark as read',
                        onClick: () => markAsRead.mutate(n.id),
                      },
                      {
                        label: 'Delete',
                        destructive: true,
                        onClick: () => deleteNotification.mutate(n.id),
                        confirmText: 'Delete notification?',
                        confirmDescription: 'This cannot be undone.',
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
                {isFetchingNextPage ? 'Loading more...' : 'Load more...'}
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
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default NotificationArea
