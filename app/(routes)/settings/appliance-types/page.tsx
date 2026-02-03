"use client"

import EntitySheet from "@/components/custom/shared/EntitySheet"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { DataTable } from "@/components/custom/table/DataTable"
import ApplianceTypeForm from "@/components/forms/ApplianceTypeForm"
import { Button } from "@/components/ui/button"
import { ApplianceType } from "@/lib/constants/interface"
import { useEntitySheet } from "@/lib/hooks/useEntitySheet"
import useSearchParameters from "@/lib/hooks/useSearchParameters"
import { useApplianceTypeMutations } from "@/lib/mutations/useApplianceTypeMutations"
import { useApplianceTypes } from "@/lib/queries/useApplianceTypes"
import { ColumnDef } from "@tanstack/react-table"
import { Edit, Plus, Settings, Trash2, Wrench } from "lucide-react"
import { useMemo } from "react"

export default function ApplianceTypesPage() {
  const { page, limit, search, ordering } = useSearchParameters()
  const { data, isLoading } = useApplianceTypes({
    page,
    limit,
    search,
    ordering,
  })
  const { deleteApplianceType } = useApplianceTypeMutations()

  // Sheets
  const {
    entityState: createSheet,
    openEntity: openCreate,
    closeEntity: closeCreate,
  } = useEntitySheet<ApplianceType>()
  const {
    entityState: editSheet,
    openEntity: openEdit,
    closeEntity: closeEdit,
  } = useEntitySheet<ApplianceType>()

  const columns = useMemo<ColumnDef<ApplianceType>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Appliance Type",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{row.original.name}</span>
          </div>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => openEdit(row.original)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (
                  confirm(
                    `Are you sure you want to delete "${row.original.name}"?`,
                  )
                ) {
                  deleteApplianceType.mutate(row.original.id)
                }
              }}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ),
      },
    ],
    [openEdit, deleteApplianceType],
  )

  return (
    <Wrapper>
      <PageHeader
        icon={Settings}
        title="Appliance Types"
        description="Manage appliance types used in service management. Add, edit, or remove appliance types as needed."
        breadcrumbs={["Settings", "Appliance Types"]}
        actionButton={
          <Button onClick={() => openCreate()}>
            <Plus className="size-4 mr-2" />
            Add Appliance Type
          </Button>
        }
      />

      {/* Create Sheet */}
      <EntitySheet<ApplianceType>
        open={createSheet.open}
        onClose={closeCreate}
        title="Add Appliance Type"
        description="Create a new appliance type for service management."
        renderForm={({ forceClose }) => (
          <ApplianceTypeForm onClose={forceClose} />
        )}
      />

      {/* Edit Sheet */}
      <EntitySheet<ApplianceType>
        open={editSheet.open}
        onClose={closeEdit}
        entity={editSheet.entity}
        title="Edit Appliance Type"
        description="Update the appliance type information."
        renderForm={({ forceClose, entity }) => (
          <ApplianceTypeForm
            onClose={forceClose}
            initialData={entity}
          />
        )}
      />

      {/* Main Content */}
      <DataTable
        title="Appliance Types"
        description="All registered appliance types in the system"
        isLoading={isLoading}
        columns={columns}
        data={
          data ?? {
            count: 0,
            next: null,
            previous: null,
            results: [],
          }
        }
        orderingOptions={[
          { label: "Name (A-Z)", value: "name" },
          { label: "Name (Z-A)", value: "-name" },
        ]}
      />
    </Wrapper>
  )
}
