"use client"

import { usePathname } from "next/navigation"
import { useState } from "react"

import SidebarNav from "@/components/custom/navigation/SidebarNav"
import { CommandPalette } from "@/components/custom/shared/CommandPalette"
import EntitySheet from "@/components/custom/shared/EntitySheet"
import ChequeCollectionForm from "@/components/forms/ChequeCollectionForm"
import ClientForm from "@/components/forms/ClientForm"
import ExpenseForm from "@/components/forms/ExpenseForm"
import RemittanceForm from "@/components/forms/RemittanceForm"

import SalesTransactionForm from "@/components/forms/SalesTransactionForm"
import ServiceFormWizard from "@/components/forms/ServiceFormWizard"
import useActivePath from "@/lib/hooks/useActivePath"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useEntitySheet } from "@/lib/hooks/useEntitySheet"
import { useGetPermissions } from "@/lib/hooks/useGetPermissions"
import { useSidebarNavigation } from "@/lib/hooks/useSidebarNavigation"

// Define supported entities and metadata
const ENTITY_CONFIG = {
  sale: {
    title: "Add Sale",
    description: "Fill out the form below to add a new sale.",
    Form: SalesTransactionForm,
    className: "sm:max-w-3xl md:max-w-4xl lg:max-w-5xl",
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
    title: "Create New Service",
    description: "Create a new service request",
    Form: ServiceFormWizard,
    className: "sm:min-w-2xl md:min-w-3xl xl:min-w-4xl",
  },
  chequeCollection: {
    title: "Add Cheque Collection",
    description: "Fill out the form below to record a cheque collection.",
    Form: ChequeCollectionForm,
  },
} as const

type EntityType = keyof typeof ENTITY_CONFIG

export function Sidebar() {
  const { userProfile, role, payrollIncluded } = useCurrentUser()
  const pathname = usePathname()
  const isActive = useActivePath()
  const activePath = isActive ? pathname : ""

  const userPermissions = useGetPermissions(role || "guest", payrollIncluded)

  const { navigation } = useSidebarNavigation({
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
      <CommandPalette
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
              break
            case "addService":
              handleOpenEntity("service")
              break
            case "addChequeCollection":
              handleOpenEntity("chequeCollection")
              break
          }
        }}
      />

      <EntitySheet
        className={(entityConfig as { className?: string })?.className}
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
        sections={[{ title: "Navigation", items: navigation }]}
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
              break
            case "addService":
              handleOpenEntity("service")
              break
            case "addChequeCollection":
              handleOpenEntity("chequeCollection")
              break
          }
        }}
        user={userProfile}
      />
    </>
  )
}
