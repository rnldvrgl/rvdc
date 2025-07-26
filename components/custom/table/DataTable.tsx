'use client'

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { AnimatePresence, motion } from 'framer-motion'
import { Search } from 'lucide-react'
import React from 'react'

import { DataTableDateRangeFilter } from '@/components/custom/table/components/DataTableDateRangeFilter'
import { DataTableFilterDropdown } from '@/components/custom/table/components/DataTableFilterDropdown'
import { DataTablePagination } from '@/components/custom/table/components/DataTablePagination'
import { DataTableSortDropdown } from '@/components/custom/table/components/DataTableSortDropdown'
import { DataTableViewOptions } from '@/components/custom/table/components/DataTableViewOptions'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FilterDefinition, SortOption } from '@/lib/constants/interface'
import { DateRangePresetLabel, PaginatedResult } from '@/lib/constants/types'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { useNavigation } from '@/lib/hooks/useNavigation'
import useSearchParameters from '@/lib/hooks/useSearchParameters'
import { cn } from '@/lib/utils/helpers'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: PaginatedResult<TData>
  isLoading: boolean
  headerActions?: React.ReactNode
  defaultRangePreset?: DateRangePresetLabel
  filters?: FilterDefinition[]
  orderingOptions?: SortOption[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  headerActions,
  defaultRangePreset,
  filters,
  orderingOptions,
}: DataTableProps<TData, TValue>) {
  const {
    page,
    limit: rawLimit,
    search,
    ordering,
    filter,
  } = useSearchParameters()
  const limit = Number(rawLimit) || 10
  const { push } = useNavigation()

  const totalCount = data?.count ?? 0
  const pageCount = Math.max(1, Math.ceil(totalCount / limit))
  const hasNextPage = !!data?.next
  const hasPrevPage = !!data?.previous

  const [localSearch, setLocalSearch] = React.useState(search || '')
  const debouncedSearch = useDebounce(localSearch, 1000)

  const [sortingState, setSortingState] = React.useState(() => {
    if (!ordering) return []
    return ordering
      .split(',')
      .map((part) =>
        part.startsWith('-')
          ? { id: part.slice(1), desc: true }
          : { id: part, desc: false },
      )
  })

  React.useEffect(() => {
    if (debouncedSearch !== (search || '')) {
      push({
        page: 1,
        limit,
        ordering,
        search: debouncedSearch || undefined,
        filter,
      })
    }
  }, [debouncedSearch, search, limit, ordering, push])

  React.useEffect(() => {
    setLocalSearch(search || '')
  }, [search])

  const table = useReactTable({
    data: data.results ?? [],
    columns,
    pageCount,
    manualPagination: true,
    manualSorting: true,
    enableMultiSort: true,
    state: {
      pagination: {
        pageIndex: page - 1,
        pageSize: limit,
      },
      sorting: sortingState,
    },
    onPaginationChange: (updater) => {
      const nextPage =
        typeof updater === 'function'
          ? updater({ pageIndex: page - 1, pageSize: limit }).pageIndex
          : updater.pageIndex

      push({
        page: nextPage + 1,
        limit,
        ordering,
        search,
        filter,
      })
    },
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-wrap justify-between items-end gap-4">
          {/* Search, Sort, and Filter Block */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 flex-1 min-w-0">
            <Input
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search..."
              className="w-full sm:w-64 border-border focus-visible:ring-2 focus-visible:ring-primary/40"
            />

            {orderingOptions && orderingOptions?.length > 0 && (
              <DataTableSortDropdown
                options={orderingOptions}
                value={sortingState}
                onChange={setSortingState}
              />
            )}

            {filters && filters?.length > 0 && (
              <DataTableFilterDropdown filters={filters} />
            )}
          </div>

          {/* Date, View Toggle, and Header Actions Block */}
          <div className="flex flex-wrap items-end justify-end gap-3">
            <DataTableDateRangeFilter defaultRangePreset={defaultRangePreset} />
            <DataTableViewOptions table={table} />
            {headerActions}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-background shadow-sm ring-1 ring-border/30 overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow className="bg-muted/50">
              {table.getHeaderGroups()[0]?.headers.map((header) => {
                const colId = header.column.id
                return (
                  <TableHead
                    key={header.id}
                    className={cn(
                      'px-3 py-2 text-sm font-semibold',
                      ['action', 'actions'].includes(colId)
                        ? 'cursor-default'
                        : '',
                    )}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </div>
                  </TableHead>
                )
              })}
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow
                  key={`skeleton-${i}`}
                  className={i % 2 === 1 ? 'bg-muted/10' : ''}
                >
                  {columns.map((_, j) => (
                    <TableCell
                      key={`skeleton-cell-${i}-${j}`}
                      className="px-3 py-2"
                    >
                      <Skeleton className="h-5 w-full rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
              <AnimatePresence initial={false}>
                {table.getRowModel().rows.map((row, i) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      'border-b border-border/40 transition-colors',
                      i % 2 === 1 ? 'bg-muted/10' : '',
                      'hover:bg-muted/20',
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="px-3 py-2 text-sm"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </motion.tr>
                ))}
              </AnimatePresence>
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-36 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Search className="h-8 w-8" />
                    <span>No results found</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col items-center justify-center sm:flex-row sm:items-center sm:justify-end gap-4">
        <DataTablePagination
          hasPrevPage={hasPrevPage}
          hasNextPage={hasNextPage}
          count={totalCount}
        />
      </div>
    </div>
  )
}
