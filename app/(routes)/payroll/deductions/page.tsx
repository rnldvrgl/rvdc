"use client"

import PageHeader from "@/components/custom/shared/PageHeader"
import { AddCompanyDeductionForm } from "@/components/forms/AddCompanyDeductionForm"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  useDeleteManualDeduction,
  useToggleDeduction,
} from "@/lib/mutations/useManualDeductionMutations"
import { useCompanyDeductions } from "@/lib/queries/useManualDeductions"
import type { ManualDeduction } from "@/lib/schemas/manualDeductionSchema"
import { format } from "date-fns"
import { Edit, Plus, ToggleLeft, ToggleRight, Trash2 } from "lucide-react"
import { useState } from "react"
import toast from "react-hot-toast"

export default function CompanyDeductionsPage() {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingDeduction, setEditingDeduction] =
    useState<ManualDeduction | null>(null)

  const { data: deductions, isLoading } = useCompanyDeductions()
  const toggleMutation = useToggleDeduction()
  const deleteMutation = useDeleteManualDeduction()

  const handleToggle = async (deduction: ManualDeduction) => {
    try {
      await toggleMutation.mutateAsync({
        id: deduction.id,
        is_active: !deduction.is_active,
      })
      toast.success(
        `Deduction ${deduction.is_active ? "deactivated" : "activated"}`,
      )
    } catch {
      toast.error("Failed to update deduction")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this deduction?")) return

    try {
      await deleteMutation.mutateAsync(id)
      toast.success("Deduction deleted")
    } catch {
      toast.error("Failed to delete deduction")
    }
  }

  const recurringDeductions =
    deductions?.filter((d) => d.deduction_type === "recurring_all") || []
  const onetimeDeductions =
    deductions?.filter((d) => d.deduction_type === "onetime_all") || []

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Company-Wide Deductions"
        description="Manage deductions that apply to all employees"
        breadcrumbs={["Payroll", "Company Deductions"]}
        actionButton={
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Deduction
          </Button>
        }
      />

      {/* Recurring Deductions */}
      <Card>
        <CardHeader>
          <CardTitle>Recurring Deductions</CardTitle>
          <CardDescription>
            These deductions are applied to every payroll for all employees
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : recurringDeductions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No recurring deductions
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Effective Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recurringDeductions.map((deduction) => (
                  <TableRow key={deduction.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{deduction.name}</p>
                        {deduction.description && (
                          <p className="text-xs text-muted-foreground">
                            {deduction.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      ₱{Number(deduction.amount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {deduction.effective_date
                        ? format(
                            new Date(deduction.effective_date),
                            "MMM dd, yyyy",
                          )
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {deduction.end_date
                        ? format(new Date(deduction.end_date), "MMM dd, yyyy")
                        : "Ongoing"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={deduction.is_active ? "default" : "secondary"}
                      >
                        {deduction.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggle(deduction)}
                        >
                          {deduction.is_active ? (
                            <ToggleRight className="h-4 w-4" />
                          ) : (
                            <ToggleLeft className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingDeduction(deduction)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(deduction.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* One-Time Deductions */}
      <Card>
        <CardHeader>
          <CardTitle>One-Time Deductions</CardTitle>
          <CardDescription>
            These deductions are applied once to all employees on the specified
            date
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : onetimeDeductions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No one-time deductions
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Application Date</TableHead>
                  <TableHead>Applied On</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {onetimeDeductions.map((deduction) => (
                  <TableRow key={deduction.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{deduction.name}</p>
                        {deduction.description && (
                          <p className="text-xs text-muted-foreground">
                            {deduction.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      ₱{Number(deduction.amount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {deduction.effective_date
                        ? format(
                            new Date(deduction.effective_date),
                            "MMM dd, yyyy",
                          )
                        : "Next Payroll"}
                    </TableCell>
                    <TableCell>
                      {deduction.applied_date ? (
                        <Badge variant="outline">
                          {format(
                            new Date(deduction.applied_date),
                            "MMM dd, yyyy",
                          )}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">
                          Not yet applied
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={deduction.is_active ? "default" : "secondary"}
                      >
                        {deduction.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggle(deduction)}
                          disabled={!!deduction.applied_date}
                        >
                          {deduction.is_active ? (
                            <ToggleRight className="h-4 w-4" />
                          ) : (
                            <ToggleLeft className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingDeduction(deduction)}
                          disabled={!!deduction.applied_date}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(deduction.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AddCompanyDeductionForm
        open={isAddOpen || !!editingDeduction}
        onOpenChange={(open: boolean) => {
          setIsAddOpen(open)
          if (!open) setEditingDeduction(null)
        }}
        deduction={editingDeduction}
      />
    </div>
  )
}
