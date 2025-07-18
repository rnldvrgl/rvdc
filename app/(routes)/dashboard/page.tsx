'use client'

import DateRangePicker from '@/components/custom/inputs/DateRangePicker'
import SummaryCards from '@/components/custom/shared/SummaryCards'
import { FormProvider, useForm } from 'react-hook-form'

type DashboardFormValues = {
  range?: {
    from?: Date | null
    to?: Date | null
  }
  stall?: number
}

const DashboardPage = () => {
  const form = useForm<DashboardFormValues>({
    defaultValues: {
      range: {
        from: new Date(),
        to: new Date(),
      },
      stall: undefined,
    },
  })

  return (
    <FormProvider {...form}>
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold">Overview</h1>
        <section className="flex justify-end items-center">
          <DateRangePicker />
        </section>
        <SummaryCards />
      </div>
    </FormProvider>
  )
}

export default DashboardPage
