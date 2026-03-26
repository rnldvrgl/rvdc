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
import { cn, getNameByCode, prepareOptions } from "@/lib/utils/helpers"
import { Check, MapPin, Phone, Plus, Search, User, X } from "lucide-react"
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

// ── Card-based Client Select (for service creation wizard) ──────────────

interface ClientCardSelectProps {
  value: number | null
  onChange: (value: number | null) => void
  disabled?: boolean
}

const MAX_VISIBLE = 12

export function ClientCardSelect({
  value,
  onChange,
  disabled,
}: ClientCardSelectProps) {
  const { data: clients = [], isLoading } = useClientChoices()
  const [search, setSearch] = useState("")
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
        setSearch("")
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

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === value),
    [clients, value],
  )

  const filtered = useMemo(() => {
    if (!search.trim()) return clients.slice(0, MAX_VISIBLE)
    const q = search.toLowerCase()
    return clients
      .filter(
        (c) =>
          c.full_name.toLowerCase().includes(q) ||
          c.contact_number?.toLowerCase().includes(q) ||
          c.address?.toLowerCase().includes(q) ||
          c.city?.toLowerCase().includes(q) ||
          c.province?.toLowerCase().includes(q),
      )
      .slice(0, MAX_VISIBLE)
  }, [clients, search])

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground py-2">Loading clients...</p>
    )
  }

  // If a client is selected, show their details with option to change
  if (selectedClient && !search) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(null)}
          className={cn(
            "relative w-full flex items-start gap-3 rounded-xl border border-primary bg-primary/10 p-3 text-left transition-all",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            disabled && "pointer-events-none opacity-50",
          )}
        >
          <div className="flex items-center justify-center size-10 rounded-full bg-primary/10 shrink-0">
            <User className="size-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-primary leading-tight">
              {selectedClient.full_name}
            </p>
            {selectedClient.contact_number && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Phone className="size-3" />
                {selectedClient.contact_number}
              </p>
            )}
            {(selectedClient.city || selectedClient.province) && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                <MapPin className="size-3 shrink-0" />
                {[selectedClient.city, selectedClient.province]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}
          </div>
          <div className="absolute top-1.5 right-1.5 flex items-center justify-center size-5 rounded-full bg-primary">
            <Check className="size-3 text-primary-foreground" />
          </div>
        </button>
        <p className="text-xs text-muted-foreground text-center">
          Click to change client
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients by name, contact, or location..."
            disabled={disabled}
            className="pl-9 pr-9"
            autoFocus
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              title="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Client cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
          {/* Quick create card */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => setShowCreate(true)}
            className={cn(
              "flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed p-3 text-center transition-all",
              "border-border/50 text-muted-foreground hover:bg-muted/60 hover:text-foreground hover:border-border",
              disabled && "pointer-events-none opacity-50",
            )}
          >
            <div className="flex items-center justify-center size-10 rounded-full bg-muted">
              <Plus className="size-5" />
            </div>
            <span className="text-xs font-medium">New Client</span>
          </button>

          {filtered.map((client) => {
            const isSelected = client.id === value

            return (
              <button
                key={client.id}
                type="button"
                disabled={disabled}
                onClick={() => onChange(client.id)}
                className={cn(
                  "relative flex items-start gap-2.5 rounded-xl border p-3 text-left transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isSelected
                    ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/20"
                    : "border-border/50 bg-muted/30 text-foreground hover:bg-muted/60",
                  disabled && "pointer-events-none opacity-50",
                )}
              >
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 flex items-center justify-center size-4 rounded-full bg-primary">
                    <Check className="size-2.5 text-primary-foreground" />
                  </div>
                )}
                <div className="flex items-center justify-center size-8 rounded-full bg-primary/10 shrink-0 mt-0.5">
                  <User className="size-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium leading-tight line-clamp-1">
                    {client.full_name}
                  </p>
                  {client.contact_number && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-0.5">
                      <Phone className="size-2.5 shrink-0" />
                      {client.contact_number}
                    </p>
                  )}
                  {client.city && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-0.5 truncate">
                      <MapPin className="size-2.5 shrink-0" />
                      {client.city}
                    </p>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {filtered.length === 0 && search && (
          <p className="text-sm text-muted-foreground text-center py-2">
            No clients found. Try a different search or create a new client.
          </p>
        )}

        {!search && clients.length > MAX_VISIBLE && (
          <p className="text-xs text-muted-foreground text-center">
            Showing {MAX_VISIBLE} of {clients.length} clients. Search to find
            more.
          </p>
        )}
      </div>

      {/* Quick Create Dialog */}
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
