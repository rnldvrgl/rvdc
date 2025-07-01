'use client'

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import React from 'react'

import { DataTablePagination } from '@/components/custom/table/components/Pagination'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { useNavigation } from '@/lib/hooks/useNavigation'
import useSearchParameters from '@/lib/hooks/useSearchParameters'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pageCount: number
  totalCount: number
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageCount,
  totalCount,
}: DataTableProps<TData, TValue>) {
  const { page, limit: rawLimit, search, ordering } = useSearchParameters()
  const limit = Number(rawLimit) || 10
  const { push } = useNavigation()

  const [localSearch, setLocalSearch] = React.useState(search || '')
  const debouncedSearch = useDebounce(localSearch, 500)

  const sortingState = React.useMemo(() => {
    if (!ordering) return []
    const [id, dir] = ordering.split(':')
    return [{ id, desc: dir === 'desc' }]
  }, [ordering])

  React.useEffect(() => {
    if (debouncedSearch !== (search || '')) {
      push({
        page: 1,
        limit,
        ordering,
        search: debouncedSearch || undefined,
      })
    }
  }, [debouncedSearch])

  React.useEffect(() => {
    setLocalSearch(search || '')
  }, [search])

  const table = useReactTable({
    data,
    columns,
    pageCount,
    manualPagination: true,
    manualSorting: true,
    state: {
      pagination: {
        pageIndex: page - 1,
        pageSize: limit,
      },
      sorting: sortingState,
    },
    onPaginationChange: (updater) => {
      const nextPageIndex =
        typeof updater === 'function'
          ? updater({ pageIndex: page - 1, pageSize: limit }).pageIndex
          : updater.pageIndex

      push({
        page: nextPageIndex + 1,
        limit,
        ordering,
        search,
      })
    },
    onSortingChange: (updater) => {
      const nextSorting =
        typeof updater === 'function' ? updater(sortingState) : updater

      if (nextSorting.length) {
        const s = nextSorting[0]
        push({
          page: 1,
          limit,
          ordering: `${s.id}:${s.desc ? 'desc' : 'asc'}`,
          search,
        })
      } else {
        push({
          page: 1,
          limit,
          ordering: undefined,
          search,
        })
      }
    },
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2">
        <Input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Search..."
          className="w-full sm:max-w-xs"
        />
        <DataTablePagination
          hasPrevPage={page > 1}
          hasNextPage={page < pageCount}
          count={totalCount}
        />
      </div>

      <div className="rounded-2xl border shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="bg-muted/50"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="px-3 py-2"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="px-3 py-2"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
