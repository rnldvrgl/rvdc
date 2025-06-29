'use client'

import { UserProfileDesktop } from '@/components/custom/navigation/UserProfile'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { SHOP_INFO } from '@/lib/constants/meta'
import useActivePath from '@/lib/hooks/useActivePath'
import useUserStore from '@/lib/store/useUserStore'
import { LayoutDashboard, Link2, ListChecks, Settings } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Details', href: '/details', icon: ListChecks },
  { name: 'Settings', href: '/settings', icon: Settings },
]

const shortcuts = [
  { name: 'Add new user', href: '#', icon: Link2 },
  { name: 'Workspace usage', href: '#', icon: Link2 },
  { name: 'Cost spend control', href: '#', icon: Link2 },
  { name: 'Overview – Rows written', href: '#', icon: Link2 },
]

export function Sidebar() {
  const pathname = usePathname()
  const isActive = useActivePath()
  const [open, setOpen] = useState(false)
  const user = useUserStore((state) => state.user)
  const businessName = SHOP_INFO.name

  return (
    <>
      {/* Sidebar for large screens */}
      <aside className="hidden lg:flex lg:inset-y-0 lg:z-50 lg:w-72 lg:flex-col border-r border-border bg-background p-4">
        <div className="flex flex-col gap-y-8 w-full">
          <span className="text-xl font-bold">
            Hello,{' '}
            <span className="text-primary">{user?.first_name || 'Guest'}</span>
          </span>

          <nav className="flex-1 flex flex-col space-y-6">
            <ul className="space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors
                      ${
                        isActive
                          ? 'bg-muted text-primary'
                          : 'hover:bg-muted hover:text-primary text-muted-foreground'
                      }
                      focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2`}
                  >
                    <item.icon className="size-4" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
            <div>
              <p className="mb-2 px-3 text-xs font-semibold text-muted-foreground">
                Shortcuts
              </p>
              <ul className="space-y-1">
                {shortcuts.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors
                        ${
                          pathname === item.href
                            ? 'bg-muted text-primary'
                            : 'hover:bg-muted hover:text-primary text-muted-foreground'
                        }
                        focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2`}
                    >
                      <item.icon className="size-4" />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </div>
        <div className="mt-auto">
          <UserProfileDesktop user={user} />
        </div>
      </aside>

      {/* Top navbar for small screens */}
      <div className="lg:hidden flex h-16 items-center justify-between border-b border-border bg-background px-4">
        <span className="font-semibold">{businessName}</span>
        <Sheet
          open={open}
          onOpenChange={setOpen}
        >
          <SheetTitle>
            <span className="sr-only">Open Menu</span>
          </SheetTitle>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
            >
              <span className="sr-only">Open Menu</span>
              <LayoutDashboard className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-72 p-4"
          >
            <div className="flex flex-col gap-y-8">
              <nav className="flex-1 flex flex-col space-y-6">
                <ul className="space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors
                          ${
                            isActive
                              ? 'bg-muted text-primary'
                              : 'hover:bg-muted hover:text-primary text-muted-foreground'
                          }
                          focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2`}
                      >
                        <item.icon className="size-4" />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
                <div>
                  <p className="mb-2 px-3 text-xs font-semibold text-muted-foreground">
                    Shortcuts
                  </p>
                  <ul className="space-y-1">
                    {shortcuts.map((item) => (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={`flex items-center gap-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors
                            ${
                              pathname === item.href
                                ? 'bg-muted text-primary'
                                : 'hover:bg-muted hover:text-primary text-muted-foreground'
                            }
                            focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2`}
                        >
                          <item.icon className="size-4" />
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </nav>
              <div className="mt-auto">
                <UserProfileDesktop user={user} />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
