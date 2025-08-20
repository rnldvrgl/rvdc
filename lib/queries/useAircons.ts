import { AirconBrands, AirconModels } from '@/lib/constants/interface'
import type { PaginatedFilterProps } from '@/lib/constants/types'
import { usePaginatedQuery } from '@/lib/hooks/usePaginatedQuery'

const installationsUrl = '/installations/'

export function useAirconBrands(props: PaginatedFilterProps = {}) {
  return usePaginatedQuery<AirconBrands>({
    ...props,
    url: `${installationsUrl}aircon-brands/`,
    queryKeyBase: 'aircon-brands',
  })
}

export function useAirconModels(props: PaginatedFilterProps = {}) {
  return usePaginatedQuery<AirconModels>({
    ...props,
    url: `${installationsUrl}aircon-models/`,
    queryKeyBase: 'aircon-models',
  })
}
