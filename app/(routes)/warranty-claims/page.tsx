"use client"

import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import FreeCleaningTab from "@/components/warranty-claims/FreeCleaningTab"
import WarrantyClaimsTab from "@/components/warranty-claims/WarrantyClaimsTab"
import { useWarrantyClaims } from "@/lib/queries/useAircons"
import { ShieldCheck, SprayCan } from "lucide-react"

export default function WarrantyClaimsPage() {
  const { refetch } = useWarrantyClaims({
    page: 1,
    limit: 100,
  })

  return (
    <Wrapper>
      <PageHeader
        icon={ShieldCheck}
        title="Warranty & Free Cleaning"
        description="Manage warranty claims for aircon units and redeem free cleaning services for eligible units."
        breadcrumbs={["Dashboard", "Aircons", "Warranty & Free Cleaning"]}
        onRefresh={refetch}
      />

      <Tabs
        defaultValue="claims"
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="claims">
            <ShieldCheck className="size-4 mr-2" />
            Warranty Claims
          </TabsTrigger>
          <TabsTrigger value="cleaning">
            <SprayCan className="size-4 mr-2" />
            Free Cleaning
          </TabsTrigger>
        </TabsList>

        <TabsContent value="claims">
          <WarrantyClaimsTab />
        </TabsContent>

        <TabsContent value="cleaning">
          <FreeCleaningTab />
        </TabsContent>
      </Tabs>
    </Wrapper>
  )
}
