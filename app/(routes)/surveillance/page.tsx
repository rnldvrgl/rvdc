"use client"

import { useCCTVCameras, useGo2rtcStatus } from "@/lib/queries/useSurveillance"
import { useCCTVMutations } from "@/lib/mutations/useSurveillance"
import { CameraGrid } from "@/components/custom/surveillance/CameraGrid"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { redirect } from "next/navigation"
import { useEffect } from "react"
import { PageLoadingSkeleton } from "@/components/custom/shared/skeletons"
import { Video } from "lucide-react"

export default function SurveillancePage() {
  const { isSuperAdmin, userProfile } = useCurrentUser()
  const { data: cameras = [], isLoading: camerasLoading, refetch } = useCCTVCameras()
  const { data: go2rtcStatus } = useGo2rtcStatus()
  const { createCamera, updateCamera, deleteCamera, syncAll, syncOne } = useCCTVMutations()

  useEffect(() => {
    if (userProfile !== null && !isSuperAdmin) {
      redirect("/dashboard")
    }
  }, [isSuperAdmin, userProfile])

  if (!userProfile || camerasLoading) {
    return <PageLoadingSkeleton message="Loading surveillance..." />
  }

  return (
    <Wrapper>
      <PageHeader
        icon={Video}
        title="Surveillance"
        description="Monitor live camera feeds and manage your iCSee / XMEye CCTV cameras."
        breadcrumbs={["Dashboard", "Admin", "Surveillance"]}
        onRefresh={refetch}
        isLoading={camerasLoading}
        isAdminOnly={!isSuperAdmin}
      />
      <CameraGrid
        cameras={cameras}
        go2rtcStatus={go2rtcStatus}
        onAdd={(data) => createCamera.mutate(data)}
        onUpdate={(id, data) => updateCamera.mutate({ id, ...data })}
        onDelete={(id) => deleteCamera.mutate(id)}
        onSyncAll={() => syncAll.mutate()}
        onSyncOne={(id) => syncOne.mutate(id)}
        isSyncing={syncAll.isPending || syncOne.isPending}
        isAdding={createCamera.isPending}
        isUpdating={updateCamera.isPending}
        isDeleting={deleteCamera.isPending}
      />
    </Wrapper>
  )
}
