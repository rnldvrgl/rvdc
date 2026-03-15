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
import { formatCurrency } from "@/lib/utils/helpers"
import { format } from "date-fns"
import {
  AirVentIcon,
  ArrowDown,
  ArrowUp,
  History,
  Minus,
  Monitor,
  Pencil,
  Plus,
  Settings2,
  Shield,
  Tag,
  Zap,
} from "lucide-react"

export default function AirconModelsPage() {
  const { canManage } = useCurrentUser()
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

  const {
    entityState: { open: editOpen, entity },
    openEntity: openEditSheet,
    closeEntity: closeEditSheet,
  } = useEntitySheet<AirconModels>()

  const {
    entityState: { open: addOpen },
    openEntity: openAddSheet,
    closeEntity: closeAddSheet,
  } = useEntitySheet<AirconModels>()

  const {
    entityState: { open: viewOpen, entity: viewEntity },
    openEntity: openViewSheet,
    closeEntity: closeViewSheet,
  } = useEntitySheet<AirconModels>()

  const {
    entityState: { open: promoOpen, entity: promoEntity },
    openEntity: openPromoSheet,
    closeEntity: closePromoSheet,
  } = useEntitySheet<AirconModels>()

  const handleDelete = (model: AirconModels) => {
    if (model.id !== undefined) deleteModel.mutate(model.id)
  }

  const handleView = (model: AirconModels) => openViewSheet(model)

  const columns = getAirconModelColumns({
    onEdit: openEditSheet,
    onDelete: handleDelete,
    onCustomAction: openPromoSheet,
    onView: handleView,
  })

  return (
    <Wrapper>
      {/* ── Page Header ── */}
      <PageHeader
        icon={Monitor}
        title="Aircon Models"
        description="Manage air conditioning unit models, specifications, pricing, and promotional prices for your installation services."
        breadcrumbs={["Dashboard", "Aircons", "Models"]}
        actionButton={
          canManage && (
            <Button onClick={() => openAddSheet()}>
              <Plus className="size-4" />
              Add Model
            </Button>
          )
        }
      />

      {/* ── View Model Sheet ── */}
      <EntitySheet<AirconModels>
        className="sm:min-w-lg md:min-w-xl xl:min-w-2xl"
        open={viewOpen}
        onClose={closeViewSheet}
        entity={viewEntity}
        title="Model Details"
        description="View detailed information about this aircon model."
        renderForm={({ onClose, entity }) =>
          entity ? (
            <div className="space-y-5 pb-2 h-full">
              {/* ── Hero card ── */}
              <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-slate-900 to-slate-800 p-5 text-white shadow-xl">
                <div className="relative flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-sky-500/20 ring-1 ring-sky-400/30">
                      <AirVentIcon className="size-7 text-sky-300" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold tracking-tight">
                        {entity.name}
                      </h3>
                      <p className="text-sm text-slate-400 mt-0.5">
                        {entity.brand?.name || "Unknown Brand"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {entity.is_inverter && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/30">
                        <Zap className="size-3" /> Inverter
                      </span>
                    )}
                    {entity.has_discount && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-300 ring-1 ring-rose-400/30">
                        <Tag className="size-3" /> Promo
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Specs ── */}
              <section>
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
                  <Settings2 className="size-3.5" />
                  Specifications
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      label: "Type",
                      value: entity.aircon_type
                        ? entity.aircon_type
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (c) => c.toUpperCase())
                        : "N/A",
                    },
                    {
                      label: "Horsepower",
                      value: entity.horsepower
                        ? `${entity.horsepower} HP`
                        : "N/A",
                    },
                    {
                      label: "Category",
                      value: entity.is_inverter ? "Inverter" : "Non-Inverter",
                    },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-700/60 dark:bg-slate-800/50"
                    >
                      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                        {label}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* ── Pricing ── */}
              <section>
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
                  <Tag className="size-3.5" />
                  Pricing
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-700/60 dark:bg-slate-800/50">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                      Retail Price
                    </p>
                    <p
                      className={`mt-1 text-lg font-bold ${entity.has_discount ? "text-muted-foreground line-through" : "text-slate-800 dark:text-slate-100"}`}
                    >
                      {formatCurrency(entity.retail_price)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-700/60 dark:bg-slate-800/50">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                      Cost Price
                    </p>
                    <p className="mt-1 text-lg font-bold text-slate-800 dark:text-slate-100">
                      {entity.cost_price
                        ? formatCurrency(entity.cost_price)
                        : "Not set"}
                    </p>
                  </div>

                  {entity.has_discount &&
                  entity.promo_price &&
                  parseFloat(entity.promo_price) > 0 ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-700/40 dark:bg-emerald-900/20 ">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-success">
                        Promo Price
                      </p>
                      <p className="mt-1 text-lg font-bold text-success dark:text-emerald-300">
                        {formatCurrency(entity.promo_price)}
                      </p>
                      <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-success dark:bg-emerald-800/40 dark:text-emerald-300">
                        Save{" "}
                        {formatCurrency(
                          (
                            parseFloat(entity.retail_price || "0") -
                            parseFloat(entity.promo_price)
                          ).toFixed(2),
                        )}
                      </span>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-700/60 dark:bg-slate-800/50">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                        Promo Price
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        No promo set
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* ── Warranty ── */}
              <section>
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
                  <Shield className="size-3.5" />
                  Warranty
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-sky-200 bg-linear-to-br from-sky-50 to-blue-50 px-4 py-4 dark:border-sky-700/40 dark:from-sky-900/20 dark:to-blue-900/20">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-sky-600 dark:text-sky-400">
                      Parts
                    </p>
                    <p className="mt-1 text-2xl font-black text-sky-700 dark:text-sky-300">
                      {entity.parts_warranty_months ?? 12}
                      <span className="ml-1 text-sm font-medium">mo.</span>
                    </p>
                    <p className="text-xs text-sky-500 dark:text-sky-400">
                      ≈ {((entity.parts_warranty_months ?? 12) / 12).toFixed(1)}{" "}
                      yr
                    </p>
                  </div>
                  <div className="rounded-xl border border-purple-200 bg-linear-to-br from-purple-50 to-violet-50 px-4 py-4 dark:border-purple-700/40 dark:from-purple-900/20 dark:to-violet-900/20">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-purple-600 dark:text-purple-400">
                      Compressor
                    </p>
                    <p className="mt-1 text-2xl font-black text-purple-700 dark:text-purple-300">
                      {entity.compressor_warranty_months ?? 60}
                      <span className="ml-1 text-sm font-medium">mo.</span>
                    </p>
                    <p className="text-xs text-purple-500 dark:text-purple-400">
                      ≈{" "}
                      {((entity.compressor_warranty_months ?? 60) / 12).toFixed(
                        1,
                      )}{" "}
                      yr
                    </p>
                  </div>
                  <div className="rounded-xl border border-amber-200 bg-linear-to-br from-amber-50 to-orange-50 px-4 py-4 dark:border-amber-700/40 dark:from-amber-900/20 dark:to-orange-900/20">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-warning">
                      Labor
                    </p>
                    <p className="mt-1 text-2xl font-black text-amber-700 dark:text-amber-300">
                      {entity.labor_warranty_months ?? 12}
                      <span className="ml-1 text-sm font-medium">mo.</span>
                    </p>
                    <p className="text-xs text-amber-500 dark:text-amber-400">
                      ≈ {((entity.labor_warranty_months ?? 12) / 12).toFixed(1)}{" "}
                      yr
                    </p>
                  </div>
                </div>
              </section>

              {/* ── Price History ── */}
              {entity.price_history && entity.price_history.length > 0 && (
                <section>
                  <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
                    <History className="size-3.5" />
                    Price History
                    <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                      {entity.price_history.length}
                    </span>
                  </div>

                  <div className="rounded-xl border-2 border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
                    <div className="relative space-y-0 pl-6">
                      {/* vertical rule */}
                      <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-700" />

                      {entity.price_history.slice(0, 8).map((entry) => {
                        const changeAmount = entry.price_change_amount
                          ? parseFloat(entry.price_change_amount)
                          : null
                        const isUp = changeAmount !== null && changeAmount > 0
                        const isDown = changeAmount !== null && changeAmount < 0
                        const isInitial = entry.change_type === "initial"

                        return (
                          <div
                            key={entry.id}
                            className="relative flex gap-3.5 pb-4 last:pb-0"
                          >
                            {/* dot */}
                            <div
                              className={`absolute -left-[15px] top-1.5 z-10 size-2 rounded-full ring-4 ring-white shadow-md dark:ring-slate-800 ${
                                isInitial
                                  ? "bg-sky-500"
                                  : isUp
                                    ? "bg-rose-500"
                                    : isDown
                                      ? "bg-emerald-500"
                                      : "bg-amber-500"
                              }`}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-base font-bold text-slate-900 dark:text-slate-50">
                                  {formatCurrency(entry.retail_price)}
                                </span>
                                {entry.promo_price &&
                                  parseFloat(entry.promo_price) > 0 &&
                                  parseFloat(entry.promo_price) <
                                    parseFloat(entry.retail_price) && (
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                      (promo:{" "}
                                      {formatCurrency(entry.promo_price)} →{" "}
                                      {formatCurrency(entry.effective_price)})
                                    </span>
                                  )}
                                {changeAmount !== null && !isInitial && (
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm ${
                                      isUp
                                        ? "bg-rose-100 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:ring-rose-800"
                                        : "bg-emerald-100 text-success ring-1 ring-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:ring-emerald-800"
                                    }`}
                                  >
                                    {isUp ? (
                                      <ArrowUp className="h-3 w-3" />
                                    ) : isDown ? (
                                      <ArrowDown className="h-3 w-3" />
                                    ) : (
                                      <Minus className="h-3 w-3" />
                                    )}
                                    {formatCurrency(Math.abs(changeAmount))}
                                  </span>
                                )}
                                {isInitial && (
                                  <span className="inline-flex items-center rounded-full border-2 border-slate-300 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                    Initial
                                  </span>
                                )}
                              </div>
                              <p className="mt-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                                {format(
                                  new Date(entry.changed_at),
                                  "MMM d, yyyy h:mm a",
                                )}
                                {entry.notes && (
                                  <span className="text-slate-400 dark:text-slate-500">
                                    {" · "}
                                    {entry.notes}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </section>
              )}

              {/* ── Footer Actions ── */}
              <div className="flex justify-end gap-2 border-t pt-4">
                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="rounded-full px-5"
                >
                  Close
                </Button>
                {canManage && (
                  <>
                    <Button
                      onClick={() => {
                        onClose()
                        openEditSheet(entity)
                      }}
                    >
                      <Pencil className="size-3.5" />
                      Edit Model
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : null
        }
      />

      {/* ── Edit Sheet ── */}
      <EntitySheet<AirconModels>
        className="sm:min-w-lg md:min-w-xl xl:min-w-2xl"
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

      {/* ── Add Sheet ── */}
      <EntitySheet<AirconModels>
        className="sm:min-w-lg md:min-w-xl xl:min-w-2xl"
        open={addOpen}
        onClose={closeAddSheet}
        title="Add Aircon Model"
        description="Fill out the form below to add a new aircon model."
        withCloseConfirmation
        renderForm={({ forceClose }) => (
          <AirconModelForm onClose={forceClose} />
        )}
      />

      {/* ── Promo Sheet ── */}
      <EntitySheet<AirconModels>
        open={promoOpen}
        onClose={closePromoSheet}
        entity={promoEntity}
        title={
          promoEntity?.promo_price ? "Update Promo Price" : "Set Promo Price"
        }
        description={
          promoEntity?.promo_price
            ? "Update the promotional price for this model."
            : "Set a promotional price for this model."
        }
        withCloseConfirmation
        renderForm={({ forceClose, entity }) => (
          <AirconModelForm
            onClose={forceClose}
            initialData={entity}
            isAddingPromo
          />
        )}
      />

      {/* ── Data Table ── */}
      <DataTable
        title="Aircon Models"
        description="Manage air conditioning unit specifications and pricing"
        isLoading={isLoading}
        columns={columns}
        data={data || { count: 0, next: null, previous: null, results: [] }}
        filters={filters}
        orderingOptions={orderingOptions}
        onRefresh={refetch}
        emptyIcon={Zap}
        emptyTitle="No aircon models found"
        emptyDescription="Add your first model to define specifications and pricing"
      />
    </Wrapper>
  )
}
