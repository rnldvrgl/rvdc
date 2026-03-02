"use client"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { NavigationGroup, NavigationLink } from "@/lib/constants/interface"
import { orderedNavigation } from "@/lib/constants/navigation"
import {
  CircleDollarSign,
  Coins,
  CreditCard,
  FileText,
  Plus,
  Search,
  Users,
  Wrench,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"

// Quick-create actions
const quickActions = [
  {
    label: "New Sale",
    icon: CircleDollarSign,
    action: "addSale",
    keywords: "create add sale transaction",
  },
  {
    label: "New Client",
    icon: Users,
    action: "addClient",
    keywords: "create add client customer",
  },
  {
    label: "New Service",
    icon: Wrench,
    action: "addService",
    keywords: "create add service repair installation",
  },
  {
    label: "New Expense",
    icon: Coins,
    action: "addExpense",
    keywords: "create add expense cost",
  },
  {
    label: "New Remittance",
    icon: FileText,
    action: "addRemittance",
    keywords: "create add remittance cash",
  },
  {
    label: "New Cheque Collection",
    icon: CreditCard,
    action: "addChequeCollection",
    keywords: "create add cheque collection check payment",
  },
]

// Flatten navigation tree into searchable items
function flattenNavigation() {
  const items: {
    name: string
    href: string
    icon: React.ComponentType<{ className?: string }>
    group: string
    keywords: string
  }[] = []

  for (const entry of orderedNavigation) {
    if ("children" in entry && Array.isArray(entry.children)) {
      const group = entry as NavigationGroup
      for (const child of group.children) {
        items.push({
          name: child.name,
          href: child.href,
          icon: child.icon as React.ComponentType<{ className?: string }>,
          group: group.name,
          keywords: `${group.name} ${child.name}`.toLowerCase(),
        })
      }
    } else {
      const link = entry as NavigationLink
      items.push({
        name: link.name,
        href: link.href,
        icon: link.icon as React.ComponentType<{ className?: string }>,
        group: "Pages",
        keywords: link.name.toLowerCase(),
      })
    }
  }

  return items
}

interface CommandPaletteProps {
  onAction?: (action: string) => void
}

export function CommandPalette({ onAction }: CommandPaletteProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const navItems = useMemo(() => flattenNavigation(), [])

  // Listen for Ctrl+K / Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const handleNavigate = useCallback(
    (href: string) => {
      setOpen(false)
      router.push(href)
    },
    [router],
  )

  const handleAction = useCallback(
    (action: string) => {
      setOpen(false)
      onAction?.(action)
    },
    [onAction],
  )

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Command Palette"
      description="Search pages, actions, and more..."
    >
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>
          <div className="flex flex-col items-center gap-2 py-4">
            <Search className="size-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No results found</p>
          </div>
        </CommandEmpty>

        {/* Quick Actions */}
        <CommandGroup heading="Quick Actions">
          {quickActions.map((item) => (
            <CommandItem
              key={item.action}
              value={item.keywords}
              onSelect={() => handleAction(item.action)}
              className="gap-3"
            >
              <div className="flex items-center justify-center size-8 rounded-md bg-primary/10 text-primary">
                <item.icon className="size-4" />
              </div>
              <div className="flex items-center gap-2">
                <span>{item.label}</span>
                <Plus className="size-3 text-muted-foreground" />
              </div>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Navigation Pages */}
        <CommandGroup heading="Pages">
          {navItems.map((item) => (
            <CommandItem
              key={item.href}
              value={item.keywords}
              onSelect={() => handleNavigate(item.href)}
              className="gap-3"
            >
              <div className="flex items-center justify-center size-8 rounded-md bg-muted text-muted-foreground">
                <item.icon className="size-4" />
              </div>
              <div className="flex flex-col">
                <span>{item.name}</span>
                {item.group !== "Pages" && (
                  <span className="text-xs text-muted-foreground">
                    {item.group}
                  </span>
                )}
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
