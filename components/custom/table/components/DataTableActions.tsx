"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import clsx from "clsx"
import { LucideIcon, MoreVertical } from "lucide-react"
import { useCallback, useState } from "react"

interface DataTableActionsProps {
  label?: string
  items: ActionItem[]
}
interface ActionItem {
  label: string
  onClick: () => void
  icon?: LucideIcon
  destructive?: boolean
  confirmText?: string
  confirmDescription?: string
  disabled?: boolean
}

export function DataTableActions({
  label = "Actions",
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
            size="sm"
            className="h-8 w-8 p-0 data-[state=open]:bg-muted"
          >
            <span className="sr-only">Open menu</span>
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-40"
        >
          <DropdownMenuLabel>{label}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {items.length > 0 ? (
            items.map((item, idx) => {
              const Icon = item.icon
              return (
                <DropdownMenuItem
                  key={idx}
                  disabled={item.disabled}
                  onSelect={(e) => {
                    if (item.disabled) return
                    if (item.destructive) {
                      e.preventDefault()
                      setConfirmItem(item)
                    } else {
                      item.onClick()
                    }
                  }}
                  className={clsx(
                    "flex items-center gap-2 cursor-pointer",
                    item.destructive &&
                      "text-destructive focus:text-destructive focus:bg-destructive/10",
                    item.disabled && "opacity-50 cursor-not-allowed",
                  )}
                >
                  {Icon && <Icon className="size-4" />}
                  <span>{item.label}</span>
                </DropdownMenuItem>
              )
            })
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
              {confirmItem?.confirmText ?? "Are you sure?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmItem?.confirmDescription ??
                "This action cannot be undone."}
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
