'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { Table } from '@tanstack/react-table'
import { Settings2 } from 'lucide-react'

type DataTableViewOptionsProps<TData> = {
  table: Table<TData>
}

export function DataTableViewOptions<TData>({
  table,
}: DataTableViewOptionsProps<TData>) {
  const toggleColumns = table
    .getAllColumns()
    .filter(
      (column) =>
        typeof column.accessorFn !== 'undefined' && column.getCanHide(),
    )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto hidden h-8 lg:flex"
        >
          <Settings2 className="size-4 mr-1" />
          View
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-[180px]"
      >
        <DropdownMenuLabel className="text-xs uppercase tracking-widest">
          Toggle columns
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {toggleColumns.length === 0 && (
          <div className="px-3 py-2 text-sm text-muted-foreground">
            No columns to toggle
          </div>
        )}
        {toggleColumns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            className="capitalize"
            checked={column.getIsVisible()}
            onCheckedChange={(value: boolean) =>
              column.toggleVisibility(!!value)
            }
          >
            {column.columnDef.header?.toString()}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
