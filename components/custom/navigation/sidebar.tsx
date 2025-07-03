'use client'

import SidebarNav from '@/components/custom/navigation/SidebarNav'
import ClientForm from '@/components/forms/ClientForm'
import EntitySheet from '@/components/sheets/EntitySheet'
import { navigation, shortcuts } from '@/lib/constants/navigation'
import useActivePath from '@/lib/hooks/useActivePath'
import { useEntitySheet } from '@/lib/hooks/useEntitySheet'
import useUserProfileStore from '@/lib/store/useUserProfileStore'
import { usePathname } from 'next/navigation'

export function Sidebar() {
  const pathname = usePathname()
  const isActive = useActivePath()
  const activePath = isActive ? pathname : ''

  const user = useUserProfileStore((state) => state.userProfile)

  const {
    sheetState: { open },
    openSheet,
    closeSheet,
  } = useEntitySheet()

  return (
    <>
      <EntitySheet
        open={open}
        onOpenChange={(isOpen) => !isOpen && closeSheet()}
        title="Add Client"
        description="Fill out the form below to add a new client."
        renderForm={({ onClose }) => <ClientForm onClose={onClose} />}
      />

      <SidebarNav
        sections={[
          { title: 'Navigation', items: navigation },
          { title: 'Shortcuts', items: shortcuts },
        ]}
        activePath={activePath}
        onAction={(action) => {
          if (action === 'addClient') openSheet()
        }}
        user={user}
      />
    </>
  )
}
