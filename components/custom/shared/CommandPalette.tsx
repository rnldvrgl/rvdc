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
import { useClients } from "@/lib/queries/clients/useClients"
import { useSalesTransactions } from "@/lib/queries/sales/useSalesTransactions"
import { useServices } from "@/lib/queries/services/useServices"
import {
  CircleDollarSign,
  Coins,
  CreditCard,
  FileText,
  Loader2,
  Plus,
  Search,
  ShoppingCart,
  Users,
  Wrench,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

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
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const router = useRouter()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const navItems = useMemo(() => flattenNavigation(), [])

  // Debounce search input
  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)
    return () => {
      if (debounceRef.current !== null) clearTimeout(debounceRef.current)
    }
  }, [searchQuery])

  // Reset search when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchQuery("")
      setDebouncedQuery("")
    }
  }, [open])

  // Global search queries (only fire when there's a debounced query of 2+ chars)
  const enableSearch = debouncedQuery.length >= 2
  const { data: clientsData, isLoading: clientsLoading } = useClients({
    search: enableSearch ? debouncedQuery : undefined,
    limit: 5,
    page: 1,
  })
  const { data: servicesData, isLoading: servicesLoading } = useServices({
    search: enableSearch ? debouncedQuery : undefined,
    limit: 5,
    page: 1,
  })
  const { data: salesData, isLoading: salesLoading } = useSalesTransactions({
    search: enableSearch ? debouncedQuery : undefined,
    limit: 5,
    page: 1,
  })

  const clients = enableSearch ? (clientsData?.results ?? []) : []
  const services = enableSearch ? (servicesData?.results ?? []) : []
  const sales = enableSearch ? (salesData?.results ?? []) : []
  const isSearching =
    enableSearch && (clientsLoading || servicesLoading || salesLoading)
  const hasSearchResults =
    clients.length > 0 || services.length > 0 || sales.length > 0

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
      <CommandInput
        placeholder="Type a command or search..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        <CommandEmpty>
          <div className="flex flex-col items-center gap-2 py-4">
            {isSearching ? (
              <Loader2 className="size-8 text-muted-foreground/50 animate-spin" />
            ) : (
              <Search className="size-8 text-muted-foreground/50" />
            )}
            <p className="text-sm text-muted-foreground">
              {isSearching ? "Searching..." : "No results found"}
            </p>
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

        {/* Search Results */}
        {enableSearch && hasSearchResults && (
          <>
            {clients.length > 0 && (
              <CommandGroup heading="Clients">
                {clients.map((client) => (
                  <CommandItem
                    key={`client-${client.id}`}
                    value={`client ${client.full_name}`}
                    onSelect={() => handleNavigate(`/clients`)}
                    className="gap-3"
                  >
                    <div className="flex items-center justify-center size-8 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <Users className="size-4" />
                    </div>
                    <div className="flex flex-col">
                      <span>{client.full_name}</span>
                      {client.contact_number && (
                        <span className="text-xs text-muted-foreground">
                          {client.contact_number}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {services.length > 0 && (
              <CommandGroup heading="Services">
                {services.map((service) => (
                  <CommandItem
                    key={`service-${service.id}`}
                    value={`service ${service.id} ${service.client?.full_name}`}
                    onSelect={() => handleNavigate(`/services`)}
                    className="gap-3"
                  >
                    <div className="flex items-center justify-center size-8 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Wrench className="size-4" />
                    </div>
                    <div className="flex flex-col">
                      <span>Service #{service.id}</span>
                      <span className="text-xs text-muted-foreground">
                        {service.client?.full_name}{" "}
                        &middot; {service.status}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {sales.length > 0 && (
              <CommandGroup heading="Sales">
                {sales.map((sale) => (
                  <CommandItem
                    key={`sale-${sale.id}`}
                    value={`sale ${sale.manual_receipt_number || sale.system_receipt_number} ${sale.client?.full_name}`}
                    onSelect={() => handleNavigate(`/sales`)}
                    className="gap-3"
                  >
                    <div className="flex items-center justify-center size-8 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <ShoppingCart className="size-4" />
                    </div>
                    <div className="flex flex-col">
                      <span>{sale.manual_receipt_number || `#${sale.id}`}</span>
                      <span className="text-xs text-muted-foreground">
                        {sale.client?.full_name}{" "}
                        &middot; {sale.payment_status}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            <CommandSeparator />
          </>
        )}

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
