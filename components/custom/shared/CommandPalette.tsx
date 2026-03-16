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
import {
  Item,
  NavigationGroup,
  NavigationLink,
} from "@/lib/constants/interface"
import { orderedNavigation } from "@/lib/constants/navigation"
import { useClients } from "@/lib/queries/clients/useClients"
import { useItems } from "@/lib/queries/inventory/useItems"
import { useStallStocks } from "@/lib/queries/inventory/useStocks"
import { useSalesTransactions } from "@/lib/queries/sales/useSalesTransactions"
import { useServices } from "@/lib/queries/services/useServices"
import {
  Banknote,
  Box,
  CircleDollarSign,
  Coins,
  CreditCard,
  FileSpreadsheet,
  FileText,
  LayoutDashboard,
  Loader2,
  Package,
  Plus,
  Search,
  ShoppingCart,
  Tag,
  Users,
  Warehouse,
  Wrench,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

// Quick-create actions with permission requirements
const quickActions = [
  {
    label: "New Sale",
    icon: CircleDollarSign,
    action: "addSale",
    keywords: "create add sale transaction",
    shortcut: "Ctrl+Alt+S",
    permission: "shortcut_add_sale",
  },
  {
    label: "New Client",
    icon: Users,
    action: "addClient",
    keywords: "create add client customer",
    shortcut: "Ctrl+Alt+C",
    permission: "shortcut_add_client",
  },
  {
    label: "New Service",
    icon: Wrench,
    action: "addService",
    keywords: "create add service repair installation",
    shortcut: "Ctrl+Alt+V",
    permission: "shortcut_add_service",
  },
  {
    label: "New Expense",
    icon: Coins,
    action: "addExpense",
    keywords: "create add expense cost",
    shortcut: "Ctrl+Alt+E",
    permission: "shortcut_add_expense",
  },
  {
    label: "New Remittance",
    icon: Banknote,
    action: "addRemittance",
    keywords: "create add remittance cash",
    shortcut: "Ctrl+Alt+R",
    permission: "shortcut_add_remittance",
  },
  {
    label: "New Cheque Collection",
    icon: CreditCard,
    action: "addChequeCollection",
    keywords: "create add cheque collection check payment",
    shortcut: "Ctrl+Alt+Q",
    permission: "manage_cheque_collections",
  },
  {
    label: "Price Checker",
    icon: Tag,
    action: "priceChecker",
    keywords: "price check item cost retail wholesale technician lookup",
    shortcut: "Ctrl+Alt+P",
    permission: "view_items",
  },
  {
    label: "Stock Checker",
    icon: Warehouse,
    action: "stockChecker",
    keywords: "stock check inventory quantity stall stockroom available reserved",
    shortcut: "Ctrl+Alt+I",
    permission: "view_items",
  },
  {
    label: "Restock Stall",
    icon: Package,
    action: "restockStall",
    keywords: "add restock stall stock inventory",
    shortcut: "Ctrl+Shift+Alt+1",
    permission: "manage_stock",
  },
  {
    label: "Audit Stall Stock",
    icon: Package,
    action: "auditStall",
    keywords: "audit stall stock inventory reconcile count",
    shortcut: "Ctrl+Shift+Alt+2",
    permission: "manage_stock",
  },
  {
    label: "Pull Out from Stall",
    icon: Package,
    action: "pullOutStall",
    keywords: "pull out remove stall stock inventory",
    shortcut: "Ctrl+Shift+Alt+3",
    permission: "manage_stock",
  },
  {
    label: "Add to Stockroom",
    icon: Box,
    action: "addStockroom",
    keywords: "add stockroom stock inventory",
    shortcut: "Ctrl+Shift+Alt+4",
    permission: "manage_stockroom",
  },
  {
    label: "Audit Stockroom",
    icon: Box,
    action: "auditStockroom",
    keywords: "audit stockroom stock inventory reconcile count",
    shortcut: "Ctrl+Shift+Alt+5",
    permission: "manage_stockroom",
  },
]

// Navigation shortcuts
const navigationShortcuts = [
  { keys: "Alt+Shift+D", label: "Go to Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: "view_dashboard" },
  { keys: "Alt+Shift+S", label: "Go to Services", href: "/services", icon: Wrench, permission: "view_services" },
  { keys: "Alt+Shift+C", label: "Go to Clients", href: "/clients", icon: Users, permission: "view_clients" },
  { keys: "Alt+Shift+A", label: "Go to Sales", href: "/sales", icon: CircleDollarSign, permission: "view_sales" },
  { keys: "Alt+Shift+I", label: "Go to Inventory", href: "/inventory/items", icon: Package, permission: "view_items" },
  { keys: "Alt+Shift+E", label: "Go to Expenses", href: "/expenses/manage", icon: Coins, permission: "view_expenses" },
  { keys: "Alt+Shift+R", label: "Go to Reports", href: "/reports", icon: FileSpreadsheet, permission: "view_reports" },
  { keys: "Alt+Shift+T", label: "Go to Attendance", href: "/attendance/overview", icon: FileText, permission: "manage_attendance" },
  { keys: "Alt+Shift+P", label: "Go to Payroll", href: "/payroll/weekly", icon: FileText, permission: "view_payroll" },
  { keys: "Alt+Shift+M", label: "Go to Remittances", href: "/receivables/remittances", icon: Banknote, permission: "view_remittances" },
  { keys: "Alt+Shift+L", label: "Go to Stall Stocks", href: "/inventory/stocks/stall", icon: Package, permission: "view_items" },
  { keys: "Alt+Shift+K", label: "Go to Stockroom", href: "/inventory/stocks/stockroom", icon: Box, permission: "view_items" },
]

function peso(v: string | number) {
  return `\u20B1${Number(v).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

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
  permissions?: string[]
}

export function CommandPalette({
  onAction,
  permissions = [],
}: CommandPaletteProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [priceCheckerMode, setPriceCheckerMode] = useState(false)
  const [priceQuery, setPriceQuery] = useState("")
  const [debouncedPriceQuery, setDebouncedPriceQuery] = useState("")
  const [stockCheckerMode, setStockCheckerMode] = useState(false)
  const [stockQuery, setStockQuery] = useState("")
  const [debouncedStockQuery, setDebouncedStockQuery] = useState("")
  const router = useRouter()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const priceDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stockDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const navItems = useMemo(() => flattenNavigation(), [])

  // Filter quick actions by permissions
  const allowedQuickActions = useMemo(
    () =>
      permissions.length > 0
        ? quickActions.filter((a) => permissions.includes(a.permission))
        : quickActions,
    [permissions],
  )

  // Filter navigation shortcuts by permissions
  const allowedNavShortcuts = useMemo(
    () =>
      permissions.length > 0
        ? navigationShortcuts.filter((s) => permissions.includes(s.permission))
        : navigationShortcuts,
    [permissions],
  )

  // Debounce search input
  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)
    return () => {
      if (debounceRef.current !== null) clearTimeout(debounceRef.current)
    }
  }, [searchQuery])

  // Debounce price checker input
  useEffect(() => {
    priceDebounceRef.current = setTimeout(() => {
      setDebouncedPriceQuery(priceQuery)
    }, 300)
    return () => {
      if (priceDebounceRef.current !== null)
        clearTimeout(priceDebounceRef.current)
    }
  }, [priceQuery])

  // Debounce stock checker input
  useEffect(() => {
    stockDebounceRef.current = setTimeout(() => {
      setDebouncedStockQuery(stockQuery)
    }, 300)
    return () => {
      if (stockDebounceRef.current !== null)
        clearTimeout(stockDebounceRef.current)
    }
  }, [stockQuery])

  // Reset search when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchQuery("")
      setDebouncedQuery("")
      setPriceCheckerMode(false)
      setPriceQuery("")
      setDebouncedPriceQuery("")
      setStockCheckerMode(false)
      setStockQuery("")
      setDebouncedStockQuery("")
    }
  }, [open])

  // Global search queries (only fire when there's a debounced query of 2+ chars)
  const enableSearch = !priceCheckerMode && !stockCheckerMode && debouncedQuery.length >= 2
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

  // Price checker item search
  const enablePriceSearch = priceCheckerMode && debouncedPriceQuery.length >= 2
  const { data: itemsData, isLoading: itemsLoading } = useItems({
    search: enablePriceSearch ? debouncedPriceQuery : undefined,
    limit: 10,
    page: 1,
  })
  const priceItems: Item[] = enablePriceSearch ? (itemsData?.results ?? []) : []

  // Stock checker search
  const enableStockSearch = stockCheckerMode && debouncedStockQuery.length >= 2
  const { data: stocksData, isLoading: stocksLoading } = useStallStocks({
    search: enableStockSearch ? debouncedStockQuery : undefined,
    limit: 10,
    page: 1,
  })
  const stockItems = enableStockSearch ? (stocksData?.results ?? []) : []

  const clients = enableSearch ? (clientsData?.results ?? []) : []
  const services = enableSearch ? (servicesData?.results ?? []) : []
  const sales = enableSearch ? (salesData?.results ?? []) : []
  const isSearching =
    enableSearch && (clientsLoading || servicesLoading || salesLoading)
  const hasSearchResults =
    clients.length > 0 || services.length > 0 || sales.length > 0

  // Listen for keyboard shortcuts
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Don't fire shortcuts when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName
      const isInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT"

      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
        return
      }

      // Skip remaining shortcuts if inside an input or dialog is open
      if (isInput || open) return

      // Ctrl+Alt + key for quick-create actions
      if ((e.metaKey || e.ctrlKey) && e.altKey && !e.shiftKey) {
        const key = e.key.toLowerCase()
        switch (key) {
          case "s":
            e.preventDefault()
            onAction?.("addSale")
            break
          case "c":
            e.preventDefault()
            onAction?.("addClient")
            break
          case "v":
            e.preventDefault()
            onAction?.("addService")
            break
          case "e":
            e.preventDefault()
            onAction?.("addExpense")
            break
          case "r":
            e.preventDefault()
            onAction?.("addRemittance")
            break
          case "q":
            e.preventDefault()
            onAction?.("addChequeCollection")
            break
          case "p":
            e.preventDefault()
            setPriceCheckerMode(true)
            setOpen(true)
            break
          case "i":
            e.preventDefault()
            setStockCheckerMode(true)
            setOpen(true)
            break
        }
        return
      }

      // Alt+Shift + key for navigation
      if (e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey) {
        const key = e.key.toLowerCase()
        switch (key) {
          case "d":
            e.preventDefault()
            router.push("/dashboard")
            break
          case "s":
            e.preventDefault()
            router.push("/services")
            break
          case "c":
            e.preventDefault()
            router.push("/clients")
            break
          case "a":
            e.preventDefault()
            router.push("/sales")
            break
          case "i":
            e.preventDefault()
            router.push("/inventory/items")
            break
          case "e":
            e.preventDefault()
            router.push("/expenses/manage")
            break
          case "r":
            e.preventDefault()
            router.push("/reports")
            break
          case "t":
            e.preventDefault()
            router.push("/attendance/overview")
            break
          case "p":
            e.preventDefault()
            router.push("/payroll/weekly")
            break
          case "m":
            e.preventDefault()
            router.push("/receivables/remittances")
            break
          case "l":
            e.preventDefault()
            router.push("/inventory/stocks/stall")
            break
          case "k":
            e.preventDefault()
            router.push("/inventory/stocks/stockroom")
            break
        }
      }

      // Ctrl+Shift+Alt + key for stock operations
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.altKey) {
        const key = e.key
        switch (key) {
          case "1":
            e.preventDefault()
            router.push("/inventory/stocks/stall?action=restock")
            break
          case "2":
            e.preventDefault()
            router.push("/inventory/stocks/stall?action=audit")
            break
          case "3":
            e.preventDefault()
            router.push("/inventory/stocks/stall?action=pullout")
            break
          case "4":
            e.preventDefault()
            router.push("/inventory/stocks/stockroom?action=restock")
            break
          case "5":
            e.preventDefault()
            router.push("/inventory/stocks/stockroom?action=audit")
            break
        }
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [open, router, onAction])

  const handleNavigate = useCallback(
    (href: string) => {
      setOpen(false)
      router.push(href)
    },
    [router],
  )

  const handleAction = useCallback(
    (action: string) => {
      if (action === "priceChecker") {
        setPriceCheckerMode(true)
        setSearchQuery("")
        return
      }
      if (action === "stockChecker") {
        setStockCheckerMode(true)
        setSearchQuery("")
        return
      }
      if (action === "restockStall") {
        setOpen(false)
        router.push("/inventory/stocks/stall?action=restock")
        return
      }
      if (action === "auditStall") {
        setOpen(false)
        router.push("/inventory/stocks/stall?action=audit")
        return
      }
      if (action === "pullOutStall") {
        setOpen(false)
        router.push("/inventory/stocks/stall?action=pullout")
        return
      }
      if (action === "addStockroom") {
        setOpen(false)
        router.push("/inventory/stocks/stockroom?action=restock")
        return
      }
      if (action === "auditStockroom") {
        setOpen(false)
        router.push("/inventory/stocks/stockroom?action=audit")
        return
      }
      setOpen(false)
      onAction?.(action)
    },
    [onAction],
  )

  // Whether to show cost price (admin only — manage_stockroom)
  const showCostPrice = permissions.includes("manage_stockroom")

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title={priceCheckerMode ? "Price Checker" : stockCheckerMode ? "Stock Checker" : "Command Palette"}
      description={
        priceCheckerMode
          ? "Search for an item to see its prices"
          : stockCheckerMode
            ? "Search for an item to check stock levels"
            : "Search pages, actions, and more..."
      }
    >
      {priceCheckerMode ? (
        <CommandInput
          placeholder="Type item name to check prices..."
          value={priceQuery}
          onValueChange={setPriceQuery}
        />
      ) : stockCheckerMode ? (
        <CommandInput
          placeholder="Type item name to check stock..."
          value={stockQuery}
          onValueChange={setStockQuery}
        />
      ) : (
        <CommandInput
          placeholder="Type a command or search..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
      )}
      <CommandList>
        {priceCheckerMode ? (
          <>
            <CommandEmpty>
              <div className="flex flex-col items-center gap-2 py-4">
                {itemsLoading ? (
                  <Loader2 className="size-8 text-muted-foreground/50 animate-spin" />
                ) : (
                  <Tag className="size-8 text-muted-foreground/50" />
                )}
                <p className="text-sm text-muted-foreground">
                  {itemsLoading
                    ? "Searching items..."
                    : debouncedPriceQuery.length < 2
                      ? "Type at least 2 characters to search"
                      : "No items found"}
                </p>
              </div>
            </CommandEmpty>
            {priceItems.length > 0 && (
              <CommandGroup heading="Item Prices">
                {priceItems.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={`${item.name} ${item.sku}`}
                    className="flex-col items-start gap-1 py-3"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Tag className="size-4 text-primary shrink-0" />
                      <span className="font-medium">{item.name}</span>
                      {item.sku && (
                        <span className="text-xs text-muted-foreground ml-auto font-mono">
                          {item.sku}
                        </span>
                      )}
                    </div>
                    <div
                      className={`grid grid-cols-3 ${showCostPrice ? "sm:grid-cols-4" : ""} gap-x-4 gap-y-1 w-full pl-6 mt-1`}
                    >
                      <div>
                        <span className="text-xs text-muted-foreground">
                          Retail
                        </span>
                        <p className="text-sm font-semibold text-success">
                          {peso(item.retail_price)}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">
                          Technician
                        </span>
                        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                          {peso(item.technician_price)}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">
                          Wholesale
                        </span>
                        <p className="text-sm font-semibold text-violet-600 dark:text-violet-400">
                          {peso(item.wholesale_price)}
                        </p>
                      </div>
                      {showCostPrice && (
                        <div>
                          <span className="text-xs text-muted-foreground">
                            Cost
                          </span>
                          <p className="text-sm font-semibold text-muted-foreground">
                            {peso(item.cost_price)}
                          </p>
                        </div>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setPriceCheckerMode(false)
                  setPriceQuery("")
                  setDebouncedPriceQuery("")
                }}
                className="gap-3 justify-center text-muted-foreground"
              >
                ← Back to Command Palette
              </CommandItem>
            </CommandGroup>
          </>
        ) : stockCheckerMode ? (
          <>
            <CommandEmpty>
              <div className="flex flex-col items-center gap-2 py-4">
                {stocksLoading ? (
                  <Loader2 className="size-8 text-muted-foreground/50 animate-spin" />
                ) : (
                  <Warehouse className="size-8 text-muted-foreground/50" />
                )}
                <p className="text-sm text-muted-foreground">
                  {stocksLoading
                    ? "Searching stocks..."
                    : debouncedStockQuery.length < 2
                      ? "Type at least 2 characters to search"
                      : "No items found"}
                </p>
              </div>
            </CommandEmpty>
            {stockItems.length > 0 && (
              <CommandGroup heading="Stock Levels">
                {stockItems.map((stock) => {
                  const statusColor =
                    stock.status === "no_stock"
                      ? "text-red-600 dark:text-red-400"
                      : stock.status === "low_stock"
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-emerald-600 dark:text-emerald-400"
                  const statusLabel =
                    stock.status === "no_stock"
                      ? "No Stock"
                      : stock.status === "low_stock"
                        ? "Low Stock"
                        : "In Stock"
                  const stockRoomStatusColor =
                    stock.stock_room_status === "no_stock"
                      ? "text-red-600 dark:text-red-400"
                      : stock.stock_room_status === "low_stock"
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-emerald-600 dark:text-emerald-400"
                  const stockRoomStatusLabel =
                    stock.stock_room_status === "no_stock"
                      ? "No Stock"
                      : stock.stock_room_status === "low_stock"
                        ? "Low Stock"
                        : "In Stock"
                  return (
                    <CommandItem
                      key={stock.id}
                      value={`${stock.item.name} ${stock.item.sku}`}
                      className="flex-col items-start gap-1 py-3"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <Warehouse className="size-4 text-primary shrink-0" />
                        <span className="font-medium">{stock.item.name}</span>
                        {stock.item.sku && (
                          <span className="text-xs text-muted-foreground ml-auto font-mono">
                            {stock.item.sku}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 w-full pl-6 mt-1">
                        {/* Stall Stock */}
                        <div>
                          <span className="text-xs text-muted-foreground">Stall</span>
                          <div className="flex items-center gap-1.5">
                            <p className={`text-sm font-semibold ${statusColor}`}>
                              {stock.available_quantity} {stock.item.unit_of_measure}
                            </p>
                            <span className={`text-[10px] font-medium ${statusColor}`}>
                              ({statusLabel})
                            </span>
                          </div>
                          {stock.reserved_quantity > 0 && (
                            <p className="text-[11px] text-muted-foreground">
                              {stock.reserved_quantity} reserved
                            </p>
                          )}
                        </div>
                        {/* Stockroom */}
                        <div>
                          <span className="text-xs text-muted-foreground">Stockroom</span>
                          <div className="flex items-center gap-1.5">
                            <p className={`text-sm font-semibold ${stockRoomStatusColor}`}>
                              {stock.stock_room_quantity} {stock.item.unit_of_measure}
                            </p>
                            <span className={`text-[10px] font-medium ${stockRoomStatusColor}`}>
                              ({stockRoomStatusLabel})
                            </span>
                          </div>
                        </div>
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setStockCheckerMode(false)
                  setStockQuery("")
                  setDebouncedStockQuery("")
                }}
                className="gap-3 justify-center text-muted-foreground"
              >
                ← Back to Command Palette
              </CommandItem>
            </CommandGroup>
          </>
        ) : (
          <>
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
              {allowedQuickActions.map((item) => (
                <CommandItem
                  key={item.action}
                  value={item.keywords}
                  onSelect={() => handleAction(item.action)}
                  className="gap-3"
                >
                  <div className="flex items-center justify-center size-8 rounded-md bg-primary/10 text-primary">
                    <item.icon className="size-4" />
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <span>{item.label}</span>
                    {item.action !== "priceChecker" && item.action !== "stockChecker" && (
                      <Plus className="size-3 text-muted-foreground" />
                    )}
                  </div>
                  {item.shortcut && (
                    <kbd className="pointer-events-none text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
                      {item.shortcut}
                    </kbd>
                  )}
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
                        onSelect={() => handleNavigate(`/clients/${client.id}`)}
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
                        onSelect={() => handleNavigate(`/services?view=${service.id}`)}
                        className="gap-3"
                      >
                        <div className="flex items-center justify-center size-8 rounded-md bg-amber-500/10 text-warning">
                          <Wrench className="size-4" />
                        </div>
                        <div className="flex flex-col">
                          <span>Service #{service.id}</span>
                          <span className="text-xs text-muted-foreground">
                            {service.client?.full_name} &middot;{" "}
                            {service.status}
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
                        onSelect={() => handleNavigate(`/sales?view=${sale.id}`)}
                        className="gap-3"
                      >
                        <div className="flex items-center justify-center size-8 rounded-md bg-emerald-500/10 text-success">
                          <ShoppingCart className="size-4" />
                        </div>
                        <div className="flex flex-col">
                          <span>
                            {sale.manual_receipt_number || `#${sale.id}`}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {sale.client?.full_name} &middot;{" "}
                            {sale.payment_status}
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

            <CommandSeparator />

            {/* Keyboard Shortcuts Reference */}
            <CommandGroup heading="Navigation Shortcuts">
              {allowedNavShortcuts.map((shortcut) => (
                <CommandItem
                  key={shortcut.keys}
                  value={`shortcut ${shortcut.label}`}
                  onSelect={() => handleNavigate(shortcut.href)}
                  className="gap-3 justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center size-8 rounded-md bg-muted text-muted-foreground">
                      <shortcut.icon className="size-4" />
                    </div>
                    <span className="text-muted-foreground">
                      {shortcut.label}
                    </span>
                  </div>
                  <kbd className="pointer-events-none text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
                    {shortcut.keys}
                  </kbd>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}
