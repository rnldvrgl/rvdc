"use client"

import {
    ColumnDef,
    RowData,
    RowSelectionState,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import { AnimatePresence, motion } from "framer-motion"
import React, { useRef } from "react"

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
import { DATE_RANGE_PRESETS } from "@/lib/constants/general"
import { FilterDefinition, SortOption } from "@/lib/constants/interface"
import { DateRangePresetLabel, PaginatedResult } from "@/lib/constants/types"
import { useDebounce } from "@/lib/hooks/useDebounce"
import { useNavigation } from "@/lib/hooks/useNavigation"
import useSearchParameters from "@/lib/hooks/useSearchParameters"
import { cn } from "@/lib/utils/helpers"
import { formatBackDate } from "@/lib/utils/helpers/date"
import { AnimatedNumber } from "@/components/custom/shared/AnimatedNumber"
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

// Module augmentation for responsive column hiding via meta.thClass / meta.tdClass
declare module "@tanstack/react-table" {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface ColumnMeta<TData extends RowData, TValue> {
        thClass?: string
        tdClass?: string
    }
}

export interface BulkAction<TData> {
    label: string
    icon?: LucideIcon
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost"
    onClick: (selectedRows: TData[]) => void
}

// Animated row component
function DataTableRow({
    row,
    index,
    onRowClick,
}: {
    row: ReturnType<
        ReturnType<typeof useReactTable>["getRowModel"]
    >["rows"][number]
    index: number
    onRowClick?: (original: unknown) => void
}) {
    return (
        <motion.tr
            key={row.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{
                duration: 0.2,
                delay: Math.min(index * 0.02, 0.3),
            }}
            data-state={row.getIsSelected() ? "selected" : undefined}
            className={cn(
                "border-b border-border/40 transition-all hover:bg-muted/40 data-[state=selected]:bg-muted/60",
                onRowClick && "cursor-pointer hover:shadow-sm",
            )}
            onClick={() => onRowClick?.(row.original)}
        >
            {row.getVisibleCells().map((cell) => {
                const colId = cell.column.id
                const isActionColumn = ["action", "actions"].includes(colId)
                const isSelectColumn = colId === "_select"

                return (
                    <TableCell
                        key={cell.id}
                        className={cn(
                            "h-14 px-4 py-2.5 text-sm",
                            isActionColumn && "text-center",
                            isSelectColumn && "px-3",
                            cell.column.columnDef.meta?.tdClass,
                        )}
                        onClick={
                            isSelectColumn || isActionColumn
                                ? (e: React.MouseEvent) => e.stopPropagation()
                                : undefined
                        }
                    >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                )
            })}
        </motion.tr>
    )
}

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data?: PaginatedResult<TData>
    /** Local array — enables local search/sort with no URL mutations */
    localData?: TData[]
    /** Custom filter for local mode (receives lower-cased query) */
    filterFn?: (row: TData, query: string) => boolean
    /** Right-side slot shown instead of date-range/export in local mode */
    toolbar?: React.ReactNode
    /** Hide the search input (useful when showing archived items) */
    hideSearch?: boolean
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
    enableVirtualization?: boolean
    searchPlaceholder?: string
}

export function DataTable<TData, TValue>({
    columns,
    data,
    localData,
    filterFn,
    toolbar,
    hideSearch = false,
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
    enableVirtualization = false,
    searchPlaceholder = "Search...",
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
    const isLocal = localData !== undefined

    const totalCount = data?.count ?? 0
    const pageCount = Math.max(1, Math.ceil(totalCount / limit))
    const hasNextPage = !!data?.next
    const hasPrevPage = !!data?.previous

    const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})

    // Reset selection when page changes
    React.useEffect(() => {
        setRowSelection({})
    }, [page])

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
            cell: ({ row }) => {
                const isSelected = row.getIsSelected()
                return (
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={(value) => {
                            row.toggleSelected(!!value)
                        }}
                        aria-label="Select row"
                        className="translate-y-0.5"
                    />
                )
            },
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
        if (!isLocal && debouncedSearch !== (search || "")) {
            push({
                page: 1,
                limit,
                ordering,
                search: debouncedSearch || undefined,
                filter,
            })
        }
    }, [isLocal, debouncedSearch, search, limit, ordering, push, filter])

    React.useEffect(() => {
        setLocalSearch(search || "")
    }, [search])

    const filteredLocalData = React.useMemo(() => {
        if (!isLocal) return [] as TData[]
        const q = debouncedSearch.toLowerCase()
        if (!q) return localData!
        return localData!.filter((row) =>
            filterFn
                ? filterFn(row, q)
                : Object.values(row as Record<string, unknown>).some((v) =>
                    String(v ?? "").toLowerCase().includes(q)
                )
        )
    }, [isLocal, localData, debouncedSearch, filterFn])

    const table = useReactTable({
        data: isLocal ? filteredLocalData : (data?.results ?? []),
        columns: allColumns,
        pageCount: isLocal ? 1 : pageCount,
        manualPagination: !isLocal,
        manualSorting: !isLocal,
        enableMultiSort: true,
        enableRowSelection,
        getRowId: (row) => String((row as Record<string, unknown>)?.id ?? row),
        state: {
            pagination: {
                pageIndex: page - 1,
                pageSize: limit,
            },
            sorting: sortingState,
            rowSelection,
        },
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSortingState,
        onPaginationChange: (updater) => {
            if (isLocal) return
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
        getSortedRowModel: getSortedRowModel(),
    })

    const rows = table.getRowModel().rows
    const tableContainerRef = useRef<HTMLDivElement>(null)
    const isVirtualized = enableVirtualization && rows.length > 50

    const handleExportCSV = React.useCallback(() => {
        const rows = data?.results ?? []
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
    }, [data?.results, exportFileName, table])

    const activeFilterKeys = React.useMemo(() => {
        const keys = Object.keys(filter ?? {})
        if (keys.length === 0) return []

        if (!defaultRangePreset) return keys

        const preset = DATE_RANGE_PRESETS.find(
            (item) => item.label === defaultRangePreset,
        )
        const presetStart = preset?.range.from
            ? formatBackDate(preset.range.from)
            : undefined
        const presetEnd = preset?.range.to
            ? formatBackDate(preset.range.to)
            : undefined

        const matchesPresetStart = filter?.start_date === presetStart
        const matchesPresetEnd = filter?.end_date === presetEnd
        const hasDefaultPresetRange = matchesPresetStart && matchesPresetEnd

        if (!hasDefaultPresetRange) return keys

        return keys.filter((key) => key !== "start_date" && key !== "end_date")
    }, [filter, defaultRangePreset])

    const hasActiveFilters = React.useMemo(() => {
        if (isLocal) return Boolean(debouncedSearch)
        return Boolean(search || ordering || activeFilterKeys.length > 0)
    }, [isLocal, debouncedSearch, search, ordering, activeFilterKeys])

    const clearFilters = () => {
        setLocalSearch("")
        if (isLocal) return
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
    const activeTotalCount = isLocal ? filteredLocalData.length : totalCount

    const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original)
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
                    {!hideSearch && (
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder={searchPlaceholder}
                                value={localSearch}
                                onChange={(e) => setLocalSearch(e.target.value)}
                                className="pl-9 pr-9  h-9"
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
                    )}

                    {/* Sort and Filter Controls */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        {!isLocal && orderingOptions && orderingOptions.length > 0 && (
                            <DataTableSortDropdown
                                options={orderingOptions}
                                value={sortingState}
                                onChange={setSortingState}
                            />
                        )}

                        {!isLocal && filters && filters.length > 0 && (
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

                    {/* Right side: toolbar (local mode) or date filter + export (server mode) */}
                    <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
                        {isLocal ? (
                            toolbar
                        ) : (
                            <>
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
                                        disabled={(data?.results ?? []).length === 0}
                                        className="gap-1.5 h-9 shrink-0"
                                    >
                                        <Download className="size-4" />
                                        <span className="hidden sm:inline">Export</span>
                                    </Button>
                                )}
                            </>
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
                            className="gap-1.5 h-7 "
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
                    {activeFilterKeys.length > 0 && (
                        <Badge
                            variant="default"
                            className="gap-1.5 h-7 "
                        >
                            <Filter className="size-3" />
                            <span className="text-xs">
                                {activeFilterKeys.length} filter
                                {activeFilterKeys.length !== 1 ? "s" : ""}
                            </span>
                        </Badge>
                    )}
                </div>
            )}

            {/* Data Display Info */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="font-medium">
                    {isLocal ? (
                        activeTotalCount > 0 ? (
                            <span>
                                <span className="font-semibold text-foreground"><AnimatedNumber value={activeTotalCount} /></span>{" "}
                                result{activeTotalCount !== 1 ? "s" : ""}
                            </span>
                        ) : (
                            <span>No results found</span>
                        )
                    ) : totalCount > 0 ? (
                        <span>
                            Showing {startIndex} to {endIndex} of{" "}
                            <span className="font-semibold text-foreground">
                                <AnimatedNumber value={totalCount} />
                            </span>{" "}
                            results
                        </span>
                    ) : (
                        <span>No results found</span>
                    )}
                </div>
                {!isLocal && totalCount > 0 && (
                    <div className="flex items-center gap-2 text-xs">
                        <Database className="size-3.5" />
                        <span className="font-semibold"><AnimatedNumber value={totalCount} /></span>
                        <span>total</span>
                    </div>
                )}
            </div>

            {/* Table Container */}
            <div className="relative overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
                <div
                    ref={tableContainerRef}
                    className={cn(
                        "overflow-x-auto",
                        isVirtualized && "max-h-[600px] overflow-y-auto",
                    )}
                >
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
                                                header.column.columnDef.meta?.thClass,
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
                            ) : rows.length > 0 ? (
                                <>
                                    {rows.map((row, i) => (
                                        <DataTableRow
                                            key={row.id}
                                            row={row}
                                            index={isVirtualized ? 0 : i}
                                            onRowClick={
                                                onRowClick
                                                    ? (original) => onRowClick(original as TData)
                                                    : undefined
                                            }
                                        />
                                    ))}
                                </>
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
            {!isLocal && totalCount > 0 && (
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
