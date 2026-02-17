"use client"

import { getAirconModelColumns } from "@/app/(routes)/aircons/models/columns"
import EntitySheet from "@/components/custom/shared/EntitySheet"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { DataTable } from "@/components/custom/table/DataTable"
import AirconModelForm from "@/components/forms/installations/AirconModelForm"
import { Button } from "@/components/ui/button"
import { AirconModels } from "@/lib/constants/interface"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useEntitySheet } from "@/lib/hooks/useEntitySheet"
import useSearchParameters from "@/lib/hooks/useSearchParameters"
import { useAirconModelMutations } from "@/lib/mutations/installations/useAirconModelMutations"
import {
  useAirconModelFilters,
  useAirconModels,
} from "@/lib/queries/useAircons"
import {
  Monitor,
  Pencil,
  Percent,
  Plus,
  ShieldCheck,
  ThermometerSun,
  Wrench,
  Zap,
} from "lucide-react"

export default function AirconModelsPage() {
  const { isAdmin, canManage } = useCurrentUser()
  const { page, limit, search, ordering, filter } = useSearchParameters()
  const { filters, orderingOptions } = useAirconModelFilters()
  const { deleteModel } = useAirconModelMutations()
  const { data, isLoading, refetch } = useAirconModels({
    page,
    limit,
    search,
    ordering,
    filter,
  })

  // Edit sheet state
  const {
    entityState: { open: editOpen, entity },
    openEntity: openEditSheet,
    closeEntity: closeEditSheet,
  } = useEntitySheet<AirconModels>()

  // Add sheet state
  const {
    entityState: { open: addOpen },
    openEntity: openAddSheet,
    closeEntity: closeAddSheet,
  } = useEntitySheet<AirconModels>()

  // View sheet state
  const {
    entityState: { open: viewOpen, entity: viewEntity },
    openEntity: openViewSheet,
    closeEntity: closeViewSheet,
  } = useEntitySheet<AirconModels>()

  // Discount sheet state
  const {
    entityState: { open: discountOpen, entity: discountEntity },
    openEntity: openDiscountSheet,
    closeEntity: closeDiscountSheet,
  } = useEntitySheet<AirconModels>()

  // Delete handler
  const handleDelete = (model: AirconModels) => {
    if (model.id !== undefined) {
      deleteModel.mutate(model.id)
    }
  }

  const handleView = (model: AirconModels) => {
    openViewSheet(model)
  }

  const columns = getAirconModelColumns({
    onEdit: openEditSheet,
    onDelete: handleDelete,
    onCustomAction: openDiscountSheet,
    onView: handleView,
  })

  return (
    <Wrapper>
      <PageHeader
        icon={Monitor}
        title="Aircon Models"
        description="Manage air conditioning unit models, specifications, pricing, and promotional discounts for your installation services."
        breadcrumbs={["Dashboard", "Aircons", "Models"]}
        actionButton={
          canManage && (
            <Button onClick={() => openAddSheet()}>
              <Plus className="size-4 mr-2" />
              Add Model
            </Button>
          )
        }
      />

      {/* View Model Sheet */}
      <EntitySheet<AirconModels>
        open={viewOpen}
        onClose={closeViewSheet}
        entity={viewEntity}
        title="Model Details"
        description="View detailed information about this aircon model."
        renderForm={({ onClose, entity }) =>
          entity ? (
            <div className="space-y-5 p-6">
              {/* Model Header */}
              <div className="rounded-lg border bg-linear-to-br from-slate-50 to-blue-50 p-5">
                <div className="flex items-center gap-4">
                  <div className="flex size-14 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                    <Monitor className="size-7" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">
                      {entity.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {entity.brand?.name || "Unknown Brand"}
                    </p>
                  </div>
                  {entity.is_inverter && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      <Zap className="size-3" /> Inverter
                    </span>
                  )}
                </div>
              </div>

              {/* Specifications */}
              <div className="rounded-lg border p-4">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  <Wrench className="size-3.5" /> Specifications
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      Type
                    </label>
                    <p className="text-sm font-semibold capitalize mt-0.5">
                      {entity.aircon_type || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      Horsepower
                    </label>
                    <p className="text-sm font-semibold mt-0.5">
                      <span className="inline-flex items-center gap-1">
                        <ThermometerSun className="size-3.5 text-orange-500" />
                        {entity.horsepower || "N/A"} HP
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      Inverter
                    </label>
                    <p className="text-sm font-semibold mt-0.5">
                      {entity.is_inverter ? "Yes" : "No"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="rounded-lg border p-4">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Pricing
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      Retail Price
                    </label>
                    <p className="text-lg font-bold mt-0.5">
                      \u20B1
                      {parseFloat(entity.retail_price || "0").toLocaleString(
                        "en-US",
                        { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                      )}
                    </p>
                  </div>
                  {entity.has_discount &&
                  entity.discount_percentage &&
                  parseFloat(entity.discount_percentage) > 0 ? (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        Promo Price
                      </label>
                      <div className="mt-0.5">
                        <p className="text-lg font-bold text-green-600">
                          \u20B1
                          {(
                            parseFloat(entity.retail_price || "0") *
                            (1 - parseFloat(entity.discount_percentage) / 100)
                          ).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <Percent className="size-3" />
                          {entity.discount_percentage}% OFF
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        Discount
                      </label>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        No discount
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Warranty Configuration */}
              <div className="rounded-lg border p-4">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  <ShieldCheck className="size-3.5" /> Warranty Configuration
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg border bg-blue-50/50 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="size-2 rounded-full bg-blue-500" />
                      <span className="text-xs font-semibold text-blue-900">
                        Parts Warranty
                      </span>
                    </div>
                    <p className="text-lg font-bold text-blue-700">
                      {entity.parts_warranty_months ?? 60} months
                    </p>
                    <p className="text-xs text-blue-600">
                      (
                      {entity.parts_warranty_years ??
                        ((entity.parts_warranty_months ?? 60) / 12).toFixed(
                          1,
                        )}{" "}
                      {(entity.parts_warranty_years ??
                        (entity.parts_warranty_months ?? 60) / 12) === 1
                        ? "year"
                        : "years"}
                      )
                    </p>
                  </div>
                  <div className="rounded-lg border bg-amber-50/50 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="size-2 rounded-full bg-amber-500" />
                      <span className="text-xs font-semibold text-amber-900">
                        Labor Warranty
                      </span>
                    </div>
                    <p className="text-lg font-bold text-amber-700">
                      {entity.labor_warranty_months ?? 12} months
                    </p>
                    <p className="text-xs text-amber-600">
                      (
                      {entity.labor_warranty_years ??
                        ((entity.labor_warranty_months ?? 12) / 12).toFixed(
                          1,
                        )}{" "}
                      {(entity.labor_warranty_years ??
                        (entity.labor_warranty_months ?? 12) / 12) === 1
                        ? "year"
                        : "years"}
                      )
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={onClose}
                >
                  Close
                </Button>
                {canManage && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        onClose()
                        openDiscountSheet(entity)
                      }}
                    >
                      <Percent className="size-4 mr-2" />
                      {entity.discount_percentage ? "Update" : "Add"} Discount
                    </Button>
                    <Button
                      onClick={() => {
                        onClose()
                        openEditSheet(entity)
                      }}
                    >
                      <Pencil className="size-4 mr-2" />
                      Edit Model
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : null
        }
      />

      {/* Edit Aircon Model Sheet */}
      <EntitySheet<AirconModels>
        className="sm:min-w-2xl md:minx-w-3xl xl:min-w-4xl"
        open={editOpen}
        onClose={closeEditSheet}
        entity={entity}
        title="Edit Aircon Model"
        description="Update the aircon model details below."
        withCloseConfirmation
        renderForm={({ forceClose, entity }) => (
          <AirconModelForm
            onClose={forceClose}
            initialData={entity}
          />
        )}
      />

      {/* Add Aircon Model Sheet */}
      <EntitySheet<AirconModels>
        className="sm:min-w-2xl md:minx-w-3xl xl:min-w-4xl"
        open={addOpen}
        onClose={closeAddSheet}
        title="Add Aircon Model"
        description="Fill out the form below to add a new aircon model."
        withCloseConfirmation
        renderForm={({ forceClose }) => (
          <AirconModelForm onClose={forceClose} />
        )}
      />

      {/* Discount Sheet */}
      <EntitySheet<AirconModels>
        open={discountOpen}
        onClose={closeDiscountSheet}
        entity={discountEntity}
        title={
          discountEntity?.discount_percentage
            ? "Update Discount"
            : "Add Discount"
        }
        description={
          discountEntity?.discount_percentage
            ? "Update the promotional discount for this model."
            : "Apply a promotional discount to this model."
        }
        withCloseConfirmation
        renderForm={({ forceClose, entity }) => (
          <AirconModelForm
            onClose={forceClose}
            initialData={entity}
            isAddingDiscount
          />
        )}
      />

      {/* Main Content */}
      <DataTable
        title="Aircon Models"
        description="Manage air conditioning unit specifications and pricing"
        isLoading={isLoading}
        columns={columns}
        data={
          data || {
            count: 0,
            next: null,
            previous: null,
            results: [],
          }
        }
        filters={filters}
        orderingOptions={orderingOptions}
        onRefresh={refetch}
      />
    </Wrapper>
  )
}
