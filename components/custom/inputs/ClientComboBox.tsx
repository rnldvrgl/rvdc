"use client"

import { ComboBox } from "@/components/custom/inputs/ComboBox"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Client } from "@/lib/constants/types"
import { useClientMutations } from "@/lib/mutations/useClientMutations"
import { useClientChoices } from "@/lib/queries/useChoices"
import { useBarangays, useCities, useProvinces } from "@/lib/queries/usePsgc"
import { getNameByCode, prepareOptions } from "@/lib/utils/helpers"
import { Plus } from "lucide-react"
import { useCallback, useMemo, useState } from "react"

function formatClientLabel(client: Client): string {
  const name = client.full_name
  return client.contact_number ? `${name} (${client.contact_number})` : name
}

interface ClientComboBoxProps {
  value: number | null
  onChange: (value: number | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  /** If true, show only name without contact number */
  nameOnly?: boolean
  /** If true, show quick-create button */
  allowCreate?: boolean
}

export function ClientComboBox({
  value,
  onChange,
  placeholder = "Select client",
  disabled,
  className,
  nameOnly,
  allowCreate,
}: ClientComboBoxProps) {
  const { data: clients, isLoading } = useClientChoices()
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState("")
  const [newContact, setNewContact] = useState("")
  const [newAddress, setNewAddress] = useState("")
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null)
  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [selectedBarangay, setSelectedBarangay] = useState<string | null>(null)
  const { addClient } = useClientMutations()

  const { data: provinces = [] } = useProvinces()
  const { data: cities = [], isLoading: loadingCities } =
    useCities(selectedProvince)
  const { data: barangays = [], isLoading: loadingBarangays } =
    useBarangays(selectedCity)

  const sortedProvinces = useMemo(
    () => prepareOptions(provinces) as { code: string; name: string }[],
    [provinces],
  )
  const sortedCities = useMemo(
    () => prepareOptions(cities) as { code: string; name: string }[],
    [cities],
  )
  const sortedBarangays = useMemo(
    () => prepareOptions(barangays) as { code: string; name: string }[],
    [barangays],
  )

  const options = useMemo(() => {
    if (isLoading)
      return [{ value: "" as string | number, label: "Loading..." }]
    return (
      clients?.map((c) => ({
        value: c.id,
        label: nameOnly ? c.full_name : formatClientLabel(c),
      })) ?? []
    )
  }, [clients, isLoading, nameOnly])

  const resetCreateForm = useCallback(() => {
    setNewName("")
    setNewContact("")
    setNewAddress("")
    setSelectedProvince(null)
    setSelectedCity(null)
    setSelectedBarangay(null)
  }, [])

  const handleQuickCreate = useCallback(() => {
    if (!newName.trim()) return
    const payload = {
      full_name: newName.trim().toUpperCase(),
      contact_number: newContact.trim() || null,
      province: getNameByCode(
        sortedProvinces,
        selectedProvince ?? "",
      ).toUpperCase(),
      city: getNameByCode(sortedCities, selectedCity ?? "").toUpperCase(),
      barangay:
        getNameByCode(sortedBarangays, selectedBarangay ?? "").toUpperCase() ||
        null,
      address: newAddress.trim().toUpperCase() || null,
      is_blocklisted: false,
    }
    addClient.mutate(payload, {
      onSuccess: (res: { data: Client }) => {
        onChange(res.data.id)
        setShowCreate(false)
        resetCreateForm()
      },
    })
  }, [
    newName,
    newContact,
    newAddress,
    selectedProvince,
    selectedCity,
    selectedBarangay,
    sortedProvinces,
    sortedCities,
    sortedBarangays,
    addClient,
    onChange,
    resetCreateForm,
  ])

  return (
    <>
      <div className="flex gap-1.5">
        <div className="flex-1">
          <ComboBox
            options={options}
            value={value}
            onChange={(val) => onChange(val != null ? Number(val) : null)}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            className={className}
          />
        </div>
        {allowCreate && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
            disabled={disabled}
            onClick={() => setShowCreate(true)}
            title="Quick create client"
          >
            <Plus className="size-4" />
          </Button>
        )}
      </div>

      <Dialog
        open={showCreate}
        onOpenChange={(open) => {
          setShowCreate(open)
          if (!open) resetCreateForm()
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Quick Create Client</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Full Name *</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Juan Dela Cruz"
                autoFocus
              />
            </div>
            <div>
              <Label>Contact Number</Label>
              <Input
                value={newContact}
                onChange={(e) => setNewContact(e.target.value)}
                placeholder="09XX XXX XXXX"
                maxLength={13}
              />
            </div>
            <div>
              <Label>Province *</Label>
              <ComboBox
                options={sortedProvinces.map((p) => ({
                  value: p.code,
                  label: p.name,
                }))}
                value={selectedProvince}
                onChange={(val) => {
                  setSelectedProvince(val?.toString() ?? null)
                  setSelectedCity(null)
                  setSelectedBarangay(null)
                }}
                placeholder="Select province"
                searchPlaceholder="Search province..."
              />
            </div>
            <div>
              <Label>City / Municipality *</Label>
              <ComboBox
                options={sortedCities.map((c) => ({
                  value: c.code,
                  label: c.name,
                }))}
                value={selectedCity}
                onChange={(val) => {
                  setSelectedCity(val?.toString() ?? null)
                  setSelectedBarangay(null)
                }}
                placeholder="Select city"
                searchPlaceholder="Search city..."
                disabled={!selectedProvince || loadingCities}
              />
            </div>
            <div>
              <Label>Barangay</Label>
              <ComboBox
                options={sortedBarangays.map((b) => ({
                  value: b.code,
                  label: b.name,
                }))}
                value={selectedBarangay}
                onChange={(val) => setSelectedBarangay(val?.toString() ?? null)}
                placeholder="Select barangay"
                searchPlaceholder="Search barangay..."
                disabled={!selectedCity || loadingBarangays}
              />
            </div>
            <div>
              <Label>Address</Label>
              <Input
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder="Street, Subdivision, etc."
              />
            </div>
            <Button
              className="w-full"
              disabled={
                !newName.trim() ||
                !selectedProvince ||
                !selectedCity ||
                addClient.isPending
              }
              onClick={handleQuickCreate}
            >
              {addClient.isPending ? "Creating..." : "Create Client"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

/** Hook that returns the raw clients list from useClientChoices (for forms that need to look up client details). */
export function useClients() {
  const { data, isLoading } = useClientChoices()
  return { clients: data ?? [], isLoading }
}
