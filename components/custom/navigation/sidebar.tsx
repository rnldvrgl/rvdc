'use client'

import SidebarNav from '@/components/custom/navigation/SidebarNav'
import EntitySheet from '@/components/custom/shared/EntitySheet'
import ClientForm from '@/components/forms/ClientForm'
import ExpenseForm from '@/components/forms/ExpenseForm'
import StockTransferForm from '@/components/forms/inventory/StockTransferForm'
import useActivePath from '@/lib/hooks/useActivePath'
import { useEntitySheet } from '@/lib/hooks/useEntitySheet'
import { useGetPermissions } from '@/lib/hooks/useGetPermissions'
import { useSidebarNavigation } from '@/lib/hooks/useSidebarNavigation'
import useUserProfileStore from '@/lib/store/useUserProfileStore'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export function Sidebar() {
  const pathname = usePathname()
  const isActive = useActivePath()
  const activePath = isActive ? pathname : ''

  const user = useUserProfileStore((state) => state.userProfile)
  const userRole = user?.role || 'guest'
  const userPermissions = useGetPermissions(userRole)

  const { navigation, shortcuts } = useSidebarNavigation({
    permissions: userPermissions,
  })

  const {
    entityState: { open },
    openEntity,
    closeEntity,
  } = useEntitySheet()

  const [currentEntity, setCurrentEntity] = useState<
    'client' | 'expense' | 'transfer' | null
  >(null)

  const handleopenEntity = (entity: 'client' | 'expense' | 'transfer') => {
    setCurrentEntity(entity)
    openEntity()
  }

  return (
    <>
      <EntitySheet
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            closeEntity()
            setCurrentEntity(null)
          }
        }}
        title={
          currentEntity === 'client'
            ? 'Add Client'
            : currentEntity === 'expense'
            ? 'Add Expense'
            : currentEntity === 'transfer'
            ? 'Add Transfer'
            : ''
        }
        description={
          currentEntity === 'client'
            ? 'Fill out the form below to add a new client.'
            : currentEntity === 'expense'
            ? 'Fill out the form below to add a new expense.'
            : currentEntity === 'transfer'
            ? 'Fill out the form below to add a new transfer.'
            : ''
        }
        renderForm={({ onClose }) => {
          if (currentEntity === 'client')
            return <ClientForm onClose={onClose} />
          if (currentEntity === 'expense')
            return <ExpenseForm onClose={onClose} />
          if (currentEntity === 'transfer')
            return <StockTransferForm onClose={onClose} />
          return null
        }}
      />

      <SidebarNav
        sections={[
          { title: 'Navigation', items: navigation },
          { title: 'Shortcuts', items: shortcuts },
        ]}
        activePath={activePath}
        onAction={(action) => {
          if (action === 'addClient') handleopenEntity('client')
          else if (action === 'addExpense') handleopenEntity('expense')
          else if (action === 'addTransfer') handleopenEntity('transfer')
        }}
        user={user}
      />
    </>
  )
}
