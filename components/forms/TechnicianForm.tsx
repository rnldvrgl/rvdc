'use client'

import { usePsgcForm } from '@/lib/hooks/usePsgcForm'
import { SubmitHandler, useForm } from 'react-hook-form'

import ImageUpload from '@/components/custom/inputs/ImageUpload'
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
import type { Technician } from '@/lib/constants/types'
import useFileUpload from '@/lib/hooks/useFileUpload'
import { useTechnicianMutations } from '@/lib/mutations/useTechnicianMutations'

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
}: PsgcSelectProps<Technician>) {
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

interface TechnicianProps {
  technician?: Technician
  onClose: () => void
}

export default function TechnicianForm({
  technician,
  onClose,
}: TechnicianProps) {
  const form = useForm<Technician>({
    defaultValues: {
      first_name: technician?.first_name ?? '',
      last_name: technician?.last_name ?? '',
      contact_number: technician?.contact_number ?? '',
      address: technician?.address ?? '',
      province: '',
      city: '',
      barangay: '',
      sss_number: technician?.sss_number ?? '',
      tin_number: technician?.tin_number ?? '',
      philhealth_number: technician?.philhealth_number ?? '',
      basic_salary: technician?.basic_salary ?? 0,
      profile_image: '',
    },
  })

  const upload = useFileUpload({
    form,
    fieldName: 'profile_image',
    initialImage: technician?.profile_image,
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
  } = usePsgcForm<Technician>({ form, defaultValues: technician })

  const { addTechnician, updateTechnician } = useTechnicianMutations()

  const handleSubmit: SubmitHandler<Technician> = (data) => {
    const payload = {
      ...data,
      province: provinceName,
      city: cityName,
      barangay: barangayName,
      role: 'technician',
    }

    if (technician?.id) {
      updateTechnician.mutate(
        { id: technician.id, data: payload },
        {
          onSuccess: onClose,
        },
      )
    } else {
      addTechnician.mutate(payload, {
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
            name="profile_image"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Profile Image</FormLabel>
                <FormControl>
                  <ImageUpload
                    fieldName={field.name}
                    handleFileChange={upload.handleFileChange}
                    handleFileRemove={upload.handleFileRemove}
                    image={upload.image}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="first_name"
            rules={{ required: 'First name is required' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel required>First Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Juan"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="last_name"
            rules={{ required: 'Last name is required' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Last Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Juan"
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

          <FormField
            control={form.control}
            name="sss_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SSS Number</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="SSS Number"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tin_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>TIN Number</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="TIN Number"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="philhealth_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>PhilHealth Number</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="PhilHealth Number"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="basic_salary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Basic Salary</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    placeholder="0.00"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="pt-4 flex justify-end">
          <Button type="submit">
            {technician ? 'Update Technician' : 'Save Technician'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
