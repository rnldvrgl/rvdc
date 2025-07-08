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

const NotificatonArea = ({ align }: { align: 'start' | 'end' | 'center' }) => {
  const { data, fetchNextPage, isFetchingNextPage, hasNextPage } =
    useNotifications()

  const notifications = mergeResults<Notification>(data)

  const { data: unread_count } = useUnreadNotificationCount()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="relative"
        >
          <Bell className="size-5 text-foreground" />
          {unread_count && unread_count.unread_count > 0 && (
            <span className="absolute top-0 right-0 inline-flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
              {unread_count.unread_count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-80"
        align={align}
      >
        {notifications.length > 0 ? (
          notifications.map((n: any) => (
            <DropdownMenuItem
              key={n.id}
              className={`flex flex-col items-start space-y-0 ${
                !n.is_read ? 'bg-muted/50' : ''
              }`}
            >
              <p className="text-sm font-medium">{n.summary}</p>
              <p className="text-xs text-muted-foreground">{n.relative_time}</p>
            </DropdownMenuItem>
          ))
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

export default NotificatonArea
