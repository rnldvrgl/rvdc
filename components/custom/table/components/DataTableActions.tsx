'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import clsx from 'clsx'
import { MoreVertical } from 'lucide-react'
import { ReactNode, useCallback, useState } from 'react'

interface DataTableActionsProps {
  label?: string
  items: ActionItem[]
}
interface ActionItem {
  label: string
  onClick: () => void
  icon?: ReactNode
  destructive?: boolean
  confirmText?: string
  confirmDescription?: string
  disabled?: boolean
}

export function DataTableActions({
  label = 'Actions',
  items,
}: DataTableActionsProps) {
  const [confirmItem, setConfirmItem] = useState<null | ActionItem>(null)

  const handleConfirm = useCallback(() => {
    if (confirmItem) {
      confirmItem.onClick()
      setConfirmItem(null)
    }
  }, [confirmItem])

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0"
          >
            <span className="sr-only">Open menu</span>
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{label}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {items.length > 0 ? (
            items.map((item, idx) => (
              <DropdownMenuItem
                key={idx}
                disabled={item.disabled} // ← new
                onSelect={(e) => {
                  if (item.disabled) return // prevent click if disabled
                  if (item.destructive) {
                    e.preventDefault()
                    setConfirmItem(item)
                  } else {
                    item.onClick()
                  }
                }}
                className={clsx(
                  'flex items-center group',
                  item.destructive &&
                    'text-destructive/90 hover:bg-destructive/10',
                  item.disabled && 'opacity-50 cursor-not-allowed',
                )}
              >
                {item.icon && (
                  <span
                    className={clsx(
                      'mr-2 transition-colors',
                      item.destructive && 'group-hover:text-destructive',
                    )}
                  >
                    {item.icon}
                  </span>
                )}
                <span
                  className={clsx(
                    'transition-colors',
                    item.destructive && 'group-hover:text-destructive',
                  )}
                >
                  {item.label}
                </span>
              </DropdownMenuItem>
            ))
          ) : (
            <DropdownMenuItem disabled>No actions available</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={!!confirmItem}
        onOpenChange={() => setConfirmItem(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmItem?.confirmText ?? 'Are you sure?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmItem?.confirmDescription ??
                'This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmItem(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
