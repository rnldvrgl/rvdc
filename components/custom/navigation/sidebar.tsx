'use client'

import NavList from '@/components/custom/navigation/NavList'
import { UserProfile } from '@/components/custom/navigation/UserProfile'
import ClientForm from '@/components/forms/ClientForm'
import EntitySheet from '@/components/sheets/EntitySheet'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { navigation, shortcuts } from '@/lib/constants/navigation'
import { TClient } from '@/lib/constants/types'
import useActivePath from '@/lib/hooks/useActivePath'
import { useEntitySheet } from '@/lib/hooks/useEntitySheet'
import useUserProfileStore from '@/lib/store/useUserProfileStore'
import { Menu } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export function Sidebar() {
  const pathname = usePathname()
  const isActive = useActivePath()
  const activePath = isActive ? pathname : ''

  const user = useUserProfileStore((state) => state.userProfile)
  const [sheetOpen, setSheetOpen] = useState(false)

  const {
    sheetState: { open },
    openSheet,
    closeSheet,
  } = useEntitySheet<TClient>()

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
            openSheet()
          }
        }}
      />
    </nav>
  )

  const renderUserHeader = () => (
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
  )

  return (
    <>
      {/* Sidebar for large screens */}
      <aside className="hidden lg:flex lg:inset-y-0 lg:z-50 lg:w-72 lg:flex-col border-r border-border bg-background p-4">
        <div className="flex flex-col gap-y-8 w-full">
          {renderUserHeader()}

          <EntitySheet
            open={open}
            onOpenChange={(isOpen) => !isOpen && closeSheet()}
            title="Add Client"
            description="Fill out the form below to add a new client."
            renderForm={({ onClose }) => <ClientForm onClose={onClose} />}
          />

          {renderNav()}
        </div>
        <div className="mt-auto">
          <UserProfile user={user} />
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
          <EntitySheet
            open={open}
            onOpenChange={(isOpen) => !isOpen && closeSheet()}
            title="Add Client"
            description="Fill out the form below to add a new client."
            renderForm={({ onClose }) => <ClientForm onClose={onClose} />}
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
                <UserProfile user={user} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  )
}
