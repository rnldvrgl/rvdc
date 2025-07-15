import { Barangay, City, Province } from '@/lib/constants/types'
import { useBarangays, useCities, useProvinces } from '@/lib/queries/usePsgc'
import {
  getCodeByName,
  getNameByCode,
  prepareOptions,
} from '@/lib/utils/helpers'
import { useEffect } from 'react'
import { FieldValues, Path, PathValue, UseFormReturn } from 'react-hook-form'

interface UsePsgcFormProps<T extends FieldValues> {
  form: UseFormReturn<T>
  defaultValues?: Partial<{
    province: string
    city: string
    barangay: string
  }>
}

export function usePsgcForm<T extends FieldValues>({
  form,
  defaultValues,
}: UsePsgcFormProps<T>) {
  const selectedProvince = form.watch('province' as Path<T>) as
    | string
    | undefined
  const selectedCity = form.watch('city' as Path<T>) as string | undefined
  const selectedBarangay = form.watch('barangay' as Path<T>) as
    | string
    | undefined

  const { data: provinces = [], isLoading: loadingProvinces } = useProvinces()
  const { data: cities = [], isLoading: loadingCities } = useCities(
    selectedProvince ?? null,
  )
  const { data: barangays = [], isLoading: loadingBarangays } = useBarangays(
    selectedCity ?? null,
  )

  const sortedProvinces: Province[] = prepareOptions(provinces as Province[])
  const sortedCities: City[] = prepareOptions(cities as City[])
  const sortedBarangays: Barangay[] = prepareOptions(barangays as Barangay[])

  const provinceName = getNameByCode(sortedProvinces, selectedProvince ?? '')
  const cityName = getNameByCode(sortedCities, selectedCity ?? '')
  const barangayName = getNameByCode(sortedBarangays, selectedBarangay ?? '')

  // Set province
  useEffect(() => {
    if (defaultValues?.province && sortedProvinces.length) {
      const code = getCodeByName(sortedProvinces, defaultValues.province)
      if (code && !form.getValues('province' as Path<T>)) {
        form.setValue('province' as Path<T>, code as PathValue<T, Path<T>>)
      }
    }
  }, [defaultValues?.province, sortedProvinces, form])

  // Set city
  useEffect(() => {
    if (defaultValues?.city && sortedCities.length) {
      const code = getCodeByName(sortedCities, defaultValues.city)
      if (code && !form.getValues('city' as Path<T>)) {
        form.setValue('city' as Path<T>, code as PathValue<T, Path<T>>)
      }
    }
  }, [defaultValues?.city, sortedCities, form])

  // Set barangay
  useEffect(() => {
    if (defaultValues?.barangay && sortedBarangays.length) {
      const code = getCodeByName(sortedBarangays, defaultValues.barangay)
      if (code && !form.getValues('barangay' as Path<T>)) {
        form.setValue('barangay' as Path<T>, code as PathValue<T, Path<T>>)
      }
    }
  }, [defaultValues?.barangay, sortedBarangays, form])

  const handleProvinceChange = (code: string) => {
    form.setValue('province' as Path<T>, code as PathValue<T, Path<T>>)
    form.setValue('city' as Path<T>, '' as PathValue<T, Path<T>>)
    form.setValue('barangay' as Path<T>, '' as PathValue<T, Path<T>>)
  }

  const handleCityChange = (code: string) => {
    form.setValue('city' as Path<T>, code as PathValue<T, Path<T>>)
    form.setValue('barangay' as Path<T>, '' as PathValue<T, Path<T>>)
  }

  const handleBarangayChange = (code: string) => {
    form.setValue('barangay' as Path<T>, code as PathValue<T, Path<T>>)
  }

  return {
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
  }
}
