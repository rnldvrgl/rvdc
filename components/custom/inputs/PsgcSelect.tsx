import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Control, FieldPath, FieldValues } from 'react-hook-form'

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
        <Select
          onValueChange={onChange}
          value={value}
          disabled={disabled || loading}
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={
                loading ? `Loading ${label.toLowerCase()}...` : placeholder
              }
            />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem
                key={opt.code}
                value={opt.code}
              >
                {opt.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormControl>
      <FormMessage />
    </FormItem>
  )
}
