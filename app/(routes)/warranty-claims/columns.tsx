"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { WarrantyClaim } from "@/lib/constants/interface"
import { ColumnDef } from "@tanstack/react-table"
import { formatDate } from "date-fns"
import {
  Ban,
  CheckCircle,
  Eye,
  MoreHorizontal,
  Pencil,
  Trash2,
  XCircle,
} from "lucide-react"

const statusConfig: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  pending: {
    label: "Pending",
    bg: "bg-yellow-50",
    text: "text-yellow-700",
  },
  approved: {
    label: "Approved",
    bg: "bg-blue-50",
    text: "text-blue-700",
  },
  rejected: {
    label: "Rejected",
    bg: "bg-red-50",
    text: "text-destructive",
  },
  in_progress: {
    label: "In Progress",
    bg: "bg-purple-50",
    text: "text-purple-700",
  },
  completed: {
    label: "Completed",
    bg: "bg-green-50",
    text: "text-success",
  },
  cancelled: {
    label: "Cancelled",
    bg: "bg-gray-50",
    text: "text-gray-500",
  },
}

const claimTypeConfig: Record<string, { label: string; color: string }> = {
  repair: { label: "Repair", color: "text-orange-600" },
  replacement: { label: "Replacement", color: "text-destructive" },
  parts: { label: "Parts", color: "text-blue-600" },
  inspection: { label: "Inspection", color: "text-cyan-600" },
}

interface WarrantyClaimColumnsProps {
  onView?: (claim: WarrantyClaim) => void
  onEdit?: (claim: WarrantyClaim) => void
  onDelete?: (claim: WarrantyClaim) => void
  onApprove?: (claim: WarrantyClaim) => void
  onReject?: (claim: WarrantyClaim) => void
  onCancel?: (claim: WarrantyClaim) => void
  onComplete?: (claim: WarrantyClaim) => void
}

export function getWarrantyClaimColumns({
  onView,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  onCancel,
  onComplete,
}: WarrantyClaimColumnsProps): ColumnDef<WarrantyClaim>[] {
  return [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => (
        <span className="font-mono text-sm text-muted-foreground">
          #{row.original.id}
        </span>
      ),
    },
    {
      accessorKey: "unit_serial_number",
      header: "Unit",
      cell: ({ row }) => {
        const claim = row.original
        return (
          <div className="text-sm">
            <p className="font-medium font-mono">
              {claim.unit_serial_number || `Unit #${claim.unit}`}
            </p>
            {claim.unit_model_name && (
              <p className="text-muted-foreground text-xs">
                {claim.unit_model_name}
              </p>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "client_name",
      header: "Client",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.client_name || "—"}</span>
      ),
    },
    {
      accessorKey: "claim_type",
      header: "Type",
      cell: ({ row }) => {
        const config = claimTypeConfig[row.original.claim_type]
        return (
          <span className={`text-sm font-medium ${config?.color ?? ""}`}>
            {config?.label ?? row.original.claim_type}
          </span>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const config = statusConfig[row.original.status]
        return (
          <span
            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ring-current/10 ${config?.bg ?? ""} ${config?.text ?? ""}`}
          >
            {config?.label ?? row.original.status}
          </span>
        )
      },
    },
    {
      accessorKey: "claim_date",
      header: "Claim Date",
      cell: ({ row }) =>
        row.original.claim_date
          ? formatDate(new Date(row.original.claim_date), "MMM dd, yyyy")
          : "—",
    },
    {
      accessorKey: "warranty_days_remaining_at_claim",
      header: "Warranty Left",
      cell: ({ row }) => {
        const days = row.original.warranty_days_remaining_at_claim
        if (days === undefined || days === null) return "—"
        return (
          <span
            className={`text-sm font-medium ${days > 30 ? "text-success" : days > 0 ? "text-yellow-600" : "text-destructive"}`}
          >
            {days} days
          </span>
        )
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const claim = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onView && (
                <DropdownMenuItem onClick={() => onView(claim)}>
                  <Eye className="size-4 mr-2" />
                  View Details
                </DropdownMenuItem>
              )}
              {onEdit && claim.is_pending && (
                <DropdownMenuItem onClick={() => onEdit(claim)}>
                  <Pencil className="size-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onApprove && claim.is_pending && (
                <DropdownMenuItem onClick={() => onApprove(claim)}>
                  <CheckCircle className="size-4 mr-2 text-success" />
                  Approve
                </DropdownMenuItem>
              )}
              {onReject && claim.is_pending && (
                <DropdownMenuItem onClick={() => onReject(claim)}>
                  <XCircle className="size-4 mr-2 text-destructive" />
                  Reject
                </DropdownMenuItem>
              )}
              {onComplete && claim.is_approved && (
                <DropdownMenuItem onClick={() => onComplete(claim)}>
                  <CheckCircle className="size-4 mr-2 text-success" />
                  Mark Complete
                </DropdownMenuItem>
              )}
              {onCancel && (claim.is_pending || claim.is_approved) && (
                <DropdownMenuItem onClick={() => onCancel(claim)}>
                  <Ban className="size-4 mr-2 text-gray-600" />
                  Cancel
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onDelete && claim.is_pending && (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete(claim)}
                >
                  <Trash2 className="size-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
