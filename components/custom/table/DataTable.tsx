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
import { DataTableLimitFilter } from "@/components/custom/table/components/DataTableLimitFilter"
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
  Download,
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
  onRowClick?: (row: TData) => void
  enableExport?: boolean
  exportFileName?: string
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
  onRowClick,
  enableExport = false,
  exportFileName = "export",
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

  const handleExportCSV = React.useCallback(() => {
    const rows = data.results ?? []
    if (rows.length === 0) return

    // Get visible columns (exclude select & action columns)
    const visibleCols = table
      .getVisibleLeafColumns()
      .filter(
        (col) =>
          !["_select", "action", "actions"].includes(col.id) &&
          col.id !== "select",
      )

    const headers = visibleCols.map((col) =>
      typeof col.columnDef.header === "string"
        ? col.columnDef.header
        : col.id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    )

    const csvRows = rows.map((row, rowIndex) =>
      visibleCols.map((col) => {
        let value: unknown

        // Try to get value using column's accessorKey or accessorFn
        const columnDef = col.columnDef as ColumnDef<TData, TValue> & {
          accessorKey?: string
          accessorFn?: (row: TData, index: number) => unknown
        }
        if (columnDef.accessorFn) {
          value = columnDef.accessorFn(row, rowIndex)
        } else if (columnDef.accessorKey) {
          // Handle nested properties like "client.full_name"
          const keys = String(columnDef.accessorKey).split(".")
          value = keys.reduce<unknown>(
            (obj: unknown, key: string) =>
              obj && typeof obj === "object" && key in obj
                ? (obj as Record<string, unknown>)[key]
                : undefined,
            row,
          )
        } else {
          value = (row as Record<string, unknown>)[col.id]
        }

        // If we still don't have a value and there's a cell renderer, use it
        if (value == null && typeof columnDef.cell === "function") {
          try {
            const cellValue = columnDef.cell({
              getValue: () => value,
              row: { original: row },
            } as never)
            // Extract text content from React elements
            if (typeof cellValue === "object" && cellValue?.props?.children) {
              value = cellValue.props.children
            } else {
              value = cellValue
            }
          } catch {
            // Ignore cell render errors during export
          }
        }

        if (value == null) return ""

        // Handle objects (like dates)
        let str: string
        if (value instanceof Date) {
          // Format date as readable string without time
          str = value.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        } else if (
          typeof value === "string" &&
          /^\d{4}-\d{2}-\d{2}T/.test(value)
        ) {
          // Handle ISO date strings
          const date = new Date(value)
          if (!isNaN(date.getTime())) {
            str = date.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          } else {
            str = String(value)
          }
        } else if (typeof value === "object") {
          str = JSON.stringify(value)
        } else {
          str = String(value)
        }

        // Clean up HTML tags and extra whitespace
        str = str.replace(/<[^>]*>/g, "").trim()

        // Remove currency symbols and formatting for numeric values
        // This handles ₱1,234.56 → 1234.56
        if (/^[₱$€£¥₹]/.test(str)) {
          str = str
            .replace(/^[₱$€£¥₹]/, "") // Remove currency symbol
            .replace(/,/g, "") // Remove thousand separators
            .trim()
        }

        // Escape quotes and wrap in quotes if contains comma/quote/newline
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }),
    )

    const csv = [headers.join(","), ...csvRows.map((r) => r.join(","))].join(
      "\n",
    )
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${exportFileName}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [data.results, exportFileName, table])

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
      <div className="flex flex-col gap-3">
        {/* Top Row: Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-9 pr-9 bg-white dark:bg-muted/50 border-slate-300 dark:border-slate-700 focus-visible:ring-purple-500 h-9"
            />
            {localSearch && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 size-7 -translate-y-1/2 p-0 hover:bg-transparent"
                onClick={() => setLocalSearch("")}
              >
                <X className="size-3.5" />
              </Button>
            )}
          </div>

          {/* Sort and Filter Controls */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
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
                className="px-2 h-9"
              >
                Clear
                <X className="ml-1.5 size-3.5" />
              </Button>
            )}
          </div>

          {/* Right side: Date filter and Export */}
          <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
            {!withoutDateRangeFilter && (
              <DataTableDateRangeFilter
                defaultRangePreset={defaultRangePreset}
                className="flex-1 sm:flex-initial"
              />
            )}
            {enableExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                disabled={(data.results ?? []).length === 0}
                className="gap-1.5 h-9 shrink-0"
              >
                <Download className="size-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Active:
          </span>
          {search && (
            <Badge
              variant="default"
              className="gap-1.5 h-7 bg-purple-500 hover:bg-purple-600"
            >
              <Search className="size-3" />
              <span className="text-xs">{search}</span>
            </Badge>
          )}
          {sortingState.length > 0 && (
            <Badge
              variant="default"
              className="gap-1.5 h-7 bg-purple-500 hover:bg-purple-600"
            >
              <ArrowUpDown className="size-3" />
              <span className="text-xs">
                {sortingState.length} sort
                {sortingState.length !== 1 ? "s" : ""}
              </span>
            </Badge>
          )}
          {filter && Object.keys(filter).length > 0 && (
            <Badge
              variant="default"
              className="gap-1.5 h-7 bg-purple-500 hover:bg-purple-600"
            >
              <Filter className="size-3" />
              <span className="text-xs">
                {Object.keys(filter).length} filter
                {Object.keys(filter).length !== 1 ? "s" : ""}
              </span>
            </Badge>
          )}
        </div>
      )}

      {/* Data Display Info */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="font-medium">
          {totalCount > 0 ? (
            <span>
              Showing {startIndex} to {endIndex} of{" "}
              <span className="font-semibold text-foreground">
                {totalCount.toLocaleString()}
              </span>{" "}
              results
            </span>
          ) : (
            <span>No results found</span>
          )}
        </div>
        {totalCount > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <Database className="size-3.5" />
            <span className="font-semibold">{totalCount.toLocaleString()}</span>
            <span>total</span>
          </div>
        )}
      </div>

      {/* Table Container */}
      <div className="relative overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/50 border-b border-border/40">
                {table.getHeaderGroups()[0]?.headers.map((header) => {
                  const colId = header.column.id
                  const isActionColumn = ["action", "actions"].includes(colId)
                  const isSelectColumn = colId === "_select"

                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "h-11 px-4 font-semibold text-xs uppercase tracking-wider",
                        isActionColumn && "w-24 text-center",
                        isSelectColumn && "w-12 px-3",
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
                        className="h-14 px-4"
                      >
                        <Skeleton className="h-5 w-full" />
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
                        delay: Math.min(i * 0.02, 0.3),
                      }}
                      className={cn(
                        "border-b border-border/40 transition-all hover:bg-muted/40 data-[state=selected]:bg-muted/60",
                        onRowClick && "cursor-pointer hover:shadow-sm",
                      )}
                      onClick={() => onRowClick?.(row.original)}
                    >
                      {row.getVisibleCells().map((cell) => {
                        const colId = cell.column.id
                        const isActionColumn = ["action", "actions"].includes(
                          colId,
                        )
                        const isSelectColumn = colId === "_select"

                        return (
                          <TableCell
                            key={cell.id}
                            className={cn(
                              "h-14 px-4 py-2.5 text-sm",
                              isActionColumn && "text-center",
                              isSelectColumn && "px-3",
                            )}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </TableCell>
                        )
                      })}
                    </motion.tr>
                  ))}
                </AnimatePresence>
              ) : (
                // Empty state
                <TableRow>
                  <TableCell
                    colSpan={allColumns.length}
                    className="h-56 text-center p-6"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex items-center justify-center size-16 rounded-2xl bg-muted/50 text-muted-foreground">
                        {EmptyIcon ? (
                          <EmptyIcon className="size-8" />
                        ) : (
                          <Database className="size-8" />
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-base font-semibold text-foreground">
                          {emptyTitle ?? "No data found"}
                        </p>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
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
                          className="mt-2"
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
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm">
            <div className="flex items-center justify-center h-full">
              <div className="flex items-center gap-2.5 text-sm font-medium text-muted-foreground bg-card px-4 py-2.5 rounded-xl border shadow-sm">
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
          <Separator className="bg-border/60" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-1">
            <div className="flex items-center gap-4">
              <DataTableLimitFilter />
              <div className="text-sm font-medium text-muted-foreground">
                Page {page} of {pageCount}
              </div>
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
            <div className="flex items-center gap-3 rounded-2xl border border-border/80 bg-card px-5 py-3 shadow-xl backdrop-blur-sm">
              <span className="text-sm font-semibold whitespace-nowrap">
                {selectedCount} selected
              </span>
              <Separator
                orientation="vertical"
                className="h-6"
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
                className="size-8 p-0 ml-1"
                onClick={() => setRowSelection({})}
              >
                <X className="size-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
