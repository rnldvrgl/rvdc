"use client"

import { getSalesTransactionColumns } from "@/app/(routes)/sales/columns"
import EntitySheet from "@/components/custom/shared/EntitySheet"
import PageHeader from "@/components/custom/shared/PageHeader"
import { SalesTransactionPrintContent } from "@/components/custom/shared/SalesTransactionPrintContent "
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { DataTable } from "@/components/custom/table/DataTable"
import { SalesTransactionDetails } from "@/components/details/SalesTransactionDetails"
import SalesTransactionForm from "@/components/forms/SalesTransactionForm"
import { Button } from "@/components/ui/button"
import { SalesTransaction } from "@/lib/constants/interface"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useEntitySheet } from "@/lib/hooks/useEntitySheet"
import { usePrint } from "@/lib/hooks/usePrint"
import useSearchParameters from "@/lib/hooks/useSearchParameters"
import { useSalesTransactionMutations } from "@/lib/mutations/useSalesTransactionMutations"
import {
  useSalesTransactionFilters,
  useSalesTransactions,
} from "@/lib/queries/sales/useSalesTransactions"
import { Plus, ShoppingCart } from "lucide-react"

export default function SalesTransactionsPage() {
  const { role } = useCurrentUser()
  const { page, limit, search, ordering, filter } = useSearchParameters()
  const { data, isLoading, refetch } = useSalesTransactions({
    page,
    limit,
    search,
    ordering,
    filter,
  })
  const { filters, orderingOptions } = useSalesTransactionFilters()
  const { deleteTransaction } = useSalesTransactionMutations()

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

  const columns = getSalesTransactionColumns({
    onView: openView,
    onEdit: openEdit,
    onPrint: handlePrint,
    onDelete: (tx) => {
      if (tx?.id) deleteTransaction.mutate(tx.id)
    },
    role: role ?? "guest",
  })

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
          <Button onClick={() => openCreate()}>
            <Plus className="size-4 mr-2" />
            New Sale
          </Button>
        }
      />

      {/* Create Transaction Sheet */}
      <EntitySheet<SalesTransaction>
        className="sm:max-w-3xl md:max-w-4xl lg:max-w-5xl"
        open={createSheet.open}
        onClose={closeCreate}
        title="New Sale"
        description="Record a new sales transaction."
        withCloseConfirmation
        renderForm={({ forceClose }) => (
          <SalesTransactionForm onClose={forceClose} />
        )}
      />

      {/* Edit Transaction Sheet */}
      <EntitySheet<SalesTransaction>
        className="sm:max-w-3xl md:max-w-4xl lg:max-w-5xl"
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

      {/* Main Content */}
      <DataTable
        title="Sales Transactions"
        description="Manage and track all sales transactions"
        isLoading={isLoading}
        columns={columns}
        data={
          data ?? {
            count: 0,
            next: null,
            previous: null,
            results: [],
          }
        }
        defaultRangePreset="Today"
        filters={filters}
        orderingOptions={orderingOptions}
        onRefresh={refetch}
      />
    </Wrapper>
  )
}
