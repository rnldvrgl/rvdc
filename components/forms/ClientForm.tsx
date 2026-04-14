"use client"

import { usePsgcForm } from "@/lib/hooks/usePsgcForm"
import { useClientMutations } from "@/lib/mutations/useClientMutations"
import { SubmitHandler, useForm } from "react-hook-form"
import { useRef } from "react"

import type { PsgcSelectProps } from "@/components/custom/inputs/PsgcSelect"
import { PsgcSelect } from "@/components/custom/inputs/PsgcSelect"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Client } from "@/lib/constants/types"
import { Loader2 } from "lucide-react"

function LocationField({
  name,
  label,
  value,
  options,
  onChange,
  loading,
  disabled,
  placeholder,
  control,
  required,
}: PsgcSelectProps<FormValues>) {
  return (
    <FormField
      control={control}
      name={name}
      rules={required ? { required: `${label} is required` } : {}}
      render={() => (
        <PsgcSelect
          required={required}
          control={control}
          name={name}
          label={label}
          value={value}
          options={options}
          onChange={onChange}
          placeholder={placeholder}
          loading={loading}
          disabled={disabled}
        />
      )}
    />
  )
}

interface FormValues {
  full_name: string
  contact_number?: string
  address?: string
  province: string
  city: string
  barangay?: string
  is_blocklisted: boolean
}

interface ClientFormProps {
  client?: Client
  onClose: () => void
}

export default function ClientForm({ client, onClose }: ClientFormProps) {
  const submitLockRef = useRef(false)
  const form = useForm<FormValues>({
    defaultValues: {
      full_name: client?.full_name ?? "",
      contact_number: client?.contact_number ?? "",
      address: client?.address ?? "",
      province: client?.province ?? "",
      city: client?.city ?? "",
      barangay: client?.barangay ?? "",
      is_blocklisted: client?.is_blocklisted ?? false,
    },
  })

  const {
    selectedProvince,
    selectedCity,
    selectedBarangay,
    sortedProvinces,
    sortedCities,
    sortedBarangays,
    loadingProvinces,
    loadingCities,
    loadingBarangays,
    provinceName,
    cityName,
    barangayName,
    handleProvinceChange,
    handleCityChange,
    handleBarangayChange,
  } = usePsgcForm<FormValues>({ form, defaultValues: client })

  const { addClient, updateClient } = useClientMutations()
  const isSubmitting = addClient.isPending || updateClient.isPending

  const normalizeContactNumber = (
    contact: string | undefined,
  ): string | null => {
    if (!contact) return null
    let normalized = contact.trim()
    // Convert +639 format to 09 format
    if (normalized.startsWith("+639")) {
      normalized = "09" + normalized.substring(4)
    }
    return normalized || null
  }

  const handleSubmit: SubmitHandler<FormValues> = async (data) => {
    if (submitLockRef.current || isSubmitting) return
    submitLockRef.current = true

    const payload = {
      ...data,
      full_name: data.full_name.toUpperCase(),
      province: provinceName.toUpperCase(),
      city: cityName.toUpperCase(),
      barangay: barangayName.toUpperCase(),
      contact_number: normalizeContactNumber(data.contact_number),
      address: data.address?.trim().toUpperCase() || null,
    }

    try {
      if (client?.id) {
        await updateClient.mutateAsync({ id: client.id, data: payload })
      } else {
        await addClient.mutateAsync(payload)
      }

      onClose()
    } finally {
      submitLockRef.current = false
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6"
      >
        <div className="space-y-4 grid">
          <FormField
            control={form.control}
            name="full_name"
            rules={{ required: "Full name is required" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Client Full Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Juan Dela Cruz"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contact_number"
            rules={{
              validate: (value) => {
                if (!value || !value.trim()) return true // Optional field
                let normalized = value.trim()
                // Convert +639 format to 09 format for validation
                if (normalized.startsWith("+639")) {
                  normalized = "09" + normalized.substring(4)
                }
                // Check if it starts with 09 and has exactly 11 digits
                if (!normalized.startsWith("09")) {
                  return "Contact number must start with 09 or +639"
                }
                if (!/^09\d{9}$/.test(normalized)) {
                  return "Contact number must be exactly 11 digits (09XXXXXXXXX)"
                }
                return true
              },
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Number</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="09XX XXX XXXX or +639XX XXX XXXX"
                    maxLength={13}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Street, Subdivision, etc."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <LocationField
            name="province"
            label="Province"
            required
            value={selectedProvince ?? ""}
            options={sortedProvinces}
            onChange={handleProvinceChange}
            placeholder="Select Province"
            loading={loadingProvinces}
            control={form.control}
          />

          <LocationField
            name="city"
            label="City / Municipality"
            required
            value={selectedCity ?? ""}
            options={sortedCities}
            onChange={handleCityChange}
            placeholder="Select City/Municipality"
            loading={loadingCities}
            disabled={!selectedProvince}
            control={form.control}
          />

          <LocationField
            name="barangay"
            label="Barangay"
            value={selectedBarangay ?? ""}
            options={sortedBarangays}
            onChange={handleBarangayChange}
            placeholder="Select Barangay"
            loading={loadingBarangays}
            disabled={!selectedCity}
            control={form.control}
          />

          <FormField
            control={form.control}
            name="is_blocklisted"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                <FormLabel required>Blocklisted</FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="sticky bottom-0 z-10 -mx-1 mt-4 border-t bg-background/95 px-1 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto sm:min-w-32"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Saving..." : "Save Client"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  )
}
