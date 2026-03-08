"use client"

import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Service, ServicePayment } from "@/lib/constants/interface"
import { useClient } from "@/lib/queries/clients/useClients"
import { useServices } from "@/lib/queries/services/useServices"
import { formatCurrency } from "@/lib/utils/currency"
import { getBadgeVariant } from "@/lib/utils/helpers"
import { format } from "date-fns"
import {
  ArrowLeft,
  Ban,
  Calendar,
  CreditCard,
  MapPin,
  Phone,
  User,
  Wrench,
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"

const serviceTypeLabels: Record<string, string> = {
  repair: "Repair",
  dismantle: "Dismantle",
  inspection: "Inspection",
  cleaning: "Cleaning",
  motor_rewind: "Motor Rewind",
  installation: "Installation",
}

const serviceModeLabels: Record<string, string> = {
  home_service: "Home Service",
  carry_in: "Carry In",
  pull_out: "Pull-Out",
}

const serviceStatusLabels: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
}

const paymentStatusLabels: Record<string, string> = {
  unpaid: "Unpaid",
  partial: "Partially Paid",
  paid: "Paid",
  refunded: "Refunded",
  "n/a": "N/A",
}

const paymentTypeLabels: Record<string, string> = {
  cash: "Cash",
  gcash: "GCash",
  credit: "Credit Card",
  debit: "Debit Card",
  cheque: "Cheque",
}

function formatDate(dateStr: string) {
  try {
    return format(new Date(dateStr), "MMM dd, yyyy")
  } catch {
    return dateStr
  }
}

function formatDateTime(dateStr: string) {
  try {
    return format(new Date(dateStr), "MMM dd, yyyy hh:mm a")
  } catch {
    return dateStr
  }
}

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string

  const { data: client, isLoading: clientLoading } = useClient(clientId)
  const { data: servicesData, isLoading: servicesLoading } = useServices({
    filter: { client: clientId },
    limit: 100,
  })

  const services = servicesData?.results ?? []

  // Collect all payments from all services
  const allPayments: (ServicePayment & {
    service_id: number
    service_type: string
  })[] = []
  services.forEach((service: Service) => {
    service.payments?.forEach((payment) => {
      allPayments.push({
        ...payment,
        service_id: service.id,
        service_type: service.service_type,
      })
    })
  })
  allPayments.sort(
    (a, b) =>
      new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime(),
  )

  // Summary stats
  const totalServices = services.length
  const totalRevenue = services.reduce(
    (sum: number, s: Service) => sum + parseFloat(s.total_revenue || "0"),
    0,
  )
  const totalPaid = services.reduce(
    (sum: number, s: Service) => sum + parseFloat(s.total_paid || "0"),
    0,
  )
  const totalBalance = services.reduce(
    (sum: number, s: Service) => sum + parseFloat(s.balance_due || "0"),
    0,
  )

  if (clientLoading) {
    return (
      <Wrapper>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Wrapper>
    )
  }

  if (!client) {
    return (
      <Wrapper>
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <p className="text-muted-foreground">Client not found</p>
          <Button
            variant="outline"
            onClick={() => router.push("/clients")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Clients
          </Button>
        </div>
      </Wrapper>
    )
  }

  const address = [
    client.address,
    client.barangay,
    client.city,
    client.province,
  ]
    .filter(Boolean)
    .join(", ")

  return (
    <Wrapper>
      <PageHeader
        icon={User}
        title={client.full_name}
        breadcrumbs={["Clients", { label: client.full_name }]}
        actionButton={
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/clients")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

      {/* Client Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">{client.full_name}</h2>
                  {client.is_blocklisted && (
                    <Badge
                      variant="destructive"
                      className="gap-1"
                    >
                      <Ban className="h-3 w-3" />
                      Blocklisted
                    </Badge>
                  )}
                </div>
                {client.contact_number && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    {client.contact_number}
                  </div>
                )}
                {address && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {address}
                  </div>
                )}
                {client.created_at && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    Client since {formatDate(client.created_at)}
                  </div>
                )}
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="text-center px-3 py-2 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Services</p>
                <p className="text-lg font-semibold">{totalServices}</p>
              </div>
              <div className="text-center px-3 py-2 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Revenue</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(totalRevenue)}
                </p>
              </div>
              <div className="text-center px-3 py-2 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Paid</p>
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                  {formatCurrency(totalPaid)}
                </p>
              </div>
              <div className="text-center px-3 py-2 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Balance</p>
                <p
                  className={`text-lg font-semibold ${totalBalance > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}
                >
                  {formatCurrency(totalBalance)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services & Payments Tabs */}
      <Tabs
        defaultValue="services"
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger
            value="services"
            className="gap-2"
          >
            <Wrench className="h-4 w-4" />
            Services ({totalServices})
          </TabsTrigger>
          <TabsTrigger
            value="payments"
            className="gap-2"
          >
            <CreditCard className="h-4 w-4" />
            Payments ({allPayments.length})
          </TabsTrigger>
        </TabsList>

        {/* Services Tab */}
        <TabsContent
          value="services"
          className="space-y-3"
        >
          {servicesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton
                  key={i}
                  className="h-24 w-full"
                />
              ))}
            </div>
          ) : services.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No services found for this client.
              </CardContent>
            </Card>
          ) : (
            services.map((service: Service) => (
              <Card
                key={service.id}
                className="hover:bg-muted/30 transition-colors"
              >
                <CardContent className="py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">#{service.id}</span>
                        <Badge variant="outline">
                          {serviceTypeLabels[service.service_type] ||
                            service.service_type}
                        </Badge>
                        <Badge variant="secondary">
                          {serviceModeLabels[service.service_mode] ||
                            service.service_mode}
                        </Badge>
                        <Badge variant={getBadgeVariant(service.status)}>
                          {serviceStatusLabels[service.status] ||
                            service.status}
                        </Badge>
                      </div>
                      {service.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {service.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{formatDate(service.created_at)}</span>
                        {service.stall && <span>• {service.stall.name}</span>}
                        {service.appliances &&
                          service.appliances.length > 0 && (
                            <span>
                              • {service.appliances.length} appliance
                              {service.appliances.length !== 1 ? "s" : ""}
                            </span>
                          )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {formatCurrency(service.total_revenue)}
                        </p>
                        <Badge
                          variant={getBadgeVariant(service.payment_status)}
                          className="text-xs"
                        >
                          {paymentStatusLabels[service.payment_status] ||
                            service.payment_status}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          router.push(`/services?search=${service.id}`)
                        }
                      >
                        View
                      </Button>
                    </div>
                  </div>

                  {/* Payments for this service */}
                  {service.payments && service.payments.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Payments ({service.payments.length})
                      </p>
                      <div className="space-y-1.5">
                        {service.payments.map((payment) => (
                          <div
                            key={payment.id}
                            className="flex items-center justify-between text-sm px-3 py-1.5 rounded bg-muted/40"
                          >
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="text-xs"
                              >
                                {paymentTypeLabels[payment.payment_type] ||
                                  payment.payment_type}
                              </Badge>
                              <span className="text-muted-foreground text-xs">
                                {formatDateTime(payment.payment_date)}
                              </span>
                            </div>
                            <span className="font-medium">
                              {formatCurrency(payment.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent
          value="payments"
          className="space-y-3"
        >
          {servicesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton
                  key={i}
                  className="h-16 w-full"
                />
              ))}
            </div>
          ) : allPayments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No payments found for this client.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payment History</CardTitle>
                <CardDescription>
                  All payments across {totalServices} service
                  {totalServices !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {allPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-muted/50 transition-colors border"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="text-xs"
                          >
                            {paymentTypeLabels[payment.payment_type] ||
                              payment.payment_type}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Service #{payment.service_id}
                          </span>
                          <Badge
                            variant="secondary"
                            className="text-xs"
                          >
                            {serviceTypeLabels[payment.service_type] ||
                              payment.service_type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatDateTime(payment.payment_date)}</span>
                          {payment.received_by && (
                            <span>
                              • Received by {payment.received_by.first_name}{" "}
                              {payment.received_by.last_name}
                            </span>
                          )}
                        </div>
                        {payment.notes && (
                          <p className="text-xs text-muted-foreground">
                            {payment.notes}
                          </p>
                        )}
                      </div>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(payment.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </Wrapper>
  )
}
