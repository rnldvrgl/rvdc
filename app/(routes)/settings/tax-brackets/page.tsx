"use client"

import PageHeader from "@/components/custom/shared/PageHeader"
import { TaxBracketForm } from "@/components/forms/TaxBracketForm"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import {
  useDeleteTaxBracket,
  useToggleTaxBracketStatus,
} from "@/lib/mutations/useTaxBracketMutations"
import {
  useTaxBrackets,
  type TaxBracket,
} from "@/lib/queries/useTaxBracketQueries"
import { format } from "date-fns"
import {
  CheckCircle2,
  DollarSign,
  Edit,
  History,
  Loader2,
  MoreVertical,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react"
import { useState } from "react"

export default function TaxBracketsPage() {
  const [showInactive, setShowInactive] = useState(false)
  const [bracketType, setBracketType] = useState<string>("bir")
  const [formOpen, setFormOpen] = useState(false)
  const [selectedBracket, setSelectedBracket] = useState<TaxBracket | null>(
    null,
  )
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [bracketToDelete, setBracketToDelete] = useState<TaxBracket | null>(
    null,
  )

  // Fetch tax brackets (set high limit to get all records without pagination)
  const { data: taxBracketsData, isLoading } = useTaxBrackets({
    limit: 100, // Fetch all tax brackets
    filter: {
      bracket_type: bracketType,
      is_active: showInactive ? undefined : true,
    },
  })

  const taxBrackets = taxBracketsData?.results || []

  const deleteMutation = useDeleteTaxBracket()
  const toggleStatusMutation = useToggleTaxBracketStatus()

  const handleAddClick = () => {
    setSelectedBracket(null)
    setFormOpen(true)
  }

  const handleEditClick = (bracket: TaxBracket) => {
    setSelectedBracket(bracket)
    setFormOpen(true)
  }

  const handleDeleteClick = (bracket: TaxBracket) => {
    setBracketToDelete(bracket)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!bracketToDelete) return
    try {
      await deleteMutation.mutateAsync(bracketToDelete.id)
      setDeleteDialogOpen(false)
      setBracketToDelete(null)
    } catch {
      // Error is handled by mutation
    }
  }

  const handleToggleStatus = async (bracket: TaxBracket) => {
    try {
      await toggleStatusMutation.mutateAsync({
        id: bracket.id,
        is_active: !bracket.is_active,
      })
    } catch {
      // Error is handled by mutation
    }
  }

  const formatAmount = (amount: string | null) => {
    if (!amount) return "No limit"
    return `₱${Number(amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  const formatRate = (rate: string) => {
    return `${(Number(rate) * 100).toFixed(2)}%`
  }

  const getBracketTypeLabel = (type: string) => {
    switch (type) {
      case "bir":
        return "BIR Withholding Tax"
      case "sss":
        return "SSS Contribution"
      case "philhealth":
        return "PhilHealth Contribution"
      case "pagibig":
        return "Pag-IBIG Contribution"
      case "custom":
        return "Custom Tax/Contribution"
      default:
        return type
    }
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Tax Brackets"
        description="Manage tax brackets for BIR, SSS, PhilHealth, Pag-IBIG, and other contributions"
        breadcrumbs={["Settings", "Tax Brackets"]}
        actionButton={
          <Button onClick={handleAddClick}>
            <Plus className="h-4 w-4 mr-2" />
            Add Tax Bracket
          </Button>
        }
      />

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900">
        <CardContent>
          <div className="flex gap-3">
            <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Tax Bracket Types
              </p>
              <p className="text-xs text-blue-800 dark:text-blue-200">
                Different bracket types are used for different calculations: BIR
                for income tax, SSS/PhilHealth/Pag-IBIG for government
                contributions. Select a type below to view and manage its
                brackets.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bracket Type Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Bracket Type</CardTitle>
          <CardDescription>
            Select the type of tax bracket to view and manage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "bir", label: "BIR Withholding Tax" },
              { value: "sss", label: "SSS Contribution" },
              { value: "philhealth", label: "PhilHealth" },
              { value: "pagibig", label: "Pag-IBIG" },
              { value: "custom", label: "Custom" },
            ].map((type) => (
              <Button
                key={type.value}
                size="sm"
                variant={bracketType === type.value ? "default" : "outline"}
                onClick={() => setBracketType(type.value)}
              >
                {type.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

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

      {/* Tax Brackets Table */}
      <Card>
        <CardHeader>
          <CardTitle>{getBracketTypeLabel(bracketType)} Brackets</CardTitle>
          <CardDescription>
            {bracketType === "bir"
              ? "Withholding tax rates based on weekly gross income"
              : "Contribution rates based on income brackets"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : taxBrackets.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                No tax brackets configured
              </p>
              <p className="text-xs text-muted-foreground mb-6">
                No {getBracketTypeLabel(bracketType).toLowerCase()} brackets
                configured.
                <br />
                Add brackets according to current government regulations.
              </p>
              <Button onClick={handleAddClick}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Tax Bracket
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Income Range (Weekly)</TableHead>
                  <TableHead>
                    {bracketType === "bir" ? "Base Tax" : "Base Amount"}
                  </TableHead>
                  <TableHead>
                    {bracketType === "bir" ? "Tax Rate" : "Contribution Rate"}
                  </TableHead>
                  <TableHead>Effective Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {taxBrackets.map((bracket: TaxBracket) => (
                  <TableRow
                    key={bracket.id}
                    className={!bracket.is_active ? "opacity-50" : ""}
                  >
                    <TableCell>
                      <div className="font-medium">
                        {formatAmount(bracket.min_income)}
                        {" - "}
                        {formatAmount(bracket.max_income)}
                      </div>
                    </TableCell>
                    <TableCell>{formatAmount(bracket.base_tax)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {formatRate(bracket.rate)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-muted-foreground">
                        <div>
                          {format(
                            new Date(bracket.effective_start),
                            "MMM dd, yyyy",
                          )}
                        </div>
                        {bracket.effective_end && (
                          <div>
                            to{" "}
                            {format(
                              new Date(bracket.effective_end),
                              "MMM dd, yyyy",
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {bracket.is_active ? (
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
                            onClick={() => handleEditClick(bracket)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(bracket)}
                            disabled={toggleStatusMutation.isPending}
                          >
                            {bracket.is_active ? (
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
                            className="text-destructive"
                            onClick={() => handleDeleteClick(bracket)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Example Tax Calculation */}
      <Card>
        <CardHeader>
          <CardTitle>How Progressive Tax Works</CardTitle>
          <CardDescription>
            Tax is calculated cumulatively across all brackets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-medium mb-2">
                Example: Weekly Gross Income of ₱5,000
              </p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>₱0 - ₱2,500: 0% = ₱0</li>
                <li>₱2,501 - ₱5,000: 20% of ₱2,500 = ₱500</li>
                <li className="font-medium text-foreground">Total Tax: ₱500</li>
              </ol>
            </div>
            <div className="text-xs text-muted-foreground border-t pt-4">
              <p className="mb-2 font-medium">Notes:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  Each bracket type (BIR, SSS, etc.) has its own set of income
                  ranges
                </li>
                <li>
                  Brackets should match current government regulations for each
                  type
                </li>
                <li>Weekly income is used for weekly payroll calculation</li>
                <li>
                  Each bracket&apos;s income range should not overlap with
                  others of the same type
                </li>
                <li>
                  Keep historical brackets for audit purposes (deactivate
                  instead of delete)
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tax Bracket Form Dialog */}
      <TaxBracketForm
        open={formOpen}
        onOpenChange={setFormOpen}
        bracket={selectedBracket}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tax Bracket?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this tax bracket?
              {bracketToDelete && (
                <div className="mt-2 p-2 bg-muted rounded text-sm">
                  <strong>
                    {formatAmount(bracketToDelete.min_income)} -{" "}
                    {formatAmount(bracketToDelete.max_income)}
                  </strong>{" "}
                  at {formatRate(bracketToDelete.rate)}
                </div>
              )}
              This action cannot be undone. Consider deactivating instead of
              deleting for audit purposes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Delete Bracket
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
