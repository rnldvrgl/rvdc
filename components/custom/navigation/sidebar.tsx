'use client'

import { UserProfileDesktop } from '@/components/custom/navigation/UserProfile'
import { SHOP_INFO } from '@/lib/constants/meta'
import { navigation, shortcuts } from '@/lib/constants/navigation'
import useActivePath from '@/lib/hooks/useActivePath'
import useUserStore from '@/lib/store/useUserStore'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

function getLinkClasses(active: boolean) {
  return `flex items-center gap-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors
    ${
      active
        ? 'bg-muted text-primary'
        : 'hover:bg-muted hover:text-primary text-muted-foreground'
    }
    focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2`
}

function NavList({
  items,
  activePath,
  close,
  title,
}: {
  items: { name: string; href: string; icon: any }[]
  activePath: string
  close?: () => void
  title?: string
}) {
  return (
    <>
      {title && (
        <p className="mb-2 px-3 text-xs font-semibold text-muted-foreground">
          {title}
        </p>
      )}
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.name}>
            <Link
              href={item.href}
              onClick={close}
              className={getLinkClasses(activePath === item.href)}
            >
              <item.icon className="size-4" />
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const isActive = useActivePath()
  const [open, setOpen] = useState(false)
  const user = useUserStore((state) => state.user)
  const businessName = SHOP_INFO.name
  const activePath = isActive ? pathname : ''

  const renderNav = (close?: () => void) => (
    <nav className="flex-1 flex flex-col space-y-6">
      <NavList
        items={navigation}
        activePath={activePath}
        close={close}
      />
      <NavList
        title="Shortcuts"
        items={shortcuts}
        activePath={pathname}
        close={close}
      />
    </nav>
  )

  return (
    <>
      {/* Sidebar for large screens */}
      <aside className="hidden lg:flex lg:inset-y-0 lg:z-50 lg:w-72 lg:flex-col border-r border-border bg-background p-4">
        <div className="flex flex-col gap-y-8 w-full">
          <div className="flex items-center gap-3 rounded-xl bg-muted p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary font-semibold">
              {user?.first_name?.[0]?.toUpperCase() || 'G'}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Welcome back</p>
              <p className="text-base font-semibold text-foreground">
                {user?.first_name || 'Guest'}
              </p>
            </div>
          </div>
          {renderNav()}
        </div>
        <div className="mt-auto">
          <UserProfileDesktop user={user} />
        </div>
      </aside>
    </>
  )
}
