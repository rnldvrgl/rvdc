"use client"

import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { Keyboard, Printer } from "lucide-react"

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
    "Quick Create shortcuts work from any page — no need to navigate first.",
    "Navigation shortcuts only work when you're NOT focused on a text input.",
    "The Command Palette shows all actions available to Admin and Manager roles.",
    "Only Admin can see cost prices in the Price Checker.",
  ],
  manager: [
    "Press Ctrl + K anywhere to open the Command Palette — search pages, clients, services, and sales instantly.",
    "The Price Checker (Ctrl + Alt + P) lets you quickly look up retail, technician, wholesale, and cost prices for any item.",
    "Quick Create shortcuts work from any page — no need to navigate first.",
    "Navigation shortcuts only work when you're NOT focused on a text input.",
    "The Command Palette shows all actions available to Admin and Manager roles.",
    "You have the same shortcuts as Admin role.",
  ],
  clerk: [
    "Press Ctrl + K anywhere to open the Command Palette — search pages, clients, and sales instantly.",
    "The Price Checker (Ctrl + Alt + P) lets you look up retail, technician, and wholesale prices for any item.",
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
          className="flex items-center justify-between py-2 border-b border-dashed last:border-0"
        >
          <span className="text-sm">{item.description}</span>
          <kbd className="inline-flex items-center gap-1 px-2 py-1 text-xs font-mono bg-muted border rounded shrink-0">
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
    <div className="grid gap-6 md:grid-cols-2">
      {/* General Shortcuts Card */}
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>
            Essential shortcuts available to all users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ShortcutTable items={general} />
        </CardContent>
      </Card>

      {/* Quick Create Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Create Actions</CardTitle>
          <CardDescription>
            Create records from anywhere (Ctrl + Alt + Key)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ShortcutTable items={create} />
        </CardContent>
      </Card>

      {/* Navigation Shortcuts Card */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Navigation Shortcuts</CardTitle>
          <CardDescription>
            Jump to any page instantly (Alt + Shift + Key)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <ShortcutTable items={nav.slice(0, Math.ceil(nav.length / 2))} />
            <ShortcutTable items={nav.slice(Math.ceil(nav.length / 2))} />
          </div>
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Tips & Tricks</CardTitle>
          <CardDescription>
            Maximize your productivity with these tips
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {tips.map((tip, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-primary font-bold shrink-0">
                  {i + 1}.
                </span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ShortcutsGuidePage() {
  const { role } = useCurrentUser()
  const userRole: RoleGuide =
    role === "admin" || role === "manager" ? "admin" : "clerk"

  return (
    <Wrapper>
      <PageHeader
        icon={Keyboard}
        title="Keyboard Shortcuts"
        description="Quick reference guide for all keyboard shortcuts in the system"
        actionButton={
          <Button onClick={() => window.print()} size="sm" className="gap-2">
            <Printer className="size-4" />
            Print / Save as PDF
          </Button>
        }
      />

      <Tabs defaultValue={userRole} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="admin">Admin / Manager</TabsTrigger>
          <TabsTrigger value="clerk">Clerk</TabsTrigger>
        </TabsList>

        <TabsContent value="admin" className="mt-6">
          <GuideContent role="admin" />
        </TabsContent>

        <TabsContent value="clerk" className="mt-6">
          <GuideContent role="clerk" />
        </TabsContent>
      </Tabs>
    </Wrapper>
  )
}
