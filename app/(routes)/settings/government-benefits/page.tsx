"use client"

import PageHeader from "@/components/custom/shared/PageHeader"
import { GovernmentBenefitForm } from "@/components/forms/GovernmentBenefitForm"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  useBulkToggleGovernmentBenefits,
  useDeleteGovernmentBenefit,
  useToggleGovernmentBenefit,
} from "@/lib/mutations/useGovernmentBenefitMutations"
import { useGovernmentBenefits } from "@/lib/queries/useGovernmentBenefits"
import type { GovernmentBenefit } from "@/lib/schemas/governmentBenefitSchema"
import { format } from "date-fns"
import {
  CheckCircle2,
  Edit,
  History,
  MoreVertical,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export default function GovernmentBenefitsPage() {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingBenefit, setEditingBenefit] =
    useState<GovernmentBenefit | null>(null)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [showInactive, setShowInactive] = useState(false)

  const { data: benefitsData, isLoading } = useGovernmentBenefits({
    filter: {
      is_active: showInactive ? undefined : true,
    },
  })

  const benefits = benefitsData?.results || []
  const toggleMutation = useToggleGovernmentBenefit()
  const deleteMutation = useDeleteGovernmentBenefit()
  const bulkToggleMutation = useBulkToggleGovernmentBenefits()

  const handleToggle = async (benefit: GovernmentBenefit) => {
    try {
      await toggleMutation.mutateAsync({
        id: benefit.id,
        is_active: !benefit.is_active,
      })
      toast.success(
        `Benefit ${benefit.is_active ? "deactivated" : "activated"} successfully`,
      )
    } catch {
      toast.error("Failed to update benefit status")
    }
  }

  const handleDelete = async (id: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this benefit? This action cannot be undone.",
      )
    )
      return

    try {
      await deleteMutation.mutateAsync(id)
      toast.success("Benefit deleted successfully")
    } catch {
      toast.error("Failed to delete benefit")
    }
  }

  const handleBulkToggle = async (is_active: boolean) => {
    if (selectedIds.length === 0) {
      toast.error("Please select benefits to update")
      return
    }

    try {
      await bulkToggleMutation.mutateAsync({ ids: selectedIds, is_active })
      toast.success(
        `${selectedIds.length} benefit(s) ${is_active ? "activated" : "deactivated"}`,
      )
      setSelectedIds([])
    } catch {
      toast.error("Failed to update benefits")
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked && benefits.length > 0) {
      setSelectedIds(benefits.map((b) => b.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id])
    } else {
      setSelectedIds(selectedIds.filter((sid) => sid !== id))
    }
  }

  const getBenefitIcon = (type: string) => {
    switch (type) {
      case "sss":
        return "🏦"
      case "philhealth":
        return "🏥"
      case "pagibig":
        return "🏠"
      case "bir_tax":
        return "📊"
      default:
        return "💼"
    }
  }

  const getMethodBadge = (method: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      fixed: "default",
      percentage: "secondary",
      progressive_tax: "outline",
    }
    return variants[method] || "default"
  }

  const formatRate = (rate: string | null) => {
    if (!rate) return "N/A"
    return `${(Number(rate) * 100).toFixed(2)}%`
  }

  const formatAmount = (amount: string | null) => {
    if (!amount) return "N/A"
    return `₱${Number(amount).toFixed(2)}`
  }

  const groupedBenefits = benefits.reduce(
    (acc, benefit) => {
      if (!acc[benefit.benefit_type]) {
        acc[benefit.benefit_type] = []
      }
      acc[benefit.benefit_type].push(benefit)
      return acc
    },
    {} as Record<string, GovernmentBenefit[]>,
  )

  const renderBenefitRow = (benefit: GovernmentBenefit) => {
    const isSelected = selectedIds.includes(benefit.id)

    return (
      <TableRow
        key={benefit.id}
        className={!benefit.is_active ? "opacity-50" : ""}
      >
        <TableCell>
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) =>
              handleSelectOne(benefit.id, checked as boolean)
            }
          />
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <span className="text-2xl">
              {getBenefitIcon(benefit.benefit_type)}
            </span>
            <div>
              <div className="font-medium">{benefit.name}</div>
              <div className="text-xs text-muted-foreground">
                {benefit.benefit_type.toUpperCase()}
              </div>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant={getMethodBadge(benefit.calculation_method)}>
            {benefit.calculation_method.replace("_", " ")}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="text-sm">
            {benefit.calculation_method === "fixed"
              ? formatAmount(benefit.employee_share_amount)
              : benefit.calculation_method === "percentage"
                ? formatRate(benefit.employee_share_rate)
                : "Tax Bracket"}
          </div>
        </TableCell>
        <TableCell>
          <div className="text-sm">
            {benefit.calculation_method === "fixed"
              ? formatAmount(benefit.employer_share_amount)
              : benefit.calculation_method === "percentage"
                ? formatRate(benefit.employer_share_rate)
                : "N/A"}
          </div>
        </TableCell>
        <TableCell>
          <div className="text-xs text-muted-foreground">
            <div>
              {format(new Date(benefit.effective_start), "MMM dd, yyyy")}
            </div>
            {benefit.effective_end && (
              <div>
                to {format(new Date(benefit.effective_end), "MMM dd, yyyy")}
              </div>
            )}
          </div>
        </TableCell>
        <TableCell>
          {benefit.is_active ? (
            <Badge
              variant="default"
              className="gap-1"
            >
              <CheckCircle2 className="h-3 w-3" />
              Active
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className="gap-1"
            >
              <XCircle className="h-3 w-3" />
              Inactive
            </Badge>
          )}
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setEditingBenefit(benefit)
                  setIsAddOpen(true)
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleToggle(benefit)}>
                {benefit.is_active ? (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDelete(benefit.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Government Benefits"
        description="Manage government-mandated benefits (SSS, PhilHealth, Pag-IBIG, BIR Tax)"
        breadcrumbs={["Settings", "Government Benefits"]}
        actionButton={
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Benefit
          </Button>
        }
      />

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedIds.length} benefit(s) selected
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkToggle(true)}
                >
                  Activate Selected
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkToggle(false)}
                >
                  Deactivate Selected
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedIds([])}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* View Toggle */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={showInactive ? "outline" : "default"}
          onClick={() => setShowInactive(false)}
        >
          Active Only
        </Button>
        <Button
          size="sm"
          variant={showInactive ? "default" : "outline"}
          onClick={() => setShowInactive(true)}
        >
          <History className="h-4 w-4 mr-2" />
          All (Including Historical)
        </Button>
      </div>

      {/* Benefits by Type */}
      <Tabs
        defaultValue="all"
        className="w-full"
      >
        <TabsList>
          <TabsTrigger value="all">All Benefits</TabsTrigger>
          <TabsTrigger value="sss">SSS</TabsTrigger>
          <TabsTrigger value="philhealth">PhilHealth</TabsTrigger>
          <TabsTrigger value="pagibig">Pag-IBIG</TabsTrigger>
          <TabsTrigger value="bir_tax">BIR Tax</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Government Benefits</CardTitle>
              <CardDescription>
                View and manage all government benefit configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : benefits.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No government benefits configured
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            benefits.length > 0 &&
                            selectedIds.length === benefits.length
                          }
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Benefit</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Employee Share</TableHead>
                      <TableHead>Employer Share</TableHead>
                      <TableHead>Effective Period</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {benefits.map((benefit) => renderBenefitRow(benefit))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {(["sss", "philhealth", "pagibig", "bir_tax"] as const).map((type) => (
          <TabsContent
            key={type}
            value={type}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">{getBenefitIcon(type)}</span>
                  {type.toUpperCase()} Benefits
                </CardTitle>
                <CardDescription>
                  {type === "sss" && "Social Security System contributions"}
                  {type === "philhealth" &&
                    "Philippine Health Insurance contributions"}
                  {type === "pagibig" &&
                    "Home Development Mutual Fund contributions"}
                  {type === "bir_tax" &&
                    "Bureau of Internal Revenue withholding tax"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : !groupedBenefits[type] ||
                  groupedBenefits[type].length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No {type.toUpperCase()} benefits configured
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox />
                        </TableHead>
                        <TableHead>Benefit</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Employee Share</TableHead>
                        <TableHead>Employer Share</TableHead>
                        <TableHead>Effective Period</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupedBenefits[type].map((benefit) =>
                        renderBenefitRow(benefit),
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <GovernmentBenefitForm
        open={isAddOpen}
        onOpenChange={(open) => {
          setIsAddOpen(open)
          if (!open) setEditingBenefit(null)
        }}
        benefit={editingBenefit}
      />
    </div>
  )
}
