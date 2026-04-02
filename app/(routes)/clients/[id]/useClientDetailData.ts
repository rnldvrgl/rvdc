import type { AirconUnits, SalesTransaction, Service } from "@/lib/constants/interface"
import { useArchive } from "@/lib/hooks/useArchive"
import { useServiceMutations } from "@/lib/mutations/services/useServiceMutations"
import { useClient } from "@/lib/queries/clients/useClients"
import { useSalesTransactions } from "@/lib/queries/sales/useSalesTransactions"
import { useServices } from "@/lib/queries/services/useServices"
import { useAirconUnits } from "@/lib/queries/useAircons"
import { useMemo, useState } from "react"
import type { PaymentRowType } from "./columns"

export function useClientDetailData(clientId: string) {
  const { data: client, isLoading: clientLoading } = useClient(clientId)
  const {
    data: servicesData,
    isLoading: servicesLoading,
    refetch: refetchServices,
  } = useServices({ filter: { client: clientId }, limit: 500 })

  const { data: salesData, isLoading: salesLoading } = useSalesTransactions({
    filter: { client: clientId },
    limit: 500,
  })

  const { data: unitsData, isLoading: unitsLoading } = useAirconUnits({
    filter: { client: clientId },
    limit: 500,
  })

  // ── Archive ──────────────────────────────────────────────────────────────
  const [isArchivedView, setIsArchivedView] = useState(false)
  const { deleteService } = useServiceMutations()
  const { archivedQuery, restoreItem } = useArchive<Service>(
    "services/services/",
    "services",
    { filter: { client: clientId } },
    isArchivedView,
  )

  // ── Derived data ─────────────────────────────────────────────────────────
  const services: Service[] = useMemo(() => servicesData?.results ?? [], [servicesData])
  const salesTransactions: SalesTransaction[] = useMemo(() => salesData?.results ?? [], [salesData])
  const airconUnits: AirconUnits[] = useMemo(() => unitsData?.results ?? [], [unitsData])
  const archivedServices: Service[] = archivedQuery.data?.results ?? []

  const serviceRelatedTransactionIds = useMemo(
    () =>
      new Set(
        services
          .flatMap((s) => [s.related_transaction, s.related_sub_transaction])
          .filter((id): id is number => id != null),
      ),
    [services],
  )

  const standaloneSales = useMemo(
    () => salesTransactions.filter((t) => !serviceRelatedTransactionIds.has(t.id)),
    [salesTransactions, serviceRelatedTransactionIds],
  )

  const allPayments: PaymentRowType[] = useMemo(() => {
    const list: PaymentRowType[] = []
    services.forEach((service) => {
      service.payments?.forEach((payment) => {
        list.push({
          ...payment,
          service_id: service.id,
          service_type: service.service_type,
          received_by_name: (payment as unknown as Record<string, unknown>)
            .received_by_name as string | undefined,
        })
      })
    })
    return list.sort(
      (a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime(),
    )
  }, [services])

  // ── Summary stats ────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const serviceRevenue = services.reduce((s, x) => s + parseFloat(x.total_revenue || "0"), 0)
    const serviceMainRev = services.reduce((s, x) => s + parseFloat(x.main_stall_revenue || "0"), 0)
    const serviceSubRev = services.reduce((s, x) => s + parseFloat(x.sub_stall_revenue || "0"), 0)
    const servicePaid = services.reduce((s, x) => s + parseFloat(x.total_paid || "0"), 0)
    const serviceBalance = services.reduce((s, x) => s + parseFloat(x.balance_due || "0"), 0)

    const salesRevenue = standaloneSales.reduce((s, t) => s + parseFloat(String(t.computed_total || "0")), 0)
    const salesPaid = standaloneSales.reduce((s, t) => {
      return s + (t.payments?.reduce((ps, p) => ps + parseFloat(String(p.amount || "0")), 0) || 0)
    }, 0)
    const salesBalance = salesRevenue - salesPaid
    const salesMainRev = standaloneSales
      .filter((t) => t.stall?.name?.toLowerCase().includes("main"))
      .reduce((s, t) => s + parseFloat(String(t.computed_total || "0")), 0)
    const salesSubRev = standaloneSales
      .filter((t) => t.stall?.name?.toLowerCase().includes("sub"))
      .reduce((s, t) => s + parseFloat(String(t.computed_total || "0")), 0)

    return {
      totalServices: services.length,
      totalRevenue: serviceRevenue + salesRevenue,
      totalPaid: servicePaid + salesPaid,
      totalBalance: serviceBalance + salesBalance,
      totalMainRev: serviceMainRev + salesMainRev,
      totalSubRev: serviceSubRev + salesSubRev,
    }
  }, [services, standaloneSales])

  return {
    client,
    clientLoading,
    services,
    servicesLoading,
    refetchServices,
    salesTransactions,
    salesLoading,
    airconUnits,
    unitsLoading,
    allPayments,
    serviceRelatedTransactionIds,
    isArchivedView,
    setIsArchivedView,
    archivedServices,
    archivedQuery,
    restoreItem,
    deleteService,
    stats,
  }
}
