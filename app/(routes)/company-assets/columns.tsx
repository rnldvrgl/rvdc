"use client"

import { DataTableActions } from "@/components/custom/table/components/DataTableActions"
import { Badge } from "@/components/ui/badge"
import { CompanyAsset } from "@/lib/constants/interface"
import { formatCurrency } from "@/lib/utils/helpers"
import { formatDateFull } from "@/lib/utils/helpers/date"
import { ColumnDef } from "@tanstack/react-table"
import { DollarSign, RefreshCw, Trash2 } from "lucide-react"

function getAcquisitionTypeBadge(type: CompanyAsset["acquisition_type"]) {
  if (type === "unclaimed") {
    return (
      <Badge variant="warning" className="text-[11px] px-2 py-0.5">
        Unclaimed
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="text-[11px] px-2 py-0.5">
      Client Sold
    </Badge>
  )
}

function getStatusBadge(status: CompanyAsset["status"]) {
  const map: Record<CompanyAsset["status"], { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" }> = {
    holding: { label: "In Storage", variant: "secondary" },
    sold: { label: "Sold", variant: "success" },
    repurposed: { label: "Repurposed", variant: "outline" },
    disposed: { label: "Disposed", variant: "destructive" },
  }
  const { label, variant } = map[status] ?? { label: status, variant: "secondary" as const }
  return (
    <Badge variant={variant} className="text-[11px] px-2 py-0.5">
      {label}
    </Badge>
  )
}

interface GetCompanyAssetColumnsProps {
  onSell: (asset: CompanyAsset) => void
  onDispose: (asset: CompanyAsset) => void
  onUpdateStatus: (asset: CompanyAsset) => void
}

export function getCompanyAssetColumns({
  onSell,
  onDispose,
  onUpdateStatus,
}: GetCompanyAssetColumnsProps): ColumnDef<CompanyAsset>[] {
  return [
    {
      accessorKey: "service_ref",
      header: "Service Ref",
      cell: ({ getValue }) => (
        <span className="font-mono text-xs">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: "client_name",
      header: "Client",
      cell: ({ getValue }) => {
        const v = getValue() as string | null
        return v ?? <span className="text-muted-foreground">—</span>
      },
    },
    {
      accessorKey: "appliance_description",
      header: "Appliance",
      cell: ({ getValue }) => (
        <span className="text-sm">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: "acquisition_type",
      header: "Type",
      cell: ({ row }) => getAcquisitionTypeBadge(row.original.acquisition_type),
    },
    {
      accessorKey: "acquisition_price",
      header: "Acq. Price",
      cell: ({ getValue }) => {
        const v = getValue() as string | null
        return v ? formatCurrency(v) : <span className="text-muted-foreground">—</span>
      },
    },
    {
      accessorKey: "sale_price",
      header: "Sale Price",
      cell: ({ row }) => {
        const v = row.original.sale_price
        if (!v) return <span className="text-muted-foreground">—</span>
        return <span className="text-sm font-medium text-green-600">{formatCurrency(v)}</span>
      },
    },
    {
      accessorKey: "sold_to_name",
      header: "Sold To",
      cell: ({ getValue }) => {
        const v = getValue() as string | null
        return v || <span className="text-muted-foreground">—</span>
      },
    },
    {
      accessorKey: "acquired_at",
      header: "Acquired",
      cell: ({ getValue }) => formatDateFull(getValue() as string),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => {
        const asset = row.original
        if (asset.status !== "holding") return null

        return (
          <DataTableActions
            items={[
              {
                label: "Sell Asset",
                icon: DollarSign,
                onClick: () => onSell(asset),
              },
              {
                label: "Change Status",
                icon: RefreshCw,
                onClick: () => onUpdateStatus(asset),
              },
              {
                label: "Mark Disposed",
                icon: Trash2,
                onClick: () => onDispose(asset),
                destructive: true as const,
                confirmText: "Mark this asset as disposed? This cannot be undone.",
              },
            ]}
          />
        )
      },
    },
  ]
}
