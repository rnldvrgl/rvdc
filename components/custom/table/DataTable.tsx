'use client'

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'
import React from 'react'

import { DataTablePagination } from '@/components/custom/table/components/Pagination'
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
import { useDebounce } from '@/lib/hooks/useDebounce'
import { useNavigation } from '@/lib/hooks/useNavigation'
import useSearchParameters from '@/lib/hooks/useSearchParameters'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pageCount: number
  totalCount: number
  isLoading: boolean
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageCount,
  totalCount,
  isLoading,
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
      const nextPage =
        typeof updater === 'function'
          ? updater({ pageIndex: page - 1, pageSize: limit }).pageIndex
          : updater.pageIndex

      push({
        page: nextPage + 1,
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
            <TableRow className="bg-muted/50">
              {table.getHeaderGroups()[0]?.headers.map((header) => {
                const sorted = header.column.getIsSorted()
                return (
                  <TableHead
                    key={header.id}
                    className="px-4 py-3 text-sm font-semibold cursor-pointer select-none"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                      {sorted && (
                        <motion.div
                          className="flex items-center gap-0.5"
                          animate={{ y: [-2, 0, -1, 0] }}
                          transition={{ duration: 0.4 }}
                        >
                          <ChevronUp
                            className={`h-4 w-4 ${
                              sorted === 'asc'
                                ? 'opacity-100 text-primary'
                                : 'opacity-50'
                            }`}
                          />
                          <ChevronDown
                            className={`h-4 w-4 ${
                              sorted === 'desc'
                                ? 'opacity-100 text-primary'
                                : 'opacity-50'
                            }`}
                          />
                        </motion.div>
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
                  className={i % 2 === 1 ? 'bg-muted/20' : ''}
                >
                  {Array.from({ length: columns.length }).map((_, j) => (
                    <TableCell
                      key={`skeleton-cell-${i}-${j}`}
                      className="px-4 py-3"
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
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className={`${
                      i % 2 === 1
                        ? 'bg-muted/20 hover:bg-muted/40'
                        : 'hover:bg-muted/40'
                    } transition-colors`}
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
                  </motion.tr>
                ))}
              </AnimatePresence>
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
