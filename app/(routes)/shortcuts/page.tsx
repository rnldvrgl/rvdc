"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils/helpers"
import { Printer } from "lucide-react"
import { useState } from "react"

type RoleGuide = "admin" | "clerk"

interface ShortcutEntry {
  shortcut: string
  description: string
  roles: RoleGuide[]
}

const generalShortcuts: ShortcutEntry[] = [
  {
    shortcut: "Ctrl + K",
    description: "Open Command Palette",
    roles: ["admin", "clerk"],
  },
]

const createShortcuts: ShortcutEntry[] = [
  {
    shortcut: "Ctrl + Alt + S",
    description: "New Sale",
    roles: ["admin", "clerk"],
  },
  {
    shortcut: "Ctrl + Alt + C",
    description: "New Client",
    roles: ["admin", "clerk"],
  },
  { shortcut: "Ctrl + Alt + V", description: "New Service", roles: ["admin"] },
  {
    shortcut: "Ctrl + Alt + E",
    description: "New Expense",
    roles: ["admin", "clerk"],
  },
  {
    shortcut: "Ctrl + Alt + R",
    description: "New Remittance",
    roles: ["admin", "clerk"],
  },
  {
    shortcut: "Ctrl + Alt + Q",
    description: "New Cheque Collection",
    roles: ["admin"],
  },
  {
    shortcut: "Ctrl + Alt + P",
    description: "Open Price Checker",
    roles: ["admin", "clerk"],
  },
]

const navShortcuts: ShortcutEntry[] = [
  {
    shortcut: "Alt + Shift + D",
    description: "Go to Dashboard",
    roles: ["admin", "clerk"],
  },
  {
    shortcut: "Alt + Shift + S",
    description: "Go to Services",
    roles: ["admin", "clerk"],
  },
  {
    shortcut: "Alt + Shift + C",
    description: "Go to Clients",
    roles: ["admin", "clerk"],
  },
  {
    shortcut: "Alt + Shift + A",
    description: "Go to Sales",
    roles: ["admin", "clerk"],
  },
  {
    shortcut: "Alt + Shift + I",
    description: "Go to Inventory",
    roles: ["admin", "clerk"],
  },
  {
    shortcut: "Alt + Shift + E",
    description: "Go to Expenses",
    roles: ["admin", "clerk"],
  },
  {
    shortcut: "Alt + Shift + R",
    description: "Go to Reports",
    roles: ["admin"],
  },
  {
    shortcut: "Alt + Shift + T",
    description: "Go to Attendance",
    roles: ["admin", "clerk"],
  },
  {
    shortcut: "Alt + Shift + P",
    description: "Go to Payroll",
    roles: ["admin", "clerk"],
  },
  {
    shortcut: "Alt + Shift + M",
    description: "Go to Remittances",
    roles: ["admin"],
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
    <table className="w-full text-sm print:text-black">
      <thead>
        <tr className="text-left text-muted-foreground print:text-gray-600 border-b">
          <th className="py-2 w-48 print:w-40">Shortcut</th>
          <th className="py-2">Action</th>
        </tr>
      </thead>
      <tbody>
        {items.map((a) => (
          <tr
            key={a.shortcut}
            className="border-b border-dashed print:border-gray-300"
          >
            <td className="py-2.5">
              <kbd className="inline-flex items-center gap-1 px-2 py-1 text-xs font-mono bg-zinc-100 dark:bg-zinc-800 border rounded print:bg-zinc-100 print:border-zinc-300 print:text-black">
                {a.shortcut}
              </kbd>
            </td>
            <td className="py-2.5">{a.description}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function GuideContent({ role }: { role: RoleGuide }) {
  const roleLabel = role === "admin" ? "Admin / Manager" : "Clerk"
  const general = generalShortcuts.filter((s) => s.roles.includes(role))
  const create = createShortcuts.filter((s) => s.roles.includes(role))
  const nav = navShortcuts.filter((s) => s.roles.includes(role))
  const tips = tipsByRole[role]

  return (
    <div className="max-w-3xl mx-auto px-8 py-12 print:px-4 print:py-6 print:text-black">
      {/* Header */}
      <div className="text-center mb-10 print:mb-6">
        <h1 className="text-3xl font-bold tracking-tight print:text-2xl print:text-black">
          RVDC Keyboard Shortcuts
        </h1>
        <div className="mt-2 inline-flex items-center gap-2">
          <span
            className={cn(
              "text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide",
              role === "admin"
                ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 print:bg-violet-100 print:text-violet-700"
                : "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 print:bg-sky-100 print:text-sky-700",
            )}
          >
            {roleLabel} Guide
          </span>
        </div>
        <p className="text-muted-foreground print:text-gray-600 mt-3 text-sm">
          Quick reference for keyboard shortcuts available to the {roleLabel}{" "}
          role
        </p>
      </div>

      {/* General */}
      <section className="mb-8 print:mb-5">
        <h2 className="text-lg font-semibold border-b pb-2 mb-4 print:text-base print:mb-2 print:text-black print:border-gray-300">
          General
        </h2>
        <ShortcutTable items={general} />
      </section>

      {/* Quick Create */}
      <section className="mb-8 print:mb-5">
        <h2 className="text-lg font-semibold border-b pb-2 mb-4 print:text-base print:mb-2 print:text-black print:border-gray-300">
          Quick Create Actions
          <span className="text-xs font-normal text-muted-foreground print:text-gray-600 ml-2">
            (Ctrl + Alt + Key)
          </span>
        </h2>
        <p className="text-xs text-muted-foreground print:text-gray-600 mb-3 print:mb-2">
          Create new records from anywhere in the system without navigating
          away.
        </p>
        <ShortcutTable items={create} />
      </section>

      {/* Navigation */}
      <section className="mb-8 print:mb-5">
        <h2 className="text-lg font-semibold border-b pb-2 mb-4 print:text-base print:mb-2 print:text-black print:border-gray-300">
          Navigation Shortcuts
          <span className="text-xs font-normal text-muted-foreground print:text-gray-600 ml-2">
            (Alt + Shift + Key)
          </span>
        </h2>
        <p className="text-xs text-muted-foreground print:text-gray-600 mb-3 print:mb-2">
          Jump to any page instantly. These work when you&apos;re not focused on
          a text field.
        </p>
        <ShortcutTable items={nav} />
      </section>

      {/* Tips */}
      <section className="mb-8 print:mb-5">
        <h2 className="text-lg font-semibold border-b pb-2 mb-4 print:text-base print:mb-2 print:text-black print:border-gray-300">
          Tips
        </h2>
        <ul className="space-y-2 text-sm print:text-black">
          {tips.map((tip, i) => (
            <li
              key={i}
              className="flex gap-2"
            >
              <span className="text-primary print:text-black font-bold shrink-0">
                {i + 1}.
              </span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground print:text-gray-600 pt-6 border-t print:border-gray-300">
        <p>RVDC Management System — {roleLabel} Shortcuts Reference</p>
        <p className="mt-1">
          Print this page (Ctrl + P) or use the button above to save as PDF.
        </p>
      </div>
    </div>
  )
}

export default function ShortcutsGuidePage() {
  const [activeRole, setActiveRole] = useState<RoleGuide>("admin")

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @media print {
            body, html {
              background: white !important;
              color: black !important;
            }
            @page {
              margin: 1cm;
            }
            .print\\:hidden {
              display: none !important;
            }
          }
        `,
        }}
      />
      <div className="min-h-screen bg-white text-foreground print:bg-white print:text-black">
        {/* Toolbar — hidden in print */}
        <div className="print:hidden fixed top-4 right-4 z-50 flex items-center gap-2">
          <div className="flex items-center bg-muted rounded-lg p-1 gap-1">
            <button
              onClick={() => setActiveRole("admin")}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                activeRole === "admin"
                  ? "bg-white dark:bg-zinc-800 shadow-sm text-violet-700 dark:text-violet-300"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Admin / Manager
            </button>
            <button
              onClick={() => setActiveRole("clerk")}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                activeRole === "clerk"
                  ? "bg-white dark:bg-zinc-800 shadow-sm text-sky-700 dark:text-sky-300"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Clerk
            </button>
          </div>
          <Button
            onClick={() => window.print()}
            size="sm"
            className="gap-2"
          >
            <Printer className="size-4" />
            Print / Save as PDF
          </Button>
        </div>

        <GuideContent role={activeRole} />
      </div>
    </>
  )
}
