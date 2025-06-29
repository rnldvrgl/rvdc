'use client'

import NavList from '@/components/custom/navigation/NavList'
import {
  UserProfileDesktop,
  UserProfileMobile,
} from '@/components/custom/navigation/UserProfile'
import AddClientSheet from '@/components/sheets/AddClientSheet'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { navigation, shortcuts } from '@/lib/constants/navigation'
import useActivePath from '@/lib/hooks/useActivePath'
import useUserStore from '@/lib/store/useUserStore'
import { Menu } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export function Sidebar() {
  const pathname = usePathname()
  const isActive = useActivePath()
  const user = useUserStore((state) => state.user)
  const activePath = isActive ? pathname : ''
  const [addClientOpen, setAddClientOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)

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
        onAction={(action) => {
          if (action === 'addClient') {
            setAddClientOpen(true)
          }
        }}
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
          <AddClientSheet
            open={addClientOpen}
            onOpenChange={setAddClientOpen}
          />
          {renderNav()}
        </div>
        <div className="mt-auto">
          <UserProfileDesktop user={user} />
        </div>
      </aside>

      {/* Top navbar for small screens */}
      <div className="lg:hidden flex h-16 items-center justify-between border-b border-border bg-background px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary font-semibold">
            {user?.first_name?.[0]?.toUpperCase() || 'G'}
          </div>
          <span className="font-semibold">{user?.first_name || 'Guest'}</span>
        </div>
        <div className="flex items-center gap-2">
          <AddClientSheet
            open={addClientOpen}
            onOpenChange={setAddClientOpen}
          />
          <Sheet
            open={sheetOpen}
            onOpenChange={setSheetOpen}
          >
            <SheetTitle>
              <SheetTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
            </SheetTitle>
            <SheetContent
              side="left"
              className="flex flex-col p-4"
            >
              {renderNav(() => setSheetOpen(false))}
              <div className="mt-auto">
                <UserProfileMobile user={user} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  )
}
