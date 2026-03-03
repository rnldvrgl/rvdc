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
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils/helpers"
import { AlertTriangle, LucideIcon, MoreHorizontal } from "lucide-react"
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

export function DataTableActions({ items }: DataTableActionsProps) {
  const [confirmItem, setConfirmItem] = useState<null | ActionItem>(null)

  const handleConfirm = useCallback(() => {
    if (confirmItem) {
      confirmItem.onClick()
      setConfirmItem(null)
    }
  }, [confirmItem])

  // Split into regular and destructive items for visual grouping
  const regularItems = items.filter((i) => !i.destructive)
  const destructiveItems = items.filter((i) => i.destructive)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg text-muted-foreground hover:text-foreground data-[state=open]:bg-accent data-[state=open]:text-foreground transition-colors"
          >
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-44 rounded-xl p-1"
        >
          {regularItems.length > 0 && (
            <DropdownMenuGroup>
              {regularItems.map((item, idx) => {
                const Icon = item.icon
                return (
                  <DropdownMenuItem
                    key={idx}
                    disabled={item.disabled}
                    onSelect={(e) => {
                      if (item.disabled) return
                      if (item.confirmText) {
                        e.preventDefault()
                        setConfirmItem(item)
                      } else {
                        item.onClick()
                      }
                    }}
                    className={cn(
                      "gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium cursor-pointer transition-colors",
                      item.disabled && "opacity-40 cursor-not-allowed",
                    )}
                  >
                    {Icon && <Icon className="size-4 text-muted-foreground" />}
                    {item.label}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuGroup>
          )}

          {regularItems.length > 0 && destructiveItems.length > 0 && (
            <DropdownMenuSeparator className="my-1" />
          )}

          {destructiveItems.length > 0 && (
            <DropdownMenuGroup>
              {destructiveItems.map((item, idx) => {
                const Icon = item.icon
                return (
                  <DropdownMenuItem
                    key={idx}
                    disabled={item.disabled}
                    onSelect={(e) => {
                      if (item.disabled) return
                      if (item.destructive || item.confirmText) {
                        e.preventDefault()
                        setConfirmItem(item)
                      } else {
                        item.onClick()
                      }
                    }}
                    className={cn(
                      "gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium cursor-pointer transition-colors",
                      "text-destructive focus:text-destructive focus:bg-destructive/10",
                      item.disabled && "opacity-40 cursor-not-allowed",
                    )}
                  >
                    {Icon && <Icon className="size-4" />}
                    {item.label}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuGroup>
          )}

          {items.length === 0 && (
            <DropdownMenuItem
              disabled
              className="text-muted-foreground text-[13px] justify-center py-3"
            >
              No actions
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={!!confirmItem}
        onOpenChange={() => setConfirmItem(null)}
      >
        <AlertDialogContent className="max-w-sm rounded-xl">
          <AlertDialogHeader className="gap-3">
            <div
              className={cn(
                "mx-auto flex size-11 items-center justify-center rounded-full",
                confirmItem?.destructive
                  ? "bg-destructive/10 text-destructive"
                  : "bg-amber-500/10 text-amber-500",
              )}
            >
              <AlertTriangle className="size-5" />
            </div>
            <AlertDialogTitle className="text-center text-base">
              {confirmItem?.confirmText ?? "Are you sure?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-sm">
              {confirmItem?.confirmDescription ??
                (confirmItem?.destructive
                  ? "This action cannot be undone."
                  : "You can restore this later from the Archived tab.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 sm:justify-center mt-1">
            <AlertDialogCancel
              onClick={() => setConfirmItem(null)}
              className="mt-0 flex-1 rounded-lg"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={cn(
                "flex-1 rounded-lg",
                confirmItem?.destructive &&
                  "bg-destructive text-white hover:bg-destructive/90",
              )}
            >
              {confirmItem?.destructive ? "Delete" : "Continue"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
