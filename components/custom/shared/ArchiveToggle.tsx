"use client"

import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Archive, List, LucideIcon } from "lucide-react"

interface ArchiveToggleProps {
  isArchived: boolean
  onToggle: (archived: boolean) => void
  archivedCount?: number
  /** Custom label for the active tab (default: "Active") */
  activeLabel?: string
  /** Custom label for the archived/inactive tab (default: "Archived") */
  archivedLabel?: string
  /** Custom icon for the archived/inactive tab (default: Archive) */
  archivedIcon?: LucideIcon
}

/**
 * Toggle between "Active" and "Archived" (or custom label) views.
 * Drop this into any page above the DataTable.
 */
export function ArchiveToggle({
  isArchived,
  onToggle,
  archivedCount,
  activeLabel = "Active",
  archivedLabel = "Archived",
  archivedIcon: ArchivedIcon = Archive,
}: ArchiveToggleProps) {
  return (
    <Tabs
      value={isArchived ? "archived" : "active"}
      onValueChange={(v) => onToggle(v === "archived")}
    >
      <TabsList>
        <TabsTrigger
          value="active"
          className="gap-1.5"
        >
          <List className="size-3.5" />
          {activeLabel}
        </TabsTrigger>
        <TabsTrigger
          value="archived"
          className="gap-1.5"
        >
          <ArchivedIcon className="size-3.5" />
          {archivedLabel}
          {archivedCount !== undefined && archivedCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-1 h-5 min-w-5 rounded-full px-1.5 text-[10px]"
            >
              {archivedCount}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
