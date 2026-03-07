"use client"

import { ArchiveToggle } from "@/components/custom/shared/ArchiveToggle"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useArchive } from "@/lib/hooks/useArchive"
import useSearchParameters from "@/lib/hooks/useSearchParameters"
import {
  useDeleteManualDeduction,
  useToggleDeduction,
} from "@/lib/mutations/useManualDeductionMutations"
import {
  useCompanyDeductions,
  useManualDeductions,
} from "@/lib/queries/useManualDeductions"
import { ManualDeduction } from "@/lib/schemas/manualDeductionSchema"
import { format } from "date-fns"
import {
  Archive,
  Edit,
  Plus,
  RotateCcw,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export default function CompanyDeductionsPage() {
  const searchParams = useSearchParameters()
  const [isArchived, setIsArchived] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingDeduction, setEditingDeduction] =
    useState<ManualDeduction | null>(null)
  const [activeTab, setActiveTab] = useState("company")

  const { data: deductions, isLoading } = useCompanyDeductions()
  const { data: employeeDeductionsData, isLoading: employeeLoading } =
    useManualDeductions({
      deduction_type: "per_employee",
      page_size: 100,
    })
  const toggleMutation = useToggleDeduction()
  const deleteMutation = useDeleteManualDeduction()

  const { archivedQuery, restoreItem, hardDeleteItem } =
    useArchive<ManualDeduction>(
      "/payroll/manual-deductions/",
      "manual-deductions",
      searchParams,
      isArchived,
    )

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
    if (
      !confirm(
        "Are you sure you want to archive this deduction? You can restore it from the Archived tab.",
      )
    )
      return

    try {
      await deleteMutation.mutateAsync(id)
      toast.success("Deduction archived")
    } catch {
      toast.error("Failed to archive deduction")
    }
  }

  const recurringDeductions =
    deductions?.filter((d) => d.deduction_type === "recurring_all") || []
  const onetimeDeductions =
    deductions?.filter((d) => d.deduction_type === "onetime_all") || []
  const employeeDeductions = employeeDeductionsData?.results || []

  return (
    <Wrapper>
      <PageHeader
        title="Deductions"
        description="Manage company-wide and per-employee deductions"
        breadcrumbs={["Payroll", "Deductions"]}
        actionButton={
          !isArchived &&
          activeTab === "company" && (
            <Button onClick={() => setIsAddOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Deduction
            </Button>
          )
        }
      />

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList>
          <TabsTrigger value="company">Company-Wide</TabsTrigger>
          <TabsTrigger value="employee">Per Employee</TabsTrigger>
        </TabsList>

        <TabsContent
          value="company"
          className="space-y-4"
        >
          <ArchiveToggle
            isArchived={isArchived}
            onToggle={setIsArchived}
            archivedCount={archivedQuery.data?.count}
          />

          {!isArchived && (
            <>
              {/* Recurring Deductions */}
              <Card>
                <CardHeader>
                  <CardTitle>Recurring Deductions</CardTitle>
                  <CardDescription>
                    These deductions are applied to every payroll for all
                    employees
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
                                ? format(
                                    new Date(deduction.end_date),
                                    "MMM dd, yyyy",
                                  )
                                : "Ongoing"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  deduction.is_active ? "default" : "secondary"
                                }
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
                                  <Archive className="h-4 w-4" />
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
                    These deductions are applied once to all employees on the
                    specified date
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
                                variant={
                                  deduction.is_active ? "default" : "secondary"
                                }
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
                                  <Archive className="h-4 w-4" />
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
            </>
          )}

          {/* Archived Deductions View */}
          {isArchived && (
            <Card>
              <CardHeader>
                <CardTitle>Archived Deductions</CardTitle>
                <CardDescription>
                  {archivedQuery.data?.count || 0} archived deductions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {archivedQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : !archivedQuery.data?.results?.length ? (
                  <p className="text-sm text-muted-foreground">
                    No archived deductions
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {archivedQuery.data.results.map(
                        (deduction: ManualDeduction) => (
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
                              <Badge variant="secondary">
                                {deduction.deduction_type_display ||
                                  deduction.deduction_type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              ₱{Number(deduction.amount).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    restoreItem.mutate(deduction.id)
                                  }
                                  disabled={restoreItem.isPending}
                                >
                                  <RotateCcw className="h-4 w-4 mr-1" />
                                  Restore
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    if (
                                      confirm(
                                        `Permanently delete "${deduction.name}"?`,
                                      )
                                    ) {
                                      hardDeleteItem.mutate(deduction.id)
                                    }
                                  }}
                                  disabled={hardDeleteItem.isPending}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ),
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent
          value="employee"
          className="space-y-4"
        >
          <Card>
            <CardHeader>
              <CardTitle>Per-Employee Deductions</CardTitle>
              <CardDescription>
                Custom deductions assigned to individual employees (one-time and
                recurring). These are added from within each employee&apos;s
                payroll slip.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {employeeLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : employeeDeductions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No per-employee deductions. You can add them from an
                  employee&apos;s payroll slip.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Deduction</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employeeDeductions.map((deduction) => (
                      <TableRow key={deduction.id}>
                        <TableCell>
                          <span className="font-medium">
                            {deduction.employee_detail?.full_name ||
                              `Employee #${deduction.employee}`}
                          </span>
                        </TableCell>
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
                            ? format(
                                new Date(deduction.end_date),
                                "MMM dd, yyyy",
                              )
                            : "One-time"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              deduction.is_active ? "default" : "secondary"
                            }
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
                              onClick={() => handleDelete(deduction.id)}
                            >
                              <Archive className="h-4 w-4" />
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
        </TabsContent>
      </Tabs>
    </Wrapper>
  )
}
