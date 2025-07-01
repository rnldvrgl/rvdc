'use client'

import { usePsgcForm } from '@/lib/hooks/usePsgcForm'
import { SubmitHandler, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

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
import { Client } from '@/lib/constants/interface'
import api from '@/lib/utils/api'

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
  is_deleted: boolean
}

interface ClientFormProps {
  client?: Client
  onClose: () => void
}

export default function ClientForm({ client, onClose }: ClientFormProps) {
  const form = useForm<FormValues>({
    defaultValues: {
      full_name: client?.full_name || '',
      contact_number: client?.contact_number || '',
      address: client?.address || '',
      province: '',
      city: '',
      barangay: '',
      is_deleted: false,
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

  const submitData = async (data: FormValues) => {
    data.province = provinceName
    data.city = cityName
    data.barangay = barangayName

    return client
      ? api.patch(`/clients/${client.id}/`, data)
      : api.post('/clients/', data)
  }

  const handleSubmit: SubmitHandler<FormValues> = async (data) => {
    try {
      await submitData(data)
      toast.success(
        client
          ? 'Client updated successfully.'
          : 'Client created successfully.',
      )
      onClose()
    } catch (error: any) {
      toast.error(
        error?.response?.data?.detail ||
          'An error occurred while saving the client.',
      )
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
                <FormLabel>Client Full Name</FormLabel>
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
                <FormLabel>Contact Number</FormLabel>
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
