"use client"

import { ComboBox } from "@/components/custom/inputs/ComboBox"
import { Client } from "@/lib/constants/types"
import { useClientChoices } from "@/lib/queries/useChoices"
import { useMemo } from "react"

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
}

export function ClientComboBox({
  value,
  onChange,
  placeholder = "Select client",
  disabled,
  className,
  nameOnly,
}: ClientComboBoxProps) {
  const { data: clients, isLoading } = useClientChoices()

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

  return (
    <ComboBox
      options={options}
      value={value}
      onChange={(val) => onChange(val != null ? Number(val) : null)}
      placeholder={placeholder}
      disabled={disabled || isLoading}
      className={className}
    />
  )
}

/** Hook that returns the raw clients list from useClientChoices (for forms that need to look up client details). */
export function useClients() {
  const { data, isLoading } = useClientChoices()
  return { clients: data ?? [], isLoading }
}
