"use client"

import React, { useMemo, useState } from "react"

import { ArchiveToggle } from "@/components/custom/shared/ArchiveToggle"
import { useArchive } from "@/lib/hooks/useArchive"
import useSearchParameters from "@/lib/hooks/useSearchParameters"
import {
    Holiday,
    useHolidayFilters,
    useHolidays,
} from "@/lib/queries/usePayroll"

import { usePayrollAdminMutations } from "@/lib/mutations/usePayrollAdminMutations"

import { useCurrentUser } from "@/lib/hooks/useCurrentUser"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"

import { ConfirmAlert } from "@/components/custom/shared/ConfirmAlert"
import EntitySheet from "@/components/custom/shared/EntitySheet"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { DataTableDateRangeFilter } from "@/components/custom/table/components/DataTableDateRangeFilter"
import { DataTableFilterDropdown } from "@/components/custom/table/components/DataTableFilterDropdown"
import HolidayForm from "@/components/forms/HolidayForm"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { HolidayKind } from "@/lib/constants/types"
import { useConfirmDialog } from "@/lib/hooks/useConfirmDialog"
import { useDebounce } from "@/lib/hooks/useDebounce"
import { useEntitySheet } from "@/lib/hooks/useEntitySheet"
import { useNavigation } from "@/lib/hooks/useNavigation"
import {
    Archive,
    Calendar,
    CalendarDays,
    Plus,
    RefreshCcw,
    RotateCcw,
    Save,
    Search,
    Trash2,
    Upload,
} from "lucide-react"
import { AnimatedNumber } from "@/components/custom/shared/AnimatedNumber"
import { EmptyState } from "@/components/custom/EmptyState"

export default function HolidaysAdminPage() {
    const searchParams = useSearchParameters()
    const { search, limit, ordering, page, filter } = searchParams
    const { isAdmin } = useCurrentUser()
    const [isArchived, setIsArchived] = useState(false)
    const { push } = useNavigation()
    const [localSearch, setLocalSearch] = React.useState(search || "")
    const debouncedSearch = useDebounce(localSearch, 1000)
    const { filters } = useHolidayFilters()

    const {
        entityState: viewSheet,
        openEntity: openView,
        closeEntity: closeView,
    } = useEntitySheet<Holiday>()
    const [csvFile, setCsvFile] = React.useState<File | null>(null)

    React.useEffect(() => {
        if (debouncedSearch !== (search || "")) {
            push({
                page: 1,
                search: debouncedSearch || undefined,
                filter,
            })
        }
    }, [debouncedSearch, search, push, filter])

    React.useEffect(() => {
        setLocalSearch(search || "")
    }, [search])

    const { data, isLoading, refetch } = useHolidays({
        page: page || 1,
        limit: limit || 100,
        ordering,
        search: debouncedSearch,
        filter,
    })

    const { updateHoliday, deleteHoliday, uploadHolidaysCsv } =
        usePayrollAdminMutations()

    const { archivedQuery, restoreItem, hardDeleteItem } = useArchive<Holiday>(
        "/payroll/holidays/",
        "holidays",
        searchParams,
        isArchived,
    )

    const handleRefresh = async () => {
        await refetch()
    }

    const handleUploadCsv = async () => {
        if (!isAdmin || !csvFile) return
        await uploadHolidaysCsv.mutateAsync(csvFile)
        setCsvFile(null)
        // Reset file input
        const fileInput = document.getElementById("csv-upload") as HTMLInputElement
        if (fileInput) fileInput.value = ""
        await refetch()
    }

    return (
        <Wrapper>
            <PageHeader
                icon={Calendar}
                onRefresh={handleRefresh}
                title="Holiday Management"
                description="Manage company holidays and special non-working days."
                isAdminOnly
                actionButton={
                    !isArchived && (
                        <Button onClick={() => openView()}>
                            <Plus className="size-4 mr-1" />
                            Add Holiday
                        </Button>
                    )
                }
            />

            <ArchiveToggle
                isArchived={isArchived}
                onToggle={setIsArchived}
                archivedCount={archivedQuery.data?.count}
            />

            {!isArchived && (
                <>
                    <EntitySheet<Holiday>
                        open={viewSheet.open}
                        onClose={closeView}
                        title="Add Holiday"
                        description="Fill out the form below to add a new holiday."
                        withCloseConfirmation
                        renderForm={({ forceClose }) => (
                            <HolidayForm onClose={forceClose} />
                        )}
                    />

                    {/* Holidays List Card */}
                    <Card>
                        <CardHeader className="pb-4">
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Holiday List</CardTitle>
                                        <CardDescription>
                                            <AnimatedNumber value={data?.results?.length || 0} /> holidays in total
                                        </CardDescription>
                                    </div>
                                </div>

                                <Separator />

                                {/* Filters & CSV Upload */}
                                <div className="flex flex-col lg:flex-row gap-3">
                                    <div className="flex-1 flex flex-wrap gap-2">
                                        <div className="relative flex-1 min-w-[200px]">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                            <Input
                                                value={localSearch}
                                                onChange={(e) => setLocalSearch(e.target.value)}
                                                placeholder="Search holidays..."
                                                className="pl-9 h-9"
                                            />
                                        </div>
                                        <DataTableFilterDropdown
                                            filters={filters}
                                            className="w-40"
                                        />
                                        <DataTableDateRangeFilter className="w-[280px]" />
                                    </div>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            document.getElementById("csv-upload")?.click()
                                        }
                                        disabled={!isAdmin || uploadHolidaysCsv.isPending}
                                        className="whitespace-nowrap"
                                    >
                                        <Upload className="size-4 mr-2" />
                                        {uploadHolidaysCsv.isPending
                                            ? "Uploading..."
                                            : "Import CSV"}
                                    </Button>
                                    <input
                                        aria-label="csv-upload"
                                        id="csv-upload"
                                        type="file"
                                        accept=".csv,text/csv"
                                        className="hidden"
                                        disabled={!isAdmin || uploadHolidaysCsv.isPending}
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) {
                                                setCsvFile(file)
                                                handleUploadCsv()
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="text-center space-y-3">
                                        <RefreshCcw className="size-8 animate-spin text-muted-foreground mx-auto" />
                                        <p className="text-sm text-muted-foreground">
                                            Loading holidays...
                                        </p>
                                    </div>
                                </div>
                            ) : data?.results?.length ? (
                                <div className="space-y-3">
                                    {data.results.map((h, index) => (
                                        <React.Fragment key={h.id}>
                                            {index > 0 && <Separator />}
                                            <HolidayRow
                                                holiday={h}
                                                canManage={isAdmin}
                                                updateMutation={updateHoliday}
                                                deleteMutation={deleteHoliday}
                                                onChanged={refetch}
                                            />
                                        </React.Fragment>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                                    <div className="flex items-center justify-center size-14 rounded-xl bg-muted/60 text-muted-foreground">
                                        <CalendarDays className="size-7" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-base font-medium text-foreground">
                                            No holidays found
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Add your first holiday using the form above
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}

            {/* Archived Holidays View */}
            {isArchived && (
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle>Archived Holidays</CardTitle>
                        <CardDescription>
                            <AnimatedNumber value={archivedQuery.data?.count || 0} /> archived holidays
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {archivedQuery.isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="text-center space-y-3">
                                    <RefreshCcw className="size-8 animate-spin text-muted-foreground mx-auto" />
                                    <p className="text-sm text-muted-foreground">
                                        Loading archived holidays...
                                    </p>
                                </div>
                            </div>
                        ) : archivedQuery.data?.results?.length ? (
                            <div className="space-y-3">
                                {archivedQuery.data.results.map((h: Holiday, index: number) => (
                                    <React.Fragment key={h.id}>
                                        {index > 0 && <Separator />}
                                        <div className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-lg hover:bg-accent/50 transition-colors">
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                <div className="flex flex-col items-center justify-center bg-muted/60 rounded-lg p-3 min-w-20">
                                                    <span className="text-2xl font-bold text-muted-foreground font-mono">
                                                        {new Date(h.date).getDate()}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground uppercase font-mono">
                                                        {new Date(h.date).toLocaleString("default", {
                                                            month: "short",
                                                        })}
                                                    </span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium">{h.name}</p>
                                                    <p className="text-sm text-muted-foreground capitalize">
                                                        {h.kind?.replace("_", " ")}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 md:ml-auto">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => restoreItem.mutate(h.id)}
                                                    disabled={restoreItem.isPending}
                                                >
                                                    <RotateCcw className="size-4 mr-2" />
                                                    Restore
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => {
                                                        if (
                                                            confirm(
                                                                `Permanently delete "${h.name}"? This cannot be undone.`,
                                                            )
                                                        ) {
                                                            hardDeleteItem.mutate(h.id)
                                                        }
                                                    }}
                                                    disabled={hardDeleteItem.isPending}
                                                >
                                                    <Trash2 className="size-4 mr-2" />
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>
                                    </React.Fragment>
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                icon={CalendarDays}
                                title="No archived holidays"
                                description="Archived holidays will appear here. You can restore them or permanently delete them."
                            />
                        )}
                    </CardContent>
                </Card>
            )}
        </Wrapper>
    )
}

function HolidayRow({
    holiday,
    canManage,
    updateMutation,
    deleteMutation,
    onChanged,
}: {
    holiday: Holiday
    canManage: boolean
    updateMutation: ReturnType<typeof usePayrollAdminMutations>["updateHoliday"]
    deleteMutation: ReturnType<typeof usePayrollAdminMutations>["deleteHoliday"]
    onChanged?: () => void
}) {
    const [name, setName] = useState<string>(holiday.name)
    const [kind, setKind] = useState<HolidayKind>(holiday.kind)
    const busy = updateMutation.isPending || deleteMutation.isPending

    const isUnchanged = useMemo(
        () => name === holiday.name && kind === holiday.kind,
        [name, kind, holiday.name, holiday.kind],
    )

    const save = async () => {
        if (!canManage || isUnchanged) return
        await updateMutation.mutateAsync({
            id: holiday.id,
            data: { name, kind },
        })
        onChanged?.()
    }

    const remove = async () => {
        if (!canManage) return
        await deleteMutation.mutateAsync(holiday.id)
        onChanged?.()
    }

    const confirmDelete = useConfirmDialog({
        onConfirm: remove,
    })

    return (
        <div className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-lg hover:bg-accent/50 transition-colors">
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="flex flex-col items-center justify-center bg-primary/10 rounded-lg p-3 min-w-20">
                    <span className="text-2xl font-bold text-primary font-mono">
                        {new Date(holiday.date).getDate()}
                    </span>
                    <span className="text-xs text-muted-foreground uppercase font-mono">
                        {new Date(holiday.date).toLocaleString("default", {
                            month: "short",
                        })}
                    </span>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 min-w-0">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                            Holiday Name
                        </label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={!canManage || busy}
                            className="h-9"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                            Type
                        </label>
                        <Select
                            value={kind}
                            onValueChange={(v) => setKind(v as HolidayKind)}
                            disabled={!canManage || busy}
                        >
                            <SelectTrigger className="h-9 w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="regular">
                                    <div className="flex items-center gap-2">
                                        <div className="size-2 rounded-full bg-blue-500" />
                                        Regular Holiday
                                    </div>
                                </SelectItem>
                                <SelectItem value="special_non_working">
                                    <div className="flex items-center gap-2">
                                        <div className="size-2 rounded-full bg-amber-500" />
                                        Special Non-Working
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center gap-2 md:ml-auto">
                <Button
                    onClick={save}
                    variant={isUnchanged ? "outline" : "default"}
                    disabled={!canManage || busy || isUnchanged}
                    size="sm"
                    className="w-full "
                >
                    <Save className="size-4 mr-2" />
                    {updateMutation.isPending ? "Saving..." : "Save"}
                </Button>

                <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={!canManage || busy}
                    onClick={confirmDelete.openDialog}
                >
                    <Archive className="size-4 mr-2" />
                    Archive
                </Button>

                <ConfirmAlert
                    open={confirmDelete.open}
                    onOpenChange={confirmDelete.setOpen}
                    onConfirm={confirmDelete.handleConfirm}
                    isConfirming={confirmDelete.isConfirming}
                    title="Archive this holiday?"
                    description="You can restore it from the Archived tab."
                    confirmText="Archive"
                />
            </div>
        </div>
    )
}
