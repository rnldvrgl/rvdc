import { ComboBox } from "@/components/custom/inputs/ComboBox"
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Control, FieldPath, FieldValues } from "react-hook-form"

export interface Option {
  code: string
  name: string
}

export interface PsgcSelectProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  label: string
  value: string
  options: Option[]
  onChange: (code: string) => void
  placeholder: string
  loading?: boolean
  disabled?: boolean
  required?: boolean
}

export function PsgcSelect<T extends FieldValues>({
  label,
  value,
  options,
  onChange,
  placeholder,
  loading,
  disabled,
  required = false,
}: PsgcSelectProps<T>) {
  return (
    <FormItem>
      <FormLabel required={required}>{label}</FormLabel>
      <FormControl>
        <ComboBox
          onChange={(val) => onChange(val?.toString() || "")}
          value={value || null}
          disabled={disabled || loading}
          options={options.map((opt) => ({
            value: opt.code,
            label: opt.name,
          }))}
          placeholder={
            loading ? `Loading ${label.toLowerCase()}...` : placeholder
          }
          searchPlaceholder={`Search ${label.toLowerCase()}...`}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )
}
