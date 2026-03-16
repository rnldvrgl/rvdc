"use client"

import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { Keyboard } from "lucide-react"

type RoleGuide = "admin" | "clerk" | "manager"

interface ShortcutEntry {
  shortcut: string
  description: string
  roles: RoleGuide[]
}

const generalShortcuts: ShortcutEntry[] = [
  {
    shortcut: "Ctrl + K",
    description: "Open Command Palette",
    roles: ["admin", "manager", "clerk"],
  },
]

const createShortcuts: ShortcutEntry[] = [
  {
    shortcut: "Ctrl + Alt + S",
    description: "New Sale",
    roles: ["admin", "manager", "clerk"],
  },
  {
    shortcut: "Ctrl + Alt + C",
    description: "New Client",
    roles: ["admin", "manager", "clerk"],
  },
  {
    shortcut: "Ctrl + Alt + V",
    description: "New Service",
    roles: ["admin", "manager"],
  },
  {
    shortcut: "Ctrl + Alt + E",
    description: "New Expense",
    roles: ["admin", "manager", "clerk"],
  },
  {
    shortcut: "Ctrl + Alt + R",
    description: "New Remittance",
    roles: ["admin", "manager", "clerk"],
  },
  {
    shortcut: "Ctrl + Alt + Q",
    description: "New Cheque Collection",
    roles: ["admin", "manager"],
  },
  {
    shortcut: "Ctrl + Alt + P",
    description: "Open Price Checker",
    roles: ["admin", "manager", "clerk"],
  },
  {
    shortcut: "Ctrl + Alt + I",
    description: "Open Stock Checker",
    roles: ["admin", "manager", "clerk"],
  },
]

const navShortcuts: ShortcutEntry[] = [
  {
    shortcut: "Alt + Shift + D",
    description: "Go to Dashboard",
    roles: ["admin", "manager", "clerk"],
  },
  {
    shortcut: "Alt + Shift + S",
    description: "Go to Services",
    roles: ["admin", "manager", "clerk"],
  },
  {
    shortcut: "Alt + Shift + C",
    description: "Go to Clients",
    roles: ["admin", "manager", "clerk"],
  },
  {
    shortcut: "Alt + Shift + A",
    description: "Go to Sales",
    roles: ["admin", "manager", "clerk"],
  },
  {
    shortcut: "Alt + Shift + I",
    description: "Go to Inventory",
    roles: ["admin", "manager", "clerk"],
  },
  {
    shortcut: "Alt + Shift + E",
    description: "Go to Expenses",
    roles: ["admin", "manager", "clerk"],
  },
  {
    shortcut: "Alt + Shift + R",
    description: "Go to Reports",
    roles: ["admin", "manager"],
  },
  {
    shortcut: "Alt + Shift + T",
    description: "Go to Attendance",
    roles: ["admin", "manager", "clerk"],
  },
  {
    shortcut: "Alt + Shift + P",
    description: "Go to Payroll",
    roles: ["admin", "manager", "clerk"],
  },
  {
    shortcut: "Alt + Shift + M",
    description: "Go to Remittances",
    roles: ["admin", "manager"],
  },
]

const tipsByRole: Record<RoleGuide, string[]> = {
  admin: [
    "Press Ctrl + K anywhere to open the Command Palette — search pages, clients, services, and sales instantly.",
    "The Price Checker (Ctrl + Alt + P) lets you quickly look up retail, technician, wholesale, and cost prices for any item.",
    "The Stock Checker (Ctrl + Alt + I) shows stall and stockroom quantities, reserved stock, and availability status at a glance.",
    "Quick Create shortcuts work from any page — no need to navigate first.",
    "Navigation shortcuts only work when you're NOT focused on a text input.",
    "The Command Palette shows all actions available to Admin and Manager roles.",
    "Only Admin can see cost prices in the Price Checker.",
  ],
  manager: [
    "Press Ctrl + K anywhere to open the Command Palette — search pages, clients, services, and sales instantly.",
    "The Price Checker (Ctrl + Alt + P) lets you quickly look up retail, technician, wholesale, and cost prices for any item.",
    "The Stock Checker (Ctrl + Alt + I) shows stall and stockroom quantities, reserved stock, and availability status at a glance.",
    "Quick Create shortcuts work from any page — no need to navigate first.",
    "Navigation shortcuts only work when you're NOT focused on a text input.",
    "The Command Palette shows all actions available to Admin and Manager roles.",
    "You have the same shortcuts as Admin role.",
  ],
  clerk: [
    "Press Ctrl + K anywhere to open the Command Palette — search pages, clients, and sales instantly.",
    "The Price Checker (Ctrl + Alt + P) lets you look up retail, technician, and wholesale prices for any item.",
    "The Stock Checker (Ctrl + Alt + I) lets you quickly check stall and stockroom stock levels for any item.",
    "Quick Create shortcuts work from any page — no need to navigate first.",
    "Navigation shortcuts only work when you're NOT focused on a text input.",
    "You can view services and add parts used, but creating new services requires Admin or Manager access.",
  ],
}

function ShortcutTable({ items }: { items: ShortcutEntry[] }) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.shortcut}
          className="flex items-center justify-between gap-3 group"
        >
          <span className="text-sm text-foreground/90 group-hover:text-foreground transition-colors">
            {item.description}
          </span>
          <kbd className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold font-mono bg-secondary/60 text-secondary-foreground border border-border/50 rounded-md shadow-sm shrink-0 group-hover:bg-secondary/80 group-hover:border-border transition-all">
            {item.shortcut}
          </kbd>
        </div>
      ))}
    </div>
  )
}

function GuideContent({ role }: { role: RoleGuide }) {
  const general = generalShortcuts.filter((s) => s.roles.includes(role))
  const create = createShortcuts.filter((s) => s.roles.includes(role))
  const nav = navShortcuts.filter((s) => s.roles.includes(role))
  const tips = tipsByRole[role === "manager" ? "manager" : role]

  return (
    <div className="space-y-4">
      {/* General & Quick Create Actions */}
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">General & Quick Actions</CardTitle>
          <CardDescription className="text-sm">
            Essential shortcuts and instant record creation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {general.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">General</h4>
              <ShortcutTable items={general} />
            </div>
          )}
          {create.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Quick Create (Ctrl + Alt + Key)</h4>
              <ShortcutTable items={create} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Shortcuts Card */}
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Page Navigation</CardTitle>
          <CardDescription className="text-sm">
            Jump to any page with Alt + Shift + Key
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ShortcutTable items={nav} />
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card className="border-border/40 bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="text-primary">💡</span> Tips & Best Practices
          </CardTitle>
          <CardDescription className="text-sm">
            Get the most out of keyboard shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {tips.map((tip, i) => (
              <li key={i} className="flex gap-2.5 text-sm leading-relaxed">
                <span className="flex items-center justify-center size-5 rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-foreground/80">{tip}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ShortcutsGuidePage() {
  const { canManage } = useCurrentUser()

  return (
    <Wrapper>
      <PageHeader
        icon={Keyboard}
        title="Keyboard Shortcuts"
        description="Master these shortcuts to work faster and more efficiently"
      />
      {canManage ? (
        <GuideContent role="admin" />
      ) : (
        <GuideContent role="clerk" />
      )}
    </Wrapper>
  )
}
