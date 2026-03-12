"use client"

import { ClientComboBox } from "@/components/custom/inputs/ClientComboBox"
import { DateTimePicker } from "@/components/custom/inputs/DateTimePicker"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { AirconUnits } from "@/lib/constants/interface"
import { useWarrantyClaimMutations } from "@/lib/mutations/installations/useWarrantyClaimMutations"
import { useAirconUnits } from "@/lib/queries/useAircons"
import { useTechnicianChoices } from "@/lib/queries/useChoices"
import { formatDate } from "date-fns"
import { CheckCircle2, Info, SprayCan } from "lucide-react"
import { useState } from "react"

export default function FreeCleaningTab() {
  const { data: techniciansData } = useTechnicianChoices()
  const { redeemFreeCleaningBatch } = useWarrantyClaimMutations()
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null)
  const [selectedUnits, setSelectedUnits] = useState<number[]>([])
  const [selectedTechnicians, setSelectedTechnicians] = useState<number[]>([])
  const [scheduledDateTime, setScheduledDateTime] = useState<Date | undefined>(
    undefined,
  )
  const [isRedeeming, setIsRedeeming] = useState(false)

  // Fetch units filtered by client (sale or reservation) when a client is selected
  const { data: unitsData, isLoading: unitsLoading } = useAirconUnits({
    limit: 100,
    filter: selectedClientId ? { client: selectedClientId } : undefined,
    enabled: !!selectedClientId,
  })

  // Filter eligible units for the selected client
  const eligibleUnits =
    unitsData?.results?.filter(
      (u: AirconUnits) =>
        u.free_cleaning_redeemed === false && u.unit_status === "Installed",
    ) ?? []

  // Redeemed units - only for selected client (from same query)
  const redeemedUnits =
    unitsData?.results?.filter(
      (u: AirconUnits) => u.free_cleaning_redeemed === true,
    ) ?? []

  const toggleUnit = (unitId: number) => {
    setSelectedUnits((prev) =>
      prev.includes(unitId)
        ? prev.filter((id) => id !== unitId)
        : [...prev, unitId],
    )
  }

  const toggleAll = () => {
    if (selectedUnits.length === eligibleUnits.length) {
      setSelectedUnits([])
    } else {
      setSelectedUnits(eligibleUnits.map((u: AirconUnits) => u.id))
    }
  }

  const handleRedeem = async () => {
    if (selectedUnits.length === 0 || !selectedClientId) return
    setIsRedeeming(true)

    try {
      // Format date/time from the DateTimePicker value
      let scheduled_date: string | undefined
      let scheduled_time: string | undefined

      if (scheduledDateTime) {
        scheduled_date = formatDate(scheduledDateTime, "yyyy-MM-dd")
        scheduled_time = formatDate(scheduledDateTime, "HH:mm:ss")
      }

      await redeemFreeCleaningBatch.mutateAsync({
        client_id: selectedClientId,
        unit_ids: selectedUnits,
        scheduled_date,
        scheduled_time,
        technician_ids:
          selectedTechnicians.length > 0 ? selectedTechnicians : undefined,
      })

      // Reset form
      setSelectedUnits([])
      setSelectedTechnicians([])
      setScheduledDateTime(undefined)
      setSelectedClientId(null)
    } finally {
      setIsRedeeming(false)
    }
  }

  const handleClientChange = (clientId: number | string | null) => {
    setSelectedClientId(clientId ? Number(clientId) : null)
    setSelectedUnits([]) // Reset unit selection when client changes
  }

  return (
    <div className="space-y-6">
      {/* Client Selection & Scheduling */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SprayCan className="size-5" />
            Redeem Free Cleaning
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Select a client, choose their eligible units, and set a schedule for
            the cleaning service.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Client</Label>
            <ClientComboBox
              value={selectedClientId}
              onChange={handleClientChange}
              placeholder="Select a client..."
              nameOnly
            />
          </div>
          <div>
            <Label>
              Schedule Date & Time <span className="text-destructive">*</span>
            </Label>
            <DateTimePicker
              value={scheduledDateTime}
              onChange={setScheduledDateTime}
              placeholder="Pick schedule date and time..."
              disablePastDates
            />
          </div>
          <div>
            <Label>Assign Technician(s)</Label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {techniciansData?.map((tech) => {
                const isSelected = selectedTechnicians.includes(tech.id)
                return (
                  <button
                    key={tech.id}
                    type="button"
                    onClick={() =>
                      setSelectedTechnicians((prev) =>
                        isSelected
                          ? prev.filter((id) => id !== tech.id)
                          : [...prev, tech.id],
                      )
                    }
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="size-3" />}
                    {tech.full_name}
                  </button>
                )
              })}
              {(!techniciansData || techniciansData.length === 0) && (
                <p className="text-xs text-muted-foreground">
                  No technicians available
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Eligible Units */}
      {selectedClientId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Eligible Units ({eligibleUnits.length})</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Units under warranty with unredeemed free cleaning
                </p>
              </div>
              <div className="flex items-center gap-3">
                {eligibleUnits.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleAll}
                  >
                    {selectedUnits.length === eligibleUnits.length
                      ? "Deselect All"
                      : "Select All"}
                  </Button>
                )}
                <Button
                  onClick={handleRedeem}
                  disabled={
                    selectedUnits.length === 0 ||
                    isRedeeming ||
                    !scheduledDateTime
                  }
                  size="sm"
                >
                  <SprayCan className="size-4 mr-2" />
                  Redeem ({selectedUnits.length})
                </Button>
              </div>
            </div>
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
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {eligibleUnits.map((unit: AirconUnits) => (
                  <div
                    key={unit.id}
                    className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                      selectedUnits.includes(unit.id)
                        ? "border-primary"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => toggleUnit(unit.id)}
                  >
                    <Checkbox
                      checked={selectedUnits.includes(unit.id)}
                      onCheckedChange={() => toggleUnit(unit.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium font-mono truncate">
                        {unit.serial_number}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {unit.model?.brand?.name} {unit.model?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="success">Eligible</Badge>
                      {unit.warranty_days_left !== undefined &&
                        unit.warranty_days_left > 0 && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {unit.warranty_days_left}d warranty left
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

      {/* Redeemed Units - only show when client is selected */}
      {selectedClientId && redeemedUnits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground">
              Already Redeemed ({redeemedUnits.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {redeemedUnits.map((unit: AirconUnits) => (
                <div
                  key={unit.id}
                  className="flex items-center gap-3 rounded-lg border p-3 opacity-60"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium font-mono truncate">
                      {unit.serial_number}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {unit.model?.brand?.name} {unit.model?.name}
                      {unit.client_name && (
                        <span className="ml-2">• {unit.client_name}</span>
                      )}
                    </p>
                  </div>
                  <Badge variant="secondary">Redeemed</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
