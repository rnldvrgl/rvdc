"use client"

import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Archive, List } from "lucide-react"

interface ArchiveToggleProps {
  isArchived: boolean
  onToggle: (archived: boolean) => void
  archivedCount?: number
}

/**
 * Toggle between "Active" and "Archived" views.
 * Drop this into any page above the DataTable.
 */
export function ArchiveToggle({
  isArchived,
  onToggle,
  archivedCount,
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
          Active
        </TabsTrigger>
        <TabsTrigger
          value="archived"
          className="gap-1.5"
        >
          <Archive className="size-3.5" />
          Archived
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
