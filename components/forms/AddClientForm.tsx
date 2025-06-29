'use client'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Barangay, City, Province } from '@/lib/constants/types'
import { useBarangays, useCities, useProvinces } from '@/lib/hooks/usePsgc'
import { useForm } from 'react-hook-form'

export default function AddClientForm() {
  const form = useForm({
    defaultValues: {
      clientName: '',
      phone: '',
      address: '',
      province: '',
      city: '',
      barangay: '',
    },
  })

  const { data: provinces = [], isLoading: loadingProvinces } = useProvinces()
  const { data: cities = [], isLoading: loadingCities } = useCities(
    form.watch('province'),
  )
  const { data: barangays = [], isLoading: loadingBarangays } = useBarangays(
    form.watch('city'),
  )

  // Sort
  interface SortedProvince extends Province {}
  interface SortedCity extends City {}
  interface SortedBarangay extends Barangay {}

  const sortedProvinces: SortedProvince[] = provinces
    .filter((p: Province) => p.code?.trim())
    .sort((a: Province, b: Province) => a.name.localeCompare(b.name))
  interface SortedCity extends City {}

  const sortedCities: SortedCity[] = cities
    .filter((c: City) => c.code?.trim())
    .sort((a: City, b: City) => a.name.localeCompare(b.name))
  interface SortedBarangay extends Barangay {}

  const sortedBarangays: SortedBarangay[] = barangays
    .filter((b: Barangay) => b.code?.trim())
    .sort((a: Barangay, b: Barangay) => a.name.localeCompare(b.name))

  // Handlers
  const handleProvinceChange = (code: string) => {
    form.setValue('province', code)
    form.setValue('city', '')
    form.setValue('barangay', '')
  }

  const handleCityChange = (code: string) => {
    form.setValue('city', code)
    form.setValue('barangay', '')
  }

  const handleBarangayChange = (code: string) => {
    form.setValue('barangay', code)
  }

  // Build names from codes
  interface FormValues {
    clientName: string
    phone: string
    address: string
    province: string
    city: string
    barangay: string
  }

  interface Payload extends FormValues {
    provinceName: string
    cityName: string
    barangayName: string
  }

  const provinceName: string =
    sortedProvinces.find((p: Province) => p.code === form.watch('province'))
      ?.name || ''
  const cityName =
    sortedCities.find((c) => c.code === form.watch('city'))?.name || ''
  const barangayName =
    sortedBarangays.find((b) => b.code === form.watch('barangay'))?.name || ''

  const handleSubmit = (data: any) => {
    const payload = {
      ...data,
      provinceName,
      cityName,
      barangayName,
    }
    console.log('Submitting payload:', payload)
    // axios.post('/api/clients', payload)
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
            name="province"
            render={() => (
              <FormItem>
                <FormLabel>Province</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={handleProvinceChange}
                    value={form.watch('province')}
                    disabled={loadingProvinces}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          loadingProvinces
                            ? 'Loading provinces...'
                            : 'Select Province'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {sortedProvinces.map((prov: Province) => (
                        <SelectItem
                          key={prov.code}
                          value={prov.code}
                        >
                          {prov.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="city"
            render={() => (
              <FormItem>
                <FormLabel>City / Municipality</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={handleCityChange}
                    value={form.watch('city')}
                    disabled={!form.watch('province') || loadingCities}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          loadingCities
                            ? 'Loading cities...'
                            : 'Select City/Municipality'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {sortedCities.map((ct: City) => (
                        <SelectItem
                          key={ct.code}
                          value={ct.code}
                        >
                          {ct.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="barangay"
            render={() => (
              <FormItem>
                <FormLabel>Barangay</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={handleBarangayChange}
                    value={form.watch('barangay')}
                    disabled={!form.watch('city') || loadingBarangays}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          loadingBarangays
                            ? 'Loading barangays...'
                            : 'Select Barangay'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {sortedBarangays.map((brgy: Barangay) => (
                        <SelectItem
                          key={brgy.code}
                          value={brgy.code}
                        >
                          {brgy.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="clientName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client Full Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Juan Dela Cruz"
                    required
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="09XX XXX XXXX"
                    required
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
                    required
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="pt-2 flex justify-end">
          <Button type="submit">Save Client</Button>
        </div>
      </form>
    </Form>
  )
}
