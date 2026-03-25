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
  const { addClient } = useClientMutations()

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

  const handleQuickCreate = useCallback(() => {
    if (!newName.trim()) return
    const payload = {
      full_name: newName.trim().toUpperCase(),
      contact_number: newContact.trim() || null,
      province: "",
      city: "",
      barangay: null,
      address: null,
      is_blocklisted: false,
    }
    addClient.mutate(payload, {
      onSuccess: (res: { data: Client }) => {
        onChange(res.data.id)
        setShowCreate(false)
        setNewName("")
        setNewContact("")
      },
    })
  }, [newName, newContact, addClient, onChange])

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
        onOpenChange={setShowCreate}
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
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleQuickCreate()
                  }
                }}
              />
            </div>
            <div>
              <Label>Contact Number</Label>
              <Input
                value={newContact}
                onChange={(e) => setNewContact(e.target.value)}
                placeholder="09XX XXX XXXX"
                maxLength={13}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleQuickCreate()
                  }
                }}
              />
            </div>
            <Button
              className="w-full"
              disabled={!newName.trim() || addClient.isPending}
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
