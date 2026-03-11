"use client"

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

const createActions = [
  {
    shortcut: "Ctrl + K",
    description: "Open Command Palette",
    category: "General",
  },
  {
    shortcut: "Ctrl + Alt + S",
    description: "New Sale",
    category: "Quick Create",
  },
  {
    shortcut: "Ctrl + Alt + C",
    description: "New Client",
    category: "Quick Create",
  },
  {
    shortcut: "Ctrl + Alt + V",
    description: "New Service",
    category: "Quick Create",
  },
  {
    shortcut: "Ctrl + Alt + E",
    description: "New Expense",
    category: "Quick Create",
  },
  {
    shortcut: "Ctrl + Alt + R",
    description: "New Remittance",
    category: "Quick Create",
  },
  {
    shortcut: "Ctrl + Alt + Q",
    description: "New Cheque Collection",
    category: "Quick Create",
  },
  {
    shortcut: "Ctrl + Alt + P",
    description: "Open Price Checker",
    category: "Quick Create",
  },
]

const navActions = [
  { shortcut: "Alt + Shift + D", description: "Go to Dashboard" },
  { shortcut: "Alt + Shift + S", description: "Go to Services" },
  { shortcut: "Alt + Shift + C", description: "Go to Clients" },
  { shortcut: "Alt + Shift + A", description: "Go to Sales" },
  { shortcut: "Alt + Shift + I", description: "Go to Inventory" },
  { shortcut: "Alt + Shift + E", description: "Go to Expenses" },
  { shortcut: "Alt + Shift + R", description: "Go to Reports" },
  { shortcut: "Alt + Shift + T", description: "Go to Attendance" },
  { shortcut: "Alt + Shift + P", description: "Go to Payroll" },
  { shortcut: "Alt + Shift + M", description: "Go to Remittances" },
]

const tips = [
  "Press Ctrl + K anywhere to open the Command Palette — search pages, clients, services, and sales instantly.",
  "The Price Checker (Ctrl + Alt + P) lets you quickly look up retail, technician, and wholesale prices for any item.",
  "Quick Create shortcuts work from any page — no need to navigate first.",
  "Navigation shortcuts only work when you're NOT focused on a text input.",
  "The Command Palette also shows available actions based on your role.",
]

export default function ShortcutsGuidePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      {/* Print button — hidden in print */}
      <div className="print:hidden fixed top-4 right-4 z-50">
        <Button
          onClick={() => window.print()}
          size="sm"
          className="gap-2"
        >
          <Printer className="size-4" />
          Print / Save as PDF
        </Button>
      </div>

      <div className="max-w-3xl mx-auto px-8 py-12 print:px-4 print:py-6">
        {/* Header */}
        <div className="text-center mb-10 print:mb-6">
          <h1 className="text-3xl font-bold tracking-tight print:text-2xl">
            RVDC Keyboard Shortcuts Guide
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Quick reference for all keyboard shortcuts in the RVDC Management
            System
          </p>
        </div>

        {/* General */}
        <section className="mb-8 print:mb-5">
          <h2 className="text-lg font-semibold border-b pb-2 mb-4 print:text-base print:mb-2">
            General
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="py-2 w-48 print:w-40">Shortcut</th>
                <th className="py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {createActions
                .filter((a) => a.category === "General")
                .map((a) => (
                  <tr
                    key={a.shortcut}
                    className="border-b border-dashed"
                  >
                    <td className="py-2.5">
                      <kbd className="inline-flex items-center gap-1 px-2 py-1 text-xs font-mono bg-zinc-100 dark:bg-zinc-800 border rounded print:bg-zinc-100 print:border-zinc-300">
                        {a.shortcut}
                      </kbd>
                    </td>
                    <td className="py-2.5">{a.description}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>

        {/* Quick Create */}
        <section className="mb-8 print:mb-5">
          <h2 className="text-lg font-semibold border-b pb-2 mb-4 print:text-base print:mb-2">
            Quick Create Actions
            <span className="text-xs font-normal text-muted-foreground ml-2">
              (Ctrl + Alt + Key)
            </span>
          </h2>
          <p className="text-xs text-muted-foreground mb-3 print:mb-2">
            Create new records from anywhere in the system without navigating
            away.
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="py-2 w-48 print:w-40">Shortcut</th>
                <th className="py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {createActions
                .filter((a) => a.category === "Quick Create")
                .map((a) => (
                  <tr
                    key={a.shortcut}
                    className="border-b border-dashed"
                  >
                    <td className="py-2.5">
                      <kbd className="inline-flex items-center gap-1 px-2 py-1 text-xs font-mono bg-zinc-100 dark:bg-zinc-800 border rounded print:bg-zinc-100 print:border-zinc-300">
                        {a.shortcut}
                      </kbd>
                    </td>
                    <td className="py-2.5">{a.description}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>

        {/* Navigation */}
        <section className="mb-8 print:mb-5">
          <h2 className="text-lg font-semibold border-b pb-2 mb-4 print:text-base print:mb-2">
            Navigation Shortcuts
            <span className="text-xs font-normal text-muted-foreground ml-2">
              (Alt + Shift + Key)
            </span>
          </h2>
          <p className="text-xs text-muted-foreground mb-3 print:mb-2">
            Jump to any page instantly. These work when you&apos;re not focused
            on a text field.
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="py-2 w-48 print:w-40">Shortcut</th>
                <th className="py-2">Page</th>
              </tr>
            </thead>
            <tbody>
              {navActions.map((a) => (
                <tr
                  key={a.shortcut}
                  className="border-b border-dashed"
                >
                  <td className="py-2.5">
                    <kbd className="inline-flex items-center gap-1 px-2 py-1 text-xs font-mono bg-zinc-100 dark:bg-zinc-800 border rounded print:bg-zinc-100 print:border-zinc-300">
                      {a.shortcut}
                    </kbd>
                  </td>
                  <td className="py-2.5">{a.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Role Availability */}
        <section className="mb-8 print:mb-5">
          <h2 className="text-lg font-semibold border-b pb-2 mb-4 print:text-base print:mb-2">
            Shortcut Availability by Role
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="py-2">Action</th>
                <th className="py-2 text-center">Admin</th>
                <th className="py-2 text-center">Manager</th>
                <th className="py-2 text-center">Clerk</th>
                <th className="py-2 text-center">Technician</th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  action: "Command Palette",
                  admin: true,
                  manager: true,
                  clerk: true,
                  tech: true,
                },
                {
                  action: "New Sale",
                  admin: true,
                  manager: true,
                  clerk: true,
                  tech: false,
                },
                {
                  action: "New Client",
                  admin: true,
                  manager: true,
                  clerk: true,
                  tech: false,
                },
                {
                  action: "New Service",
                  admin: true,
                  manager: true,
                  clerk: false,
                  tech: false,
                },
                {
                  action: "New Expense",
                  admin: true,
                  manager: true,
                  clerk: true,
                  tech: false,
                },
                {
                  action: "New Remittance",
                  admin: true,
                  manager: true,
                  clerk: true,
                  tech: false,
                },
                {
                  action: "New Cheque",
                  admin: true,
                  manager: true,
                  clerk: false,
                  tech: false,
                },
                {
                  action: "Price Checker",
                  admin: true,
                  manager: true,
                  clerk: true,
                  tech: false,
                },
                {
                  action: "Navigation Shortcuts",
                  admin: true,
                  manager: true,
                  clerk: true,
                  tech: true,
                },
              ].map((row) => (
                <tr
                  key={row.action}
                  className="border-b border-dashed"
                >
                  <td className="py-2">{row.action}</td>
                  <td className="py-2 text-center">{row.admin ? "✓" : "—"}</td>
                  <td className="py-2 text-center">
                    {row.manager ? "✓" : "—"}
                  </td>
                  <td className="py-2 text-center">{row.clerk ? "✓" : "—"}</td>
                  <td className="py-2 text-center">{row.tech ? "✓" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Tips */}
        <section className="mb-8 print:mb-5">
          <h2 className="text-lg font-semibold border-b pb-2 mb-4 print:text-base print:mb-2">
            Tips
          </h2>
          <ul className="space-y-2 text-sm">
            {tips.map((tip, i) => (
              <li
                key={i}
                className="flex gap-2"
              >
                <span className="text-primary font-bold shrink-0">
                  {i + 1}.
                </span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pt-6 border-t">
          <p>RVDC Management System — Keyboard Shortcuts Reference</p>
          <p className="mt-1">
            Print this page (Ctrl + P) or use the button above to save as PDF.
          </p>
        </div>
      </div>
    </div>
  )
}
