'use client'

import { Detail } from '@/components/custom/Detail'
import { ErrorState } from '@/components/custom/ErrorState'
import TechnicianForm from '@/components/forms/TechnicianForm'
import EntitySheet from '@/components/sheets/EntitySheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Technician } from '@/lib/constants/types'
import { useEntitySheet } from '@/lib/hooks/useEntitySheet'
import { useTechnician } from '@/lib/queries/useTechnician'
import {
  Calendar,
  Home,
  IdCard,
  Mail,
  Pencil,
  Phone,
  Wallet,
} from 'lucide-react'
import Image from 'next/image'
import { useParams } from 'next/navigation'

const TechnicianPage = () => {
  const params = useParams()
  const {
    data: technician,
    isLoading,
    error,
    refetch,
  } = useTechnician(`${params.id}`)

  const {
    sheetState: { open },
    openSheet,
    closeSheet,
  } = useEntitySheet<Technician>()

  if (isLoading) {
    return (
      <div className="h-full py-8 px-4">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* PROFILE HEADER SKELETON */}
          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center gap-6">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-20" />
              </div>
            </CardHeader>
          </Card>

          {/* CONTACT & EMPLOYMENT SKELETON */}
          <div className="grid md:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {[...Array(4)].map((__, j) => (
                    <div
                      key={j}
                      className="space-y-1"
                    >
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !technician) {
    return (
      <ErrorState
        title="Failed to load technician details"
        description="There was a problem fetching the technician data. Please try again later or Contact support."
        retry={refetch}
      />
    )
  }

  return (
    <div className="h-full py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex justify-end">
          <Button onClick={() => openSheet(technician)}>
            <Pencil className="size-4 mr-2" />
            Edit Technician
          </Button>
        </div>

        {/* PROFILE HEADER */}
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center gap-6">
            {technician.profile_image ? (
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary">
                <Image
                  src={technician.profile_image}
                  alt={`${technician.first_name} ${technician.last_name}`}
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                />
              </div>
            ) : (
              <div className="h-24 w-24 rounded-full bg-primary/20 text-primary flex items-center justify-center text-3xl font-bold">
                {technician.first_name?.[0]}
                {technician.last_name?.[0]}
              </div>
            )}
            <div className="space-y-1">
              <h1 className="text-2xl font-bold">
                {technician.first_name} {technician.last_name}
              </h1>
              <p className="text-muted-foreground capitalize">
                {technician.role}
              </p>
              <Badge variant={technician.is_active ? 'default' : 'outline'}>
                {technician.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* CONTACT & EMPLOYMENT */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Contact & Address</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              <Detail
                icon={<Phone className="size-4" />}
                label="Contact Number"
                value={technician.contact_number}
              />
              <Detail
                icon={<Mail className="size-4" />}
                label="Email"
                value={technician.email || '-'}
              />
              <Detail
                icon={<Home className="size-4" />}
                label="Address"
                value={technician.address}
              />
              <Detail
                label="Barangay"
                value={technician.barangay}
              />
              <Detail
                label="City"
                value={technician.city}
              />
              <Detail
                label="Province"
                value={technician.province}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Employment & Other Info</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              <Detail
                icon={<Wallet className="size-4" />}
                label="Basic Salary"
                value={`₱${Number(technician.basic_salary).toLocaleString()}`}
              />
              <Detail
                icon={<IdCard className="size-4" />}
                label="Philhealth #"
                value={technician.philhealth_number || '-'}
              />
              <Detail
                icon={<IdCard className="size-4" />}
                label="SSS #"
                value={technician.sss_number || '-'}
              />
              <Detail
                icon={<Calendar className="size-4" />}
                label="Birthday"
                value={technician.birthday || '-'}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* EDIT SHEET */}
      <EntitySheet<Technician>
        open={open}
        onOpenChange={(isOpen) => !isOpen && closeSheet()}
        entity={technician}
        title="Edit Technician"
        description="Update the technician details below."
        renderForm={({ onClose, entity }) => (
          <TechnicianForm
            onClose={onClose}
            technician={entity}
          />
        )}
      />
    </div>
  )
}

export default TechnicianPage
