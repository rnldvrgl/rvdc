"use client"

import { ComboBox } from "@/components/custom/inputs/ComboBox"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AirconUnits, ClaimType } from "@/lib/constants/interface"
import { Client } from "@/lib/constants/types"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useWarrantyClaimMutations } from "@/lib/mutations/installations/useWarrantyClaimMutations"
import { useAirconUnits } from "@/lib/queries/useAircons"
import { useClientChoices } from "@/lib/queries/useChoices"
import { Info, ShieldCheck } from "lucide-react"
import { useState } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import ExistingClaimsList from "./ExistingClaimsList"

export default function WarrantyClaimsTab() {
  const { canManage } = useCurrentUser()
  const { addWarrantyClaim } = useWarrantyClaimMutations()
  const { data: clientsData } = useClientChoices()
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null)
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null)

  // Fetch units for selected client
  const { data: unitsData, isLoading: unitsLoading } = useAirconUnits({
    limit: 100,
    filter: selectedClientId ? { client: selectedClientId } : undefined,
    enabled: !!selectedClientId,
  })

  // Eligible units: sold or installed, under warranty
  const eligibleUnits =
    unitsData?.results?.filter(
      (u: AirconUnits) =>
        (u.is_sold || u.unit_status === "Installed") &&
        u.warranty_status === "Under Warranty",
    ) ?? []

  const clientOptions =
    clientsData?.map((c: Client) => ({
      value: c.id,
      label: c.full_name,
    })) ?? []

  const claimTypeOptions = [
    { value: "repair" as const, label: "Repair" },
    { value: "replacement" as const, label: "Replacement" },
    { value: "parts" as const, label: "Parts Replacement" },
    { value: "inspection" as const, label: "Inspection" },
  ]

  const form = useForm<{
    unit_id: number | null
    claim_type: ClaimType
    issue_description: string
    customer_notes: string
  }>({
    defaultValues: {
      unit_id: null,
      claim_type: "repair",
      issue_description: "",
      customer_notes: "",
    },
  })

  const handleClientChange = (clientId: number | string | null) => {
    setSelectedClientId(clientId ? Number(clientId) : null)
    setSelectedUnitId(null)
    form.setValue("unit_id", null)
  }

  const handleUnitSelect = (unitId: number) => {
    setSelectedUnitId(unitId)
    form.setValue("unit_id", unitId)
  }

  const handleSubmit: SubmitHandler<{
    unit_id: number | null
    claim_type: ClaimType
    issue_description: string
    customer_notes: string
  }> = (data) => {
    const unitId = selectedUnitId ?? data.unit_id
    if (!unitId) return

    addWarrantyClaim.mutate(
      {
        unit_id: unitId,
        claim_type: data.claim_type,
        issue_description: data.issue_description,
        customer_notes: data.customer_notes,
      },
      {
        onSuccess: () => {
          form.reset()
          setSelectedUnitId(null)
          setSelectedClientId(null)
        },
      },
    )
  }

  return (
    <div className="space-y-6">
      {/* New Claim Form - Inline */}
      {canManage && (
        <>
          {/* Step 1: Client Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="size-5" />
                New Warranty Claim
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Select a client, choose a unit under warranty, and describe the
                issue.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Client</Label>
                <ComboBox
                  value={selectedClientId}
                  onChange={handleClientChange}
                  options={clientOptions}
                  placeholder="Select a client..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Unit Selection */}
          {selectedClientId && (
            <Card>
              <CardHeader>
                <CardTitle>Select Unit ({eligibleUnits.length})</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Units under warranty eligible for a claim
                </p>
              </CardHeader>
              <CardContent>
                {unitsLoading ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    Loading units...
                  </p>
                ) : eligibleUnits.length === 0 ? (
                  <div className="text-center py-8">
                    <Info className="size-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No eligible units found for this client.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {eligibleUnits.map((unit: AirconUnits) => (
                      <div
                        key={unit.id}
                        className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                          selectedUnitId === unit.id
                            ? "border-primary"
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() => handleUnitSelect(unit.id)}
                      >
                        <div
                          className={`size-4 rounded-full border-2 flex items-center justify-center ${
                            selectedUnitId === unit.id
                              ? "border-primary"
                              : "border-gray-300"
                          }`}
                        >
                          {selectedUnitId === unit.id && (
                            <div className="size-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium font-mono truncate">
                            {unit.serial_number}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {unit.model?.brand?.name} {unit.model?.name}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                            Under Warranty
                          </span>
                          {unit.warranty_days_left !== undefined &&
                            unit.warranty_days_left > 0 && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {unit.warranty_days_left}d left
                              </p>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 3: Claim Details */}
          {selectedUnitId && (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Claim Details</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <FormField
                      control={form.control}
                      name="claim_type"
                      rules={{ required: "Please select a claim type" }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel required>Claim Type</FormLabel>
                          <FormControl>
                            <ComboBox
                              value={field.value}
                              onChange={(val) =>
                                field.onChange((val as ClaimType) ?? "repair")
                              }
                              options={claimTypeOptions}
                              placeholder="Select claim type..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="issue_description"
                      rules={{ required: "Issue description is required" }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel required>Issue Description</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Describe the issue or defect..."
                              rows={4}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customer_notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customer Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Additional notes from the customer (optional)"
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={!selectedUnitId}
                  >
                    <ShieldCheck className="size-4 mr-2" />
                    Submit Claim
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </>
      )}

      {/* Existing Claims List */}
      <ExistingClaimsList />
    </div>
  )
}
