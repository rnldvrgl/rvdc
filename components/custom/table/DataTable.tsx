import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import React from 'react'

import { ChevronUp } from 'lucide-react'

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
      pagination: { pageIndex: page - 1, pageSize: limit },
      sorting: sortingState,
    },
    onPaginationChange: (updater) => {
      const next =
        typeof updater === 'function'
          ? updater({ pageIndex: page - 1, pageSize: limit }).pageIndex
          : updater.pageIndex
      push({ page: next + 1, limit, ordering, search })
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
        push({ page: 1, limit, ordering: undefined, search })
      }
    },
    getCoreRowModel: getCoreRowModel(),
  })

  const getSortIcon = (sorted?: false | 'asc' | 'desc') => (
    <ChevronUp
      className={`h-4 w-4 transition-all duration-200 opacity-0 scale-75
        ${sorted ? 'opacity-100 scale-100' : ''}
      `}
      style={{ transform: sorted === 'desc' ? 'rotate(180deg)' : undefined }}
    />
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Search..."
          className="w-full sm:max-w-xs border-border focus-visible:ring-2 focus-visible:ring-primary/40"
        />
        <DataTablePagination
          hasPrevPage={page > 1}
          hasNextPage={page < pageCount}
          count={totalCount}
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border shadow-sm ring-1 ring-border/30">
        <Table className="min-w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="bg-muted/50"
              >
                {headerGroup.headers.map((header) => {
                  const sorted = header.column.getIsSorted()
                  return (
                    <TableHead
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className="group px-4 py-3 text-sm font-semibold cursor-pointer select-none"
                      title={`Click to sort by ${String(header.column.id)}`}
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        <span className="transition-all group-hover:opacity-80">
                          {getSortIcon(sorted)}
                        </span>
                      </div>
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row, i) => (
                <TableRow
                  key={row.id}
                  className={
                    i % 2 === 1
                      ? 'bg-muted/20 hover:bg-muted/40 transition-colors'
                      : 'hover:bg-muted/40 transition-colors'
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="px-4 py-3 text-sm"
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
                  className="h-24 text-center text-muted-foreground"
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
