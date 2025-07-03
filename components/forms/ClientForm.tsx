'use client'

import { usePsgcForm } from '@/lib/hooks/usePsgcForm'
import { useClientMutations } from '@/lib/mutations/useClientMutations'
import { SubmitHandler, useForm } from 'react-hook-form'

import type { PsgcSelectProps } from '@/components/custom/inputs/PsgcSelect'
import { PsgcSelect } from '@/components/custom/inputs/PsgcSelect'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Client } from '@/lib/constants/types'

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
}: PsgcSelectProps<FormValues>) {
  return (
    <FormField
      control={control}
      name={name}
      rules={{ required: `${label} is required` }}
      render={() => (
        <PsgcSelect
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
  contact_number: string
  address: string
  province: string
  city: string
  barangay: string
}

interface ClientFormProps {
  client?: Client
  onClose: () => void
}

export default function ClientForm({ client, onClose }: ClientFormProps) {
  const form = useForm<FormValues>({
    defaultValues: {
      full_name: client?.full_name ?? '',
      contact_number: client?.contact_number ?? '',
      address: client?.address ?? '',
      province: '',
      city: '',
      barangay: '',
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

  const handleSubmit: SubmitHandler<FormValues> = (data) => {
    const payload = {
      ...data,
      province: provinceName,
      city: cityName,
      barangay: barangayName,
    }

    if (client?.id) {
      updateClient.mutate(
        { id: client.id, data: payload },
        {
          onSuccess: onClose,
        },
      )
    } else {
      addClient.mutate(payload, {
        onSuccess: onClose,
      })
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6 max-w-md"
      >
        <div className="space-y-4 grid">
          <FormField
            control={form.control}
            name="full_name"
            rules={{ required: 'Full name is required' }}
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
            rules={{ required: 'Contact number is required' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Contact Number</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="09XX XXX XXXX"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            rules={{ required: 'Address is required' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Address</FormLabel>
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
            value={selectedProvince ?? ''}
            options={sortedProvinces}
            onChange={handleProvinceChange}
            placeholder="Select Province"
            loading={loadingProvinces}
            control={form.control}
          />

          <LocationField
            name="city"
            label="City / Municipality"
            value={selectedCity ?? ''}
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
            value={selectedBarangay ?? ''}
            options={sortedBarangays}
            onChange={handleBarangayChange}
            placeholder="Select Barangay"
            loading={loadingBarangays}
            disabled={!selectedCity}
            control={form.control}
          />
        </div>

        <div className="pt-4 flex justify-end">
          <Button type="submit">Save Client</Button>
        </div>
      </form>
    </Form>
  )
}
