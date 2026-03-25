"use client"

import { getSalesTransactionColumns } from "@/app/(routes)/sales/columns"
import EntitySheet from "@/components/custom/shared/EntitySheet"
import PageHeader from "@/components/custom/shared/PageHeader"
import { SalesTransactionPrintContent } from "@/components/custom/shared/SalesTransactionPrintContent"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { DataTable } from "@/components/custom/table/DataTable"
import { SalesTransactionDetails } from "@/components/details/SalesTransactionDetails"
import SalesTransactionForm from "@/components/forms/SalesTransactionForm"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SalesTransaction } from "@/lib/constants/interface"
import { useArchive } from "@/lib/hooks/useArchive"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useEntitySheet } from "@/lib/hooks/useEntitySheet"
import { usePrint } from "@/lib/hooks/usePrint"
import useSearchParameters from "@/lib/hooks/useSearchParameters"
import { useSalesTransactionMutations } from "@/lib/mutations/useSalesTransactionMutations"
import {
  useSalesTransaction,
  useSalesTransactionFilters,
  useSalesTransactions,
  useVoidedSalesTransactions,
} from "@/lib/queries/sales/useSalesTransactions"
import { Archive, Ban, List, Plus, ShoppingCart } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"

type TabValue = "active" | "voided" | "archived"

const emptyData = {
  count: 0,
  next: null,
  previous: null,
  results: [] as SalesTransaction[],
}

export default function SalesTransactionsPage() {
  const { role, assigned_stall } = useCurrentUser()
  const searchParams = useSearchParameters({ defaultRangePreset: "Today" })
  const { page, limit, search, ordering, filter } = searchParams
  const [activeTab, setActiveTab] = useState<TabValue>("active")

  // Next.js router and URL params for handling view parameter from Command Palette
  const router = useRouter()
  const urlSearchParams = useSearchParams()

  // Handle opening detail sheet from Command Palette search
  const viewId = urlSearchParams?.get("view") || null
  const { data: viewTransaction } = useSalesTransaction(
    viewId ? Number(viewId) : undefined,
  )

  const { data, isLoading, refetch } = useSalesTransactions({
    page,
    limit,
    search,
    ordering,
    filter,
  })
  const { filters, orderingOptions } = useSalesTransactionFilters()
  const { deleteTransaction, unvoidTransaction } =
    useSalesTransactionMutations()

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

  // Sheets
  const {
    entityState: viewSheet,
    openEntity: openView,
    closeEntity: closeView,
  } = useEntitySheet<SalesTransaction>()
  const {
    entityState: createSheet,
    openEntity: openCreate,
    closeEntity: closeCreate,
  } = useEntitySheet<SalesTransaction>()
  const {
    entityState: editSheet,
    openEntity: openEdit,
    closeEntity: closeEdit,
  } = useEntitySheet<SalesTransaction>()

  const { printRef, handlePrint, printData } = usePrint<SalesTransaction>({
    documentTitle: "Receipt",
  })

  // Track if we've already opened the view to avoid re-opening
  const hasOpenedView = useRef(false)

  useEffect(() => {
    if (viewId && viewTransaction && !hasOpenedView.current) {
      // Open the detail sheet with the fetched transaction
      openView(viewTransaction)
      hasOpenedView.current = true

      // Clear the view parameter from URL
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete("view")
      router.replace(newUrl.pathname + newUrl.search, { scroll: false })
    }
  }, [viewId, viewTransaction, router])

  // Reset the flag when viewId changes or is cleared
  useEffect(() => {
    if (!viewId) {
      hasOpenedView.current = false
    }
  }, [viewId])

  const handleRestore = (tx: SalesTransaction) => {
    if (tx?.id) restoreItem.mutate(tx.id)
  }
  const handleUnvoid = (tx: SalesTransaction) => {
    if (tx?.id) unvoidTransaction.mutate(tx.id)
  }

  const columns =
    activeTab === "archived"
      ? getSalesTransactionColumns({
          onEdit: () => {},
          onDelete: () => {},
          onRestore: handleRestore,
          role: role ?? "guest",
          mode: "archived",
        })
      : activeTab === "voided"
        ? getSalesTransactionColumns({
            onEdit: () => {},
            onDelete: () => {},
            onView: openView,
            onUnvoid: handleUnvoid,
            role: role ?? "guest",
            mode: "voided",
          })
        : getSalesTransactionColumns({
            onView: openView,
            onEdit: openEdit,
            onPrint: handlePrint,
            onDelete: (tx) => {
              if (tx?.id) deleteTransaction.mutate(tx.id)
            },
            role: role ?? "guest",
            mode: "active",
          })

  const tableData =
    activeTab === "archived"
      ? archivedQuery.data || emptyData
      : activeTab === "voided"
        ? voidedQuery.data || emptyData
        : (data ?? emptyData)

  const currentRefetch =
    activeTab === "archived"
      ? archivedQuery.refetch
      : activeTab === "voided"
        ? voidedQuery.refetch
        : refetch

  const currentLoading =
    activeTab === "archived"
      ? archivedQuery.isLoading
      : activeTab === "voided"
        ? voidedQuery.isLoading
        : isLoading

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
        icon={ShoppingCart}
        title="Sales Management"
        description="Track sales transactions, manage customer orders, and monitor revenue performance across all stalls."
        breadcrumbs={["Dashboard", "Sales", "Transactions"]}
        actionButton={
          activeTab === "active" &&
          !(role === "manager" && assigned_stall?.stall_type === "main") ? (
            <Button onClick={() => openCreate()}>
              <Plus className="size-4 mr-2" />
              New Sale
            </Button>
          ) : undefined
        }
        onRefresh={currentRefetch}
      />

      {/* Create Transaction Sheet */}
      {activeTab === "active" && (
        <EntitySheet<SalesTransaction>
          className="sm:min-w-lg md:min-w-xl lg:min-w-2xl"
          open={createSheet.open}
          onClose={closeCreate}
          title="New Sale"
          description="Record a new sales transaction."
          withCloseConfirmation
          renderForm={({ forceClose }) => (
            <SalesTransactionForm onClose={forceClose} />
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
            <SalesTransactionDetails
              entity={entity}
              onClose={onClose}
            />
          ) : null
        }
      />

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabValue)}
      >
        <TabsList>
          <TabsTrigger
            value="active"
            className="gap-1.5"
          >
            <List className="size-3.5" />
            Active
          </TabsTrigger>
          <TabsTrigger
            value="voided"
            className="gap-1.5"
          >
            <Ban className="size-3.5" />
            Voided
            {voidedQuery.data?.count !== undefined &&
              voidedQuery.data.count > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 h-5 min-w-5 rounded-full px-1.5 text-[10px]"
                >
                  {voidedQuery.data.count}
                </Badge>
              )}
          </TabsTrigger>
          <TabsTrigger
            value="archived"
            className="gap-1.5"
          >
            <Archive className="size-3.5" />
            Archived
            {archivedQuery.data?.count !== undefined &&
              archivedQuery.data.count > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 h-5 min-w-5 rounded-full px-1.5 text-[10px]"
                >
                  {archivedQuery.data.count}
                </Badge>
              )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Main Content */}
      <DataTable
        enableVirtualization
        title={
          activeTab === "archived"
            ? "Archived Transactions"
            : activeTab === "voided"
              ? "Voided Transactions"
              : "Sales Transactions"
        }
        description={
          activeTab === "archived"
            ? "Restore or permanently delete archived sales"
            : activeTab === "voided"
              ? "View voided transactions or permanently delete them"
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
          activeTab === "archived"
            ? "No archived transactions"
            : activeTab === "voided"
              ? "No voided transactions"
              : "No sales transactions found"
        }
        emptyDescription={
          activeTab === "archived"
            ? "Deleted sales will appear here"
            : activeTab === "voided"
              ? "Voided sales will appear here"
              : "Record your first sale to start tracking revenue"
        }
      />
    </Wrapper>
  )
}
