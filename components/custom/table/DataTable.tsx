"use client"

import {
  ColumnDef,
  RowSelectionState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { AnimatePresence, motion } from "framer-motion"
import React from "react"

import { DataTableDateRangeFilter } from "@/components/custom/table/components/DataTableDateRangeFilter"
import { DataTableFilterDropdown } from "@/components/custom/table/components/DataTableFilterDropdown"
import { DataTablePagination } from "@/components/custom/table/components/DataTablePagination"
import { DataTableSortDropdown } from "@/components/custom/table/components/DataTableSortDropdown"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FilterDefinition, SortOption } from "@/lib/constants/interface"
import { DateRangePresetLabel, PaginatedResult } from "@/lib/constants/types"
import { useDebounce } from "@/lib/hooks/useDebounce"
import { useNavigation } from "@/lib/hooks/useNavigation"
import useSearchParameters from "@/lib/hooks/useSearchParameters"
import { cn } from "@/lib/utils/helpers"
import {
  ArrowUpDown,
  Database,
  Filter,
  LucideIcon,
  RefreshCw,
  Search,
  X,
} from "lucide-react"

export interface BulkAction<TData> {
  label: string
  icon?: LucideIcon
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost"
  onClick: (selectedRows: TData[]) => void
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: PaginatedResult<TData>
  isLoading: boolean
  defaultRangePreset?: DateRangePresetLabel
  filters?: FilterDefinition[]
  orderingOptions?: SortOption[]
  withoutDateRangeFilter?: boolean
  title?: string
  description?: string
  onRefresh?: () => void
  emptyIcon?: LucideIcon
  emptyTitle?: string
  emptyDescription?: string
  enableRowSelection?: boolean
  bulkActions?: BulkAction<TData>[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  defaultRangePreset,
  filters,
  orderingOptions,
  withoutDateRangeFilter = false,
  title,
  description,
  emptyIcon: EmptyIcon,
  emptyTitle,
  emptyDescription,
  enableRowSelection = false,
  bulkActions,
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

  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})

  // Reset selection when page/data changes
  React.useEffect(() => {
    setRowSelection({})
  }, [page, data])

  // Build columns with optional selection checkbox
  const allColumns = React.useMemo(() => {
    if (!enableRowSelection) return columns
    const selectCol: ColumnDef<TData, TValue> = {
      id: "_select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-0.5"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-0.5"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    }
    return [selectCol, ...columns]
  }, [columns, enableRowSelection])

  const [localSearch, setLocalSearch] = React.useState(search || "")
  const debouncedSearch = useDebounce(localSearch, 500)

  const [sortingState, setSortingState] = React.useState(() => {
    if (!ordering) return []
    return ordering
      .split(",")
      .map((part) =>
        part.startsWith("-")
          ? { id: part.slice(1), desc: true }
          : { id: part, desc: false },
      )
  })

  React.useEffect(() => {
    if (debouncedSearch !== (search || "")) {
      push({
        page: 1,
        limit,
        ordering,
        search: debouncedSearch || undefined,
        filter,
      })
    }
  }, [debouncedSearch, search, limit, ordering, push, filter])

  React.useEffect(() => {
    setLocalSearch(search || "")
  }, [search])

  const table = useReactTable({
    data: data.results ?? [],
    columns: allColumns,
    pageCount,
    manualPagination: true,
    manualSorting: true,
    enableMultiSort: true,
    enableRowSelection,
    state: {
      pagination: {
        pageIndex: page - 1,
        pageSize: limit,
      },
      sorting: sortingState,
      rowSelection,
    },
    onRowSelectionChange: setRowSelection,
    onPaginationChange: (updater) => {
      const nextPage =
        typeof updater === "function"
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

  const hasActiveFilters = React.useMemo(() => {
    return Boolean(
      search || ordering || (filter && Object.keys(filter).length > 0),
    )
  }, [search, filter, ordering])

  const clearFilters = () => {
    setLocalSearch("")
    setSortingState([])
    push({
      page: 1,
      limit,
      ordering: undefined,
      search: undefined,
      filter: undefined,
    })
  }

  const startIndex = (page - 1) * limit + 1
  const endIndex = Math.min(page * limit, totalCount)

  const selectedRows = React.useMemo(() => {
    const results = data?.results ?? []
    return Object.keys(rowSelection)
      .filter((key) => rowSelection[key])
      .map((key) => results[Number(key)])
      .filter(Boolean)
  }, [rowSelection, data])

  const selectedCount = selectedRows.length

  return (
    <div className="space-y-4">
      {/* Header Section */}
      {(title || description) && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            {title && (
              <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        {/* Left side: Search, Sort, Filters */}
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-9 pr-4 bg-muted/50"
            />
            {localSearch && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 size-6 -translate-y-1/2 p-0 hover:bg-transparent"
                onClick={() => setLocalSearch("")}
              >
                <X className="size-3" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto xl:ml-0">
            {orderingOptions && orderingOptions.length > 0 && (
              <DataTableSortDropdown
                options={orderingOptions}
                value={sortingState}
                onChange={setSortingState}
              />
            )}

            {filters && filters.length > 0 && (
              <DataTableFilterDropdown filters={filters} />
            )}

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="px-2 lg:px-3"
              >
                Clear
                <X className="ml-1 size-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Right side: Date filter, Refresh, Actions */}
        {!withoutDateRangeFilter && (
          <div className="flex items-center gap-2">
            <DataTableDateRangeFilter
              defaultRangePreset={defaultRangePreset}
              className="w-full! max-w-full!"
            />
          </div>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Filters:</span>
          {search && (
            <Badge
              variant="secondary"
              className="gap-1"
            >
              <Search className="size-3" />
              {search}
            </Badge>
          )}
          {sortingState.length > 0 && (
            <Badge
              variant="secondary"
              className="gap-1"
            >
              <ArrowUpDown className="size-3" />
              {sortingState.length} sort
              {sortingState.length !== 1 ? "s" : ""}
            </Badge>
          )}
          {filter && Object.keys(filter).length > 0 && (
            <Badge
              variant="secondary"
              className="gap-1"
            >
              <Filter className="size-3" />
              {Object.keys(filter).length} filter
              {Object.keys(filter).length !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      )}

      {/* Data Display Info */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          {totalCount > 0 ? (
            <span>
              Showing {startIndex} to {endIndex} of{" "}
              {totalCount.toLocaleString()} results
            </span>
          ) : (
            <span>No results found</span>
          )}
        </div>
        {totalCount > 0 && (
          <div className="flex items-center gap-2">
            <Database className="size-3" />
            <span>{totalCount.toLocaleString()} total</span>
          </div>
        )}
      </div>

      {/* Table Container */}
      <div className="relative overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/60">
                {table.getHeaderGroups()[0]?.headers.map((header) => {
                  const colId = header.column.id
                  const isActionColumn = ["action", "actions"].includes(colId)
                  const isSelectColumn = colId === "_select"

                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "h-12 px-4 font-semibold",
                        isActionColumn && "w-[100px]",
                        isSelectColumn && "w-10 px-3",
                      )}
                    >
                      <div className="flex items-center gap-2">
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
                // Loading skeleton rows
                Array.from({ length: limit }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    {allColumns.map((_, j) => (
                      <TableCell
                        key={`skeleton-cell-${i}-${j}`}
                        className="h-12 px-4"
                      >
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows.length > 0 ? (
                // Data rows with animation
                <AnimatePresence mode="wait">
                  {table.getRowModel().rows.map((row, i) => (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{
                        duration: 0.2,
                        delay: i * 0.02,
                      }}
                      className="border-b border-border/50 transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className="h-12 px-4 py-2"
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
                // Empty state
                <TableRow>
                  <TableCell
                    colSpan={allColumns.length}
                    className="h-48 text-center p-6"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex items-center justify-center size-14 rounded-xl bg-muted/60 text-muted-foreground">
                        {EmptyIcon ? (
                          <EmptyIcon className="size-7" />
                        ) : (
                          <Database className="size-7" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-base font-medium text-foreground">
                          {emptyTitle ?? "No data found"}
                        </p>
                        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                          {hasActiveFilters
                            ? "Try adjusting your search or filters"
                            : (emptyDescription ?? "No records to display")}
                        </p>
                      </div>
                      {hasActiveFilters && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearFilters}
                          className="mt-1"
                        >
                          Clear filters
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm">
            <div className="flex items-center justify-center h-full">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="size-4 animate-spin" />
                Loading data...
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalCount > 0 && (
        <>
          <Separator />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              Page {page} of {pageCount}
            </div>
            <DataTablePagination
              hasPrevPage={hasPrevPage}
              hasNextPage={hasNextPage}
              count={totalCount}
            />
          </div>
        </>
      )}

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selectedCount > 0 && bulkActions && bulkActions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-2.5 shadow-lg">
              <span className="text-sm font-medium whitespace-nowrap">
                {selectedCount} selected
              </span>
              <Separator
                orientation="vertical"
                className="h-5"
              />
              <div className="flex items-center gap-2">
                {bulkActions.map((action) => {
                  const ActionIcon = action.icon
                  return (
                    <Button
                      key={action.label}
                      variant={action.variant ?? "outline"}
                      size="sm"
                      onClick={() => {
                        action.onClick(selectedRows)
                        setRowSelection({})
                      }}
                    >
                      {ActionIcon && <ActionIcon className="size-4 mr-1.5" />}
                      {action.label}
                    </Button>
                  )
                })}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="size-7 p-0"
                onClick={() => setRowSelection({})}
              >
                <X className="size-3.5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
