import { useFormContext, useWatch } from 'react-hook-form'

type FormValues = {
  range?: {
    from?: Date | null
    to?: Date | null
  }
  stall?: number
}

export function useDateParamsFromForm() {
  const { control } = useFormContext<FormValues>()

  const [range, stall] = useWatch({
    control,
    name: ['range', 'stall'],
  })

  return {
    start_date: range?.from?.toISOString().slice(0, 10),
    end_date: range?.to?.toISOString().slice(0, 10),
    stall: stall ?? undefined,
  }
}
