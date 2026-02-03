"use client"

import { usePathname } from "next/navigation"
import { useState } from "react"

import SidebarNav from "@/components/custom/navigation/SidebarNav"
import EntitySheet from "@/components/custom/shared/EntitySheet"
import ClientForm from "@/components/forms/ClientForm"
import ExpenseForm from "@/components/forms/ExpenseForm"
import RemittanceForm from "@/components/forms/RemittanceForm"

import SalesTransactionForm from "@/components/forms/SalesTransactionForm"
import ServiceForm from "@/components/forms/ServiceForm"
import useActivePath from "@/lib/hooks/useActivePath"
import { useEntitySheet } from "@/lib/hooks/useEntitySheet"
import { useGetPermissions } from "@/lib/hooks/useGetPermissions"
import { useSidebarNavigation } from "@/lib/hooks/useSidebarNavigation"
import useUserProfileStore from "@/lib/store/useUserProfileStore"

// Define supported entities and metadata
const ENTITY_CONFIG = {
  sale: {
    title: "Add Sale",
    description: "Fill out the form below to add a new sale.",
    Form: SalesTransactionForm,
  },
  client: {
    title: "Add Client",
    description: "Fill out the form below to add a new client.",
    Form: ClientForm,
  },
  expense: {
    title: "Add Expense",
    description: "Fill out the form below to add a new expense.",
    Form: ExpenseForm,
  },
  remittance: {
    title: "Add Remittance",
    description: "Fill out the form below to add a new remittance.",
    Form: RemittanceForm,
  },
  service: {
    title: "Add Service",
    description: "Fill out the form below to add a new service.",
    Form: ServiceForm,
  },
} as const

type EntityType = keyof typeof ENTITY_CONFIG

export function Sidebar() {
  const pathname = usePathname()
  const isActive = useActivePath()
  const activePath = isActive ? pathname : ""

  const user = useUserProfileStore((state) => state.userProfile)
  const userRole = user?.role || "guest"
  const userPermissions = useGetPermissions(userRole)

  const { navigation, shortcuts } = useSidebarNavigation({
    permissions: userPermissions,
  })

  const {
    entityState: { open },
    openEntity,
    closeEntity,
  } = useEntitySheet()

  const [currentEntity, setCurrentEntity] = useState<EntityType | null>(null)

  const handleOpenEntity = (entity: EntityType) => {
    setCurrentEntity(entity)
    openEntity()
  }

  const entityConfig = currentEntity ? ENTITY_CONFIG[currentEntity] : null
  const FormComponent = entityConfig?.Form

  return (
    <>
      <EntitySheet
        open={open}
        onClose={closeEntity}
        withCloseConfirmation
        title={entityConfig?.title || ""}
        description={entityConfig?.description || ""}
        renderForm={({ forceClose }) =>
          FormComponent ? <FormComponent onClose={forceClose} /> : null
        }
      />

      <SidebarNav
        sections={[
          { title: "Navigation", items: navigation },
          { title: "Shortcuts", items: shortcuts },
        ]}
        activePath={activePath}
        onAction={(action) => {
          switch (action) {
            case "addSale":
              handleOpenEntity("sale")
              break
            case "addClient":
              handleOpenEntity("client")
              break
            case "addExpense":
              handleOpenEntity("expense")
              break
            case "addRemittance":
              handleOpenEntity("remittance")
            case "addService":
              handleOpenEntity("service")
              break
          }
        }}
        user={user}
      />
    </>
  )
}
