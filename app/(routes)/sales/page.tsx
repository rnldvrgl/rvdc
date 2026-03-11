"use client"

import { getSalesTransactionColumns } from "@/app/(routes)/sales/columns"
import { ArchiveToggle } from "@/components/custom/shared/ArchiveToggle"
import EntitySheet from "@/components/custom/shared/EntitySheet"
import PageHeader from "@/components/custom/shared/PageHeader"
import { SalesTransactionPrintContent } from "@/components/custom/shared/SalesTransactionPrintContent"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { DataTable } from "@/components/custom/table/DataTable"
import { SalesTransactionDetails } from "@/components/details/SalesTransactionDetails"
import SalesTransactionForm from "@/components/forms/SalesTransactionForm"
import { Button } from "@/components/ui/button"
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
} from "@/lib/queries/sales/useSalesTransactions"
import { Plus, ShoppingCart } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"

const emptyData = {
  count: 0,
  next: null,
  previous: null,
  results: [] as SalesTransaction[],
}

export default function SalesTransactionsPage() {
  const { role } = useCurrentUser()
  const searchParams = useSearchParameters({ defaultRangePreset: "Today" })
  const { page, limit, search, ordering, filter } = searchParams
  const [isArchived, setIsArchived] = useState(false)

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
  const { deleteTransaction } = useSalesTransactionMutations()

  const { archivedQuery, restoreItem, hardDeleteItem } =
    useArchive<SalesTransaction>(
      "sales/transactions/",
      "sales-transactions",
      searchParams,
      isArchived,
    )

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
  const handleHardDelete = (tx: SalesTransaction) => {
    if (tx?.id) hardDeleteItem.mutate(tx.id)
  }

  const columns = isArchived
    ? getSalesTransactionColumns({
        onEdit: () => {},
        onDelete: () => {},
        onRestore: handleRestore,
        onHardDelete: handleHardDelete,
        role: role ?? "guest",
      })
    : getSalesTransactionColumns({
        onView: openView,
        onEdit: openEdit,
        onPrint: handlePrint,
        onDelete: (tx) => {
          if (tx?.id) deleteTransaction.mutate(tx.id)
        },
        role: role ?? "guest",
      })

  const tableData = isArchived
    ? archivedQuery.data || emptyData
    : (data ?? emptyData)

  return (
    <Wrapper>
      {/* Hidden print component */}
      {printData && (
        <div className="hidden">
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
          !isArchived ? (
            <Button onClick={() => openCreate()}>
              <Plus className="size-4 mr-2" />
              New Sale
            </Button>
          ) : undefined
        }
        onRefresh={isArchived ? archivedQuery.refetch : refetch}
      />

      {/* Create Transaction Sheet */}
      {!isArchived && (
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
      {!isArchived && (
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

      <ArchiveToggle
        isArchived={isArchived}
        onToggle={setIsArchived}
        archivedCount={archivedQuery.data?.count}
      />

      {/* Main Content */}
      <DataTable
        title={isArchived ? "Archived Transactions" : "Sales Transactions"}
        description={
          isArchived
            ? "Restore or permanently delete archived sales"
            : "Manage and track all sales transactions"
        }
        isLoading={isArchived ? archivedQuery.isLoading : isLoading}
        columns={columns}
        data={tableData}
        enableExport={!isArchived}
        exportFileName="sales_transactions"
        defaultRangePreset="Today"
        filters={filters}
        orderingOptions={orderingOptions}
        onRefresh={isArchived ? archivedQuery.refetch : refetch}
        emptyIcon={ShoppingCart}
        emptyTitle={
          isArchived
            ? "No archived transactions"
            : "No sales transactions found"
        }
        emptyDescription={
          isArchived
            ? "Deleted sales will appear here"
            : "Record your first sale to start tracking revenue"
        }
      />
    </Wrapper>
  )
}
