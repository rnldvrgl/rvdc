"use client"

import { ConfirmDialog } from "@/components/custom/shared/ConfirmDialog"
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
import { LucideIcon, MoreHorizontal } from "lucide-react"
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

      <ConfirmDialog
        open={!!confirmItem}
        onCancel={() => setConfirmItem(null)}
        onConfirm={handleConfirm}
        title={confirmItem?.confirmText ?? "Are you sure?"}
        description={
          confirmItem?.confirmDescription ??
          (confirmItem?.destructive
            ? "This action cannot be undone."
            : "You can restore this later from the Archived tab.")
        }
        confirmText={confirmItem?.destructive ? "Delete" : "Continue"}
        Icon={confirmItem?.icon}
        variant={confirmItem?.destructive ? "destructive" : "warning"}
      />
    </>
  )
}
