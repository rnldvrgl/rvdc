import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Notification } from '@/lib/constants/interface'
import {
  useNotifications,
  useUnreadNotificationCount,
} from '@/lib/queries/useNotifications'
import { mergeResults } from '@/lib/utils/helpers'
import { Bell } from 'lucide-react'
import { useEffect, useRef } from 'react'

const NotificationArea = ({ align }: { align: 'start' | 'end' | 'center' }) => {
  const { data, fetchNextPage, isFetchingNextPage, hasNextPage } =
    useNotifications()
  const notifications = mergeResults<Notification>(data)
  const { data: unreadCountData } = useUnreadNotificationCount()

  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  // Intersection Observer to auto-fetch more when bottom becomes visible
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage()
        }
      },
      { root: null, rootMargin: '0px', threshold: 1.0 },
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => {
      if (loadMoreRef.current) observer.unobserve(loadMoreRef.current)
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="relative"
        >
          <Bell className="size-5 text-foreground" />
          {unreadCountData && unreadCountData.unread_count > 0 && (
            <span className="absolute top-0 right-0 inline-flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
              {unreadCountData.unread_count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-80 max-h-96 overflow-y-auto"
        align={align}
      >
        {notifications.length > 0 ? (
          <>
            {notifications.map((n) => (
              <DropdownMenuItem
                key={n.id}
                className={`flex flex-col items-start space-y-0 ${
                  !n.is_read ? 'bg-muted/50' : ''
                }`}
              >
                <p className="text-sm font-medium">{n.summary}</p>
                <p className="text-xs text-muted-foreground">
                  {n.relative_time}
                </p>
              </DropdownMenuItem>
            ))}

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
