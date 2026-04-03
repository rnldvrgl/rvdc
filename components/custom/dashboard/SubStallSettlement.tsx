"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { useSubStallPayable } from "@/lib/queries/useRemittancesRecords"
import { cn, formatCurrency } from "@/lib/utils/helpers"
import { formatDate } from "@/lib/utils/helpers/date"
import { Banknote, Keyboard, Store } from "lucide-react"
import { useEffect, useState } from "react"

export function SubStallSettlement({
  className,
  enableShortcut,
}: {
  className?: string
  enableShortcut?: boolean
}) {
  const { data: subStallPayable, isLoading } = useSubStallPayable()
  const [dialogOpen, setDialogOpen] = useState(false)

  const hasSettlement =
    !!subStallPayable && Number(subStallPayable.total_sales) > 0

  useEffect(() => {
    if (!enableShortcut) return
    function handleKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "S") {
        e.preventDefault()
        setDialogOpen((prev) => !prev)
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [enableShortcut])

  const today = subStallPayable?.date ?? new Date().toISOString().slice(0, 10)
  const stallName = subStallPayable?.sub_stall_name ?? "Sub Stall"

  const HeaderSection = () => (
    <div className="flex items-center justify-between px-4 pt-4">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center size-8 rounded-md bg-primary/10">
          <Store className="size-4 text-primary" />
        </div>
        <div>
          <p className="text-xs font-semibold leading-tight">{stallName}</p>
          <p className="text-xs text-muted-foreground">
            Daily Settlement (Services)
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        {enableShortcut && (
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0.5 gap-1 font-mono cursor-default select-none"
            title="Press Ctrl+Shift+S to open"
          >
            <Keyboard className="size-2.5" />
            ⌃⇧S
          </Badge>
        )}
        <Badge
          variant="outline"
          className="text-xs font-normal px-3 py-1"
        >
          {formatDate(today, "MMM dd, yyyy")}
        </Badge>
      </div>
    </div>
  )

  const SettlementBody = () => (
    <CardContent className="p-0">
      {/* Cash Payable — hero */}
      <div className="relative mx-3 mb-4 rounded-lg overflow-hidden border border-primary/20 shadow-sm">
        <div className="relative px-4 py-3.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[11px] font-medium">Cash to Pay</p>
            <p className="text-2xl font-bold tabular-nums tracking-tight">
              {formatCurrency(subStallPayable!.cash_payable)}
            </p>
          </div>
          <div className="flex items-center justify-center size-10 rounded-full bg-primary/10">
            <Banknote className="size-6 text-primary" />
          </div>
        </div>
      </div>

      {/* Breakdown rows */}
      <div className="px-4 pb-4 space-y-2.5">
        {/* Cash from services */}
        <div className="space-y-1.5 text-sm">
          <div className="flex items-center justify-between py-0.5">
            <span className="text-muted-foreground">Cash (Service Parts)</span>
            <span className="font-semibold tabular-nums">
              {formatCurrency(subStallPayable!.sales_cash)}
            </span>
          </div>
        </div>

        {/* E-payments — received directly by admin */}
        {Number(subStallPayable!.e_payments_total) > 0 && (
          <>
            <Separator />
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                E-Payments (received by admin)
              </p>
              <div className="grid gap-x-4 gap-y-1.5 text-xs">
                {Number(subStallPayable!.sales_gcash) > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">GCash</span>
                    <span className="tabular-nums text-muted-foreground font-medium">
                      {formatCurrency(subStallPayable!.sales_gcash)}
                    </span>
                  </div>
                )}
                {Number(subStallPayable!.sales_credit) > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Credit</span>
                    <span className="tabular-nums text-muted-foreground font-medium">
                      {formatCurrency(subStallPayable!.sales_credit)}
                    </span>
                  </div>
                )}
                {Number(subStallPayable!.sales_debit) > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Debit</span>
                    <span className="tabular-nums text-muted-foreground font-medium">
                      {formatCurrency(subStallPayable!.sales_debit)}
                    </span>
                  </div>
                )}
                {Number(subStallPayable!.sales_cheque) > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Cheque</span>
                    <span className="tabular-nums text-muted-foreground font-medium">
                      {formatCurrency(subStallPayable!.sales_cheque)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Services breakdown */}
        {subStallPayable!.services && subStallPayable!.services.length > 0 && (
          <>
            <Separator />
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Services ({subStallPayable!.services.length})
              </p>
              <div className="max-h-32 overflow-y-auto grid gap-y-1.5 text-xs pr-1">
                {subStallPayable!.services.map((svc) => (
                  <div
                    key={svc.service_id}
                    className="flex items-center justify-between"
                  >
                    <span className="text-muted-foreground">
                      #{svc.service_id}{" "}
                      {svc.client_name && `— ${svc.client_name}`}
                    </span>
                    <span className="tabular-nums font-medium">
                      {formatCurrency(svc.paid_today)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </CardContent>
  )

  const EmptyBody = () => (
    <CardContent className="flex flex-col items-center justify-center py-8 gap-2 text-center">
      <div className="flex items-center justify-center size-10 rounded-full bg-muted">
        <Banknote className="size-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">
        No settlement today
      </p>
      <p className="text-xs text-muted-foreground/70">
        No sub stall service payments recorded
      </p>
    </CardContent>
  )

  if (isLoading) {
    return (
      <Card className={cn("p-0 overflow-hidden h-full", className)}>
        <div className="flex items-center justify-between px-4 pt-4 pb-4">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-md bg-muted animate-pulse" />
            <div className="space-y-1">
              <div className="h-3 w-24 bg-muted rounded animate-pulse" />
              <div className="h-2.5 w-32 bg-muted rounded animate-pulse" />
            </div>
          </div>
          <div className="h-6 w-20 bg-muted rounded animate-pulse" />
        </div>
        <div className="mx-3 mb-4 h-16 rounded-lg bg-muted animate-pulse" />
      </Card>
    )
  }

  return (
    <>
      <Card className={cn("p-0 overflow-hidden h-full", className)}>
      <HeaderSection />
        {hasSettlement ? <SettlementBody /> : <EmptyBody />}
      </Card>

      {enableShortcut && (
        <Dialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        >
          <DialogContent className="max-w-sm p-0 overflow-hidden">
            <DialogHeader className="px-4 pt-4 pb-0">
              <DialogTitle className="text-sm flex items-center gap-2">
                <Store className="size-4 text-primary" />
                Sub Stall Settlement —{" "}
                {formatDate(today, "MMM dd, yyyy")}
              </DialogTitle>
            </DialogHeader>
            {hasSettlement ? <SettlementBody /> : <EmptyBody />}
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
