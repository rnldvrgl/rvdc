"use client"

import { getSalesTransactionColumns } from "@/app/(routes)/sales/columns"
import EntitySheet from "@/components/custom/shared/EntitySheet"
import PageHeader from "@/components/custom/shared/PageHeader"
import { SalesTransactionPrintContent } from "@/components/custom/shared/SalesTransactionPrintContent"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { DataTable } from "@/components/custom/table/DataTable"
import SalesTransactionForm from "@/components/forms/SalesTransactionForm"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SalesTransaction } from "@/lib/constants/interface"
import { useArchive } from "@/lib/hooks/useArchive"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useEntitySheet } from "@/lib/hooks/useEntitySheet"
import { usePrint } from "@/lib/hooks/usePrint"
import useSearchParameters from "@/lib/hooks/useSearchParameters"
import { useSalesTransactionMutations } from "@/lib/mutations/useSalesTransactionMutations"
import {
    useDailySalesSummary,
    useSalesTransaction,
    useSalesTransactionFilters,
    useSalesTransactions,
    useVoidedSalesTransactions,
} from "@/lib/queries/sales/useSalesTransactions"
import { useSystemSettings } from "@/lib/queries/useSystemSettings"
import {
    getHeldSales,
    removeHeldSale,
    resumeHeldSale,
    type HeldSale,
} from "@/lib/utils/heldSales"
import api from "@/lib/utils/api"
import { AnimatedNumber } from "@/components/custom/shared/AnimatedNumber"
import {
    Archive,
    Ban,
    ExternalLink,
    List,
    Pause,
    Play,
    Plus,
    ShoppingCart,
    X,
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { SalesTransactionDetails } from "@/components/details/SalesTransactionDetails"

// ─── Types ────────────────────────────────────────────────────────────────────

type TabValue = "active" | "voided" | "archived"

interface GoogleSheetMeta {
    sub_current_gid?: number | null
    sub_latest_gid?: number | null
    main_current_gid?: number | null
    main_latest_gid?: number | null
    current_month_sheets?: Record<
        string,
        {
            spreadsheet_id: string
            current_gid: number | null
            latest_gid: number | null
            stall_name: string
        }
    >
}

interface SheetLinkProps {
    href: string
    label: string
    loading: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const emptyData = {
    count: 0,
    next: null,
    previous: null,
    results: [] as SalesTransaction[],
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * A single Google Sheets link button.
 * Shows a shimmer skeleton while loading, then renders the real link.
 */
function SheetLinkButton({ href, label, loading }: SheetLinkProps) {
    if (loading) {
        return (
            <Skeleton className="h-8 w-44 rounded-md" />
        )
    }

    return (
        <Button asChild variant="default" size="sm" disabled={!href}>
            <a
                href={href || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="gap-1.5"
            >
                <ExternalLink className="size-3.5 shrink-0" />
                {label}
            </a>
        </Button>
    )
}

/** Held-sale row inside the popover. */
function HeldSaleRow({
    hs,
    onResume,
    onRemove,
}: {
    hs: HeldSale
    onResume: (hs: HeldSale) => void
    onRemove: (id: string) => void
}) {
    return (
        <div className="flex items-center justify-between rounded-md border px-2.5 py-1.5 text-sm">
            <button
                className="flex-1 text-left hover:underline"
                onClick={() => onResume(hs)}
            >
                <div className="font-medium truncate">{hs.label}</div>
                <div className="text-[10px] text-muted-foreground">
                    {new Date(hs.heldAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    })}
                </div>
            </button>
            <div className="flex items-center gap-1 ml-2">
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    onClick={() => onResume(hs)}
                >
                    <Play className="size-3" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 text-destructive hover:text-destructive"
                    onClick={() => onRemove(hs.id)}
                >
                    <X className="size-3" />
                </Button>
            </div>
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SalesTransactionsPage() {
    const { role, assigned_stall } = useCurrentUser()
    const { data: systemSettings } = useSystemSettings()

    // ── State ──────────────────────────────────────────────────────────────────
    const [googleSheetMeta, setGoogleSheetMeta] = useState<GoogleSheetMeta | null>(null)
    const [googleSheetMetaLoading, setGoogleSheetMetaLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<TabValue>("active")
    const [createKey, setCreateKey] = useState(0)
    const [nextClientId, setNextClientId] = useState<number | null>(null)
    const [heldSales, setHeldSales] = useState<HeldSale[]>([])
    const [resumingSale, setResumingSale] = useState<HeldSale | null>(null)

    // ── Routing ────────────────────────────────────────────────────────────────
    const router = useRouter()
    const urlSearchParams = useSearchParams()
    const viewId = urlSearchParams?.get("view") || null

    // ── Search & Queries ───────────────────────────────────────────────────────
    const searchParams = useSearchParameters({ defaultRangePreset: "Today" })
    const { page, limit, search, ordering, filter } = searchParams

    const { data, isLoading, refetch } = useSalesTransactions({
        page, limit, search, ordering, filter,
    })
    const { filters, orderingOptions } = useSalesTransactionFilters()
    const { deleteTransaction, unvoidTransaction } = useSalesTransactionMutations()
    const { data: viewTransaction } = useSalesTransaction(viewId ? Number(viewId) : undefined)
    const { data: dailySummary } = useDailySalesSummary()

    const { archivedQuery, restoreItem } = useArchive<SalesTransaction>(
        "sales/transactions/",
        "sales-transactions",
        searchParams,
        activeTab === "archived",
    )
    const voidedQuery = useVoidedSalesTransactions({
        ...searchParams,
        enabled: activeTab === "voided",
    })

    // ── Sheets ─────────────────────────────────────────────────────────────────
    const { entityState: viewSheet, openEntity: openView, closeEntity: closeView } =
        useEntitySheet<SalesTransaction>()
    const { entityState: createSheet, openEntity: openCreate, closeEntity: closeCreate } =
        useEntitySheet<SalesTransaction>()
    const { entityState: editSheet, openEntity: openEdit, closeEntity: closeEdit } =
        useEntitySheet<SalesTransaction>()

    const { printRef, handlePrint, printData } = usePrint<SalesTransaction>({
        documentTitle: "Receipt",
    })

    // ── Held sales ─────────────────────────────────────────────────────────────
    const refreshHeldSales = useCallback(() => setHeldSales(getHeldSales()), [])

    useEffect(() => { refreshHeldSales() }, [refreshHeldSales])

    const handleResumeHeld = useCallback(
        (hs: HeldSale) => {
            const sale = resumeHeldSale(hs.id)
            if (!sale) return
            setResumingSale(sale)
            refreshHeldSales()
            setCreateKey((k) => k + 1)
            setTimeout(() => openCreate(), 50)
        },
        [refreshHeldSales, openCreate],
    )

    const handleRemoveHeld = useCallback(
        (id: string) => {
            removeHeldSale(id)
            refreshHeldSales()
        },
        [refreshHeldSales],
    )

    // ── View from URL ──────────────────────────────────────────────────────────
    const hasOpenedView = useRef(false)

    useEffect(() => {
        if (viewId && viewTransaction && !hasOpenedView.current) {
            openView(viewTransaction)
            hasOpenedView.current = true
            const newUrl = new URL(window.location.href)
            newUrl.searchParams.delete("view")
            router.replace(newUrl.pathname + newUrl.search, { scroll: false })
        }
    }, [viewId, viewTransaction, router, openView])

    useEffect(() => {
        if (!viewId) hasOpenedView.current = false
    }, [viewId])

    // ── Google Sheets meta ─────────────────────────────────────────────────────
    useEffect(() => {
        if (!systemSettings?.google_sheets_sync_enabled) {
            setGoogleSheetMeta(null)
            setGoogleSheetMetaLoading(false)
            return
        }

        const fetchSheetMeta = async () => {
            setGoogleSheetMetaLoading(true)
            try {
                const { data } = await api.get("/users/settings/google-sheets-sync/")
                setGoogleSheetMeta({
                    sub_current_gid: data?.sub_current_gid ?? null,
                    sub_latest_gid: data?.sub_latest_gid ?? null,
                    main_current_gid: data?.main_current_gid ?? null,
                    main_latest_gid: data?.main_latest_gid ?? null,
                    current_month_sheets: data?.current_month_sheets ?? {},
                })
            } catch {
                setGoogleSheetMeta(null)
            } finally {
                setGoogleSheetMetaLoading(false)
            }
        }

        void fetchSheetMeta()
    }, [systemSettings?.google_sheets_sync_enabled])

    // ── Derived sheet URLs ─────────────────────────────────────────────────────
    const subSheetId = systemSettings?.google_sheets_spreadsheet_id || ""
    const mainSheetId = systemSettings?.google_sheets_main_spreadsheet_id || ""
    const monthlySheets = googleSheetMeta?.current_month_sheets ?? {}

    const subMonthlySheet = monthlySheets["sub"]
    const mainMonthlySheet = monthlySheets["main"]

    const subSheetId_Final = googleSheetMetaLoading
        ? "" : (subMonthlySheet?.spreadsheet_id || subSheetId)
    const mainSheetId_Final = googleSheetMetaLoading
        ? "" : (mainMonthlySheet?.spreadsheet_id || mainSheetId)

    const subLatestGid = subMonthlySheet?.latest_gid ?? googleSheetMeta?.sub_latest_gid
    const mainLatestGid = mainMonthlySheet?.latest_gid ?? googleSheetMeta?.main_latest_gid

    const subSheetUrl = subSheetId_Final
        ? `https://docs.google.com/spreadsheets/d/${subSheetId_Final}/edit${typeof subLatestGid === "number" ? `#gid=${subLatestGid}` : ""}`
        : ""
    const mainSheetUrl = mainSheetId_Final
        ? `https://docs.google.com/spreadsheets/d/${mainSheetId_Final}/edit${typeof mainLatestGid === "number" ? `#gid=${mainLatestGid}` : ""}`
        : ""

    // ── Role helpers ───────────────────────────────────────────────────────────
    const isAdmin = role === "admin"
    const isManagerOrClerk = role === "manager" || role === "clerk"
    const designatedIsMain = assigned_stall?.stall_type === "main"
    const designatedSheetUrl = designatedIsMain
        ? (mainSheetUrl || subSheetUrl)
        : (subSheetUrl || mainSheetUrl)
    const designatedSheetLabel = designatedIsMain ? "Open Main Stall Sheet" : "Open Sub Stall Sheet"
    const googleSheetsLinksLoading = !!(systemSettings?.google_sheets_sync_enabled && googleSheetMetaLoading)
    const canCreateSale = !(role === "manager" && assigned_stall?.stall_type === "main")

    // ── Table helpers ──────────────────────────────────────────────────────────
    const handleRestore = (tx: SalesTransaction) => { if (tx?.id) restoreItem.mutate(tx.id) }
    const handleUnvoid = (tx: SalesTransaction) => { if (tx?.id) unvoidTransaction.mutate(tx.id) }

    const columns =
        activeTab === "archived"
            ? getSalesTransactionColumns({
                onEdit: () => { },
                onDelete: () => { },
                onRestore: handleRestore,
                role: role ?? "guest",
                mode: "archived",
            })
            : activeTab === "voided"
                ? getSalesTransactionColumns({
                    onEdit: () => { },
                    onDelete: () => { },
                    onView: openView,
                    onUnvoid: handleUnvoid,
                    role: role ?? "guest",
                    mode: "voided",
                })
                : getSalesTransactionColumns({
                    onView: openView,
                    onEdit: openEdit,
                    onPrint: handlePrint,
                    onDelete: (tx) => { if (tx?.id) deleteTransaction.mutate(tx.id) },
                    role: role ?? "guest",
                    mode: "active",
                })

    const tableData =
        activeTab === "archived" ? (archivedQuery.data ?? emptyData)
            : activeTab === "voided" ? (voidedQuery.data ?? emptyData)
                : (data ?? emptyData)

    const currentRefetch =
        activeTab === "archived" ? archivedQuery.refetch
            : activeTab === "voided" ? voidedQuery.refetch
                : refetch

    const currentLoading =
        activeTab === "archived" ? archivedQuery.isLoading
            : activeTab === "voided" ? voidedQuery.isLoading
                : isLoading

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <Wrapper>
            {/* Hidden print component */}
            {printData && (
                <div className="fixed left-[-9999px] top-0">
                    <SalesTransactionPrintContent
                        ref={printRef}
                        entity={printData as SalesTransaction}
                        stall={printData.stall}
                    />
                </div>
            )}

            <PageHeader
                variant="compact"
                icon={ShoppingCart}
                title="Sales Management"
                description="Track sales transactions, manage customer orders, and monitor revenue performance across all stalls."
                breadcrumbs={["Dashboard", "Sales", "Transactions"]}
                actionButton={
                    activeTab === "active" ? (
                        <>
                            {/* Google Sheets links */}
                            {(
                                <>
                                    {isAdmin && (
                                        <>
                                            <SheetLinkButton
                                                href={mainSheetUrl}
                                                label="Open Main Stall Sheet"
                                                loading={googleSheetsLinksLoading}
                                            />
                                            <SheetLinkButton
                                                href={subSheetUrl}
                                                label="Open Sub Stall Sheet"
                                                loading={googleSheetsLinksLoading}
                                            />
                                        </>
                                    )}
                                    {isManagerOrClerk && (
                                        <SheetLinkButton
                                            href={designatedSheetUrl}
                                            label={designatedSheetLabel}
                                            loading={googleSheetsLinksLoading}
                                        />
                                    )}
                                </>
                            )}

                            {/* Held sales popover */}
                            {canCreateSale && heldSales.length > 0 && (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="sm">
                                            <Pause className="size-3.5 mr-1.5" />
                                            Held
                                            <Badge className="ml-1.5 h-5 min-w-5 rounded-full px-1.5 text-[10px]">
                                                {heldSales.length}
                                            </Badge>
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-72 p-2" align="end">
                                        <div className="space-y-1">
                                            {heldSales.map((hs) => (
                                                <HeldSaleRow
                                                    key={hs.id}
                                                    hs={hs}
                                                    onResume={handleResumeHeld}
                                                    onRemove={handleRemoveHeld}
                                                />
                                            ))}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            )}

                            {/* New sale */}
                            {canCreateSale && (
                                <Button onClick={() => openCreate()}>
                                    <Plus className="size-4 mr-2" />
                                    New Sale
                                </Button>
                            )}
                        </>
                    ) : undefined
                }
                onRefresh={currentRefetch}
            />

            {/* Daily Summary */}
            {dailySummary && activeTab === "active" && (
                <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-2 text-sm">
                    <span className="font-medium">Today</span>
                    <span className="text-muted-foreground">
                        {dailySummary.count} sale{dailySummary.count !== 1 ? "s" : ""}
                    </span>
                    <span className="font-semibold text-primary">
                        <AnimatedNumber value={dailySummary.total} prefix="₱" />
                    </span>
                </div>
            )}

            {/* Create Transaction Sheet */}
            {activeTab === "active" && (
                <EntitySheet<SalesTransaction>
                    key={createKey}
                    className="sm:min-w-lg md:min-w-xl lg:min-w-2xl"
                    open={createSheet.open}
                    onClose={() => {
                        closeCreate()
                        setResumingSale(null)
                    }}
                    title={resumingSale ? "Resume Sale" : "New Sale"}
                    description={
                        resumingSale
                            ? `Resuming held sale: ${resumingSale.label}`
                            : "Record a new sales transaction."
                    }
                    withCloseConfirmation
                    renderForm={({ forceClose }) => (
                        <SalesTransactionForm
                            onClose={forceClose}
                            defaultClientId={nextClientId}
                            heldSale={resumingSale}
                            onHeld={refreshHeldSales}
                            onNewSale={(opts) => {
                                setNextClientId(opts?.clientId ?? null)
                                setResumingSale(null)
                                closeCreate()
                                setCreateKey((k) => k + 1)
                                setTimeout(() => openCreate(), 100)
                            }}
                        />
                    )}
                />
            )}

            {/* Edit Transaction Sheet */}
            {activeTab === "active" && (
                <EntitySheet<SalesTransaction>
                    className="sm:min-w-lg md:min-w-xl lg:min-w-2xl"
                    open={editSheet.open}
                    onClose={closeEdit}
                    entity={editSheet.entity}
                    title="Edit Sale"
                    description="Update the sales transaction details."
                    withCloseConfirmation
                    renderForm={({ forceClose, entity }) => (
                        <SalesTransactionForm
                            onClose={forceClose}
                            initialData={entity}
                        />
                    )}
                />
            )}

            {/* View Transaction Sheet */}
            <EntitySheet<SalesTransaction>
                className="sm:min-w-2xl md:min-w-3xl xl:min-w-4xl"
                open={viewSheet.open}
                onClose={closeView}
                entity={viewSheet.entity}
                title="Transaction Details"
                description="View detailed information about this sales transaction."
                renderForm={({ onClose, entity }) =>
                    entity ? (
                        <SalesTransactionDetails entity={entity} onClose={onClose} />
                    ) : null
                }
            />

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
                <TabsList>
                    <TabsTrigger value="active" className="gap-1.5">
                        <List className="size-3.5" />
                        Active
                    </TabsTrigger>
                    <TabsTrigger value="voided" className="gap-1.5">
                        <Ban className="size-3.5" />
                        Voided
                        {(voidedQuery.data?.count ?? 0) > 0 && (
                            <Badge variant="secondary" className="ml-1 h-5 min-w-5 rounded-full px-1.5 text-[10px]">
                                {voidedQuery.data!.count}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="archived" className="gap-1.5">
                        <Archive className="size-3.5" />
                        Archived
                        {(archivedQuery.data?.count ?? 0) > 0 && (
                            <Badge variant="secondary" className="ml-1 h-5 min-w-5 rounded-full px-1.5 text-[10px]">
                                {archivedQuery.data!.count}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Data Table */}
            <DataTable
                enableVirtualization
                title={
                    activeTab === "archived" ? "Archived Transactions"
                        : activeTab === "voided" ? "Voided Transactions"
                            : "Sales Transactions"
                }
                description={
                    activeTab === "archived" ? "Restore or permanently delete archived sales"
                        : activeTab === "voided" ? "View voided transactions or permanently delete them"
                            : "Manage and track all sales transactions"
                }
                isLoading={currentLoading}
                columns={columns}
                data={tableData}
                enableExport={activeTab === "active"}
                exportFileName="sales_transactions"
                defaultRangePreset="Today"
                filters={activeTab === "active" ? filters : undefined}
                orderingOptions={activeTab === "active" ? orderingOptions : undefined}
                onRefresh={currentRefetch}
                emptyIcon={ShoppingCart}
                emptyTitle={
                    activeTab === "archived" ? "No archived transactions"
                        : activeTab === "voided" ? "No voided transactions"
                            : "No sales transactions found"
                }
                emptyDescription={
                    activeTab === "archived" ? "Deleted sales will appear here"
                        : activeTab === "voided" ? "Voided sales will appear here"
                            : "Record your first sale to start tracking revenue"
                }
            />
        </Wrapper>
    )
}
