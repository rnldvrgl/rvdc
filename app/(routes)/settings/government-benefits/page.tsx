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
import {
  useToggleGovernmentBenefit,
} from "@/lib/mutations/useGovernmentBenefitMutations"
import { useGovernmentBenefits } from "@/lib/queries/useGovernmentBenefits"
import type { GovernmentBenefit } from "@/lib/schemas/governmentBenefitSchema"
import { format } from "date-fns"
import {
  Banknote,
  CheckCircle2,
  Edit,
  History,
  XCircle,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

const BENEFIT_META: Record<string, { icon: string; label: string; description: string }> = {
  sss: {
    icon: "🏦",
    label: "SSS",
    description: "Social Security System — employee & employer contributions for social insurance",
  },
  philhealth: {
    icon: "🏥",
    label: "PhilHealth",
    description: "Philippine Health Insurance — healthcare coverage contributions",
  },
  pagibig: {
    icon: "🏠",
    label: "Pag-IBIG",
    description: "Home Development Mutual Fund — housing and savings fund contributions",
  },
  bir_tax: {
    icon: "📊",
    label: "BIR Tax",
    description: "Bureau of Internal Revenue — withholding tax based on income",
  },
}

export default function GovernmentBenefitsPage() {
  const [editingBenefit, setEditingBenefit] = useState<GovernmentBenefit | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [showInactive, setShowInactive] = useState(false)

  const { data: benefitsData, isLoading } = useGovernmentBenefits({
    filter: {
      is_active: showInactive ? undefined : true,
    },
  })

  const benefits = benefitsData?.results || []
  const toggleMutation = useToggleGovernmentBenefit()

  const handleToggle = async (benefit: GovernmentBenefit) => {
    try {
      await toggleMutation.mutateAsync({
        id: benefit.id,
        is_active: !benefit.is_active,
      })
      toast.success(
        `${benefit.name} ${benefit.is_active ? "deactivated" : "activated"}`,
      )
    } catch {
      toast.error("Failed to update benefit status")
    }
  }

  const handleEdit = (benefit: GovernmentBenefit) => {
    setEditingBenefit(benefit)
    setIsFormOpen(true)
  }

  const formatRate = (rate: string | null) => {
    if (!rate) return "—"
    return `${(Number(rate) * 100).toFixed(2)}%`
  }

  const formatAmount = (amount: string | null) => {
    if (!amount) return "—"
    return `₱${Number(amount).toFixed(2)}`
  }

  // Group benefits by type
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

  const renderShareInfo = (benefit: GovernmentBenefit) => {
    if (benefit.calculation_method === "fixed") {
      return (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Employee Share</p>
            <p className="text-sm font-semibold">
              {formatAmount(benefit.employee_share_amount)}
              {benefit.period_type === "monthly" && (
                <span className="text-xs font-normal text-muted-foreground ml-1">/mo</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Employer Share</p>
            <p className="text-sm font-semibold">
              {formatAmount(benefit.employer_share_amount)}
              {benefit.period_type === "monthly" && (
                <span className="text-xs font-normal text-muted-foreground ml-1">/mo</span>
              )}
            </p>
          </div>
        </div>
      )
    }

    if (benefit.calculation_method === "percentage") {
      return (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Employee Rate</p>
            <p className="text-sm font-semibold">{formatRate(benefit.employee_share_rate)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Employer Rate</p>
            <p className="text-sm font-semibold">{formatRate(benefit.employer_share_rate)}</p>
          </div>
        </div>
      )
    }

    return (
      <p className="text-sm text-muted-foreground">
        Configure using fixed amount or percentage method
      </p>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        icon={Banknote}
        title="Government Benefits"
        description="Fixed government-mandated benefits — SSS, PhilHealth, Pag-IBIG, and BIR Tax"
      />

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

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading benefits...</p>
      ) : benefits.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No government benefits configured yet. Contact your administrator.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(["sss", "philhealth", "pagibig", "bir_tax"] as const).map((type) => {
            const meta = BENEFIT_META[type]
            const typeBenefits = groupedBenefits[type] || []

            return (
              <Card key={type} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{meta.icon}</span>
                      <div>
                        <CardTitle className="text-base">{meta.label}</CardTitle>
                        <CardDescription className="text-xs">{meta.description}</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {typeBenefits.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Not configured</p>
                  ) : (
                    typeBenefits.map((benefit) => (
                      <div
                        key={benefit.id}
                        className={`rounded-lg border p-3 space-y-2 ${!benefit.is_active ? "opacity-50" : ""}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{benefit.name}</span>
                            <Badge
                              variant={benefit.calculation_method === "fixed" ? "secondary" : benefit.calculation_method === "percentage" ? "default" : "outline"}
                              className="text-[10px] px-1.5 py-0"
                            >
                              {benefit.calculation_method.replace("_", " ")}
                            </Badge>
                            {benefit.is_active ? (
                              <Badge variant="default" className="text-[10px] px-1.5 py-0 gap-0.5">
                                <CheckCircle2 className="h-2.5 w-2.5" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-0.5">
                                <XCircle className="h-2.5 w-2.5" />
                                Inactive
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => handleEdit(benefit)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => handleToggle(benefit)}
                            >
                              {benefit.is_active ? (
                                <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                              ) : (
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                              )}
                            </Button>
                          </div>
                        </div>
                        {renderShareInfo(benefit)}
                        <p className="text-[11px] text-muted-foreground">
                          Effective: {format(new Date(benefit.effective_start), "MMM dd, yyyy")}
                          {benefit.effective_end
                            ? ` — ${format(new Date(benefit.effective_end), "MMM dd, yyyy")}`
                            : " — present"}
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <GovernmentBenefitForm
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open)
          if (!open) setEditingBenefit(null)
        }}
        benefit={editingBenefit}
      />
    </div>
  )
}
