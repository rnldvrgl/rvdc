'use client'

import NavList from '@/components/custom/navigation/NavList'
import NotificationArea from '@/components/custom/navigation/NotificationArea'
import { UserProfile } from '@/components/custom/navigation/UserProfile'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { User } from '@/lib/constants/interface'
import { AnimatePresence, motion } from 'framer-motion'
import { LucideIcon, Menu } from 'lucide-react'
import { useState } from 'react'

type SidebarItem = {
  name: string
  href?: string
  icon: LucideIcon
  action?: string
  children?: SidebarItem[]
}

type SidebarSection = {
  title?: string
  items: SidebarItem[]
}

export default function SidebarNav({
  sections,
  activePath,
  onAction,
  user,
}: {
  sections: SidebarSection[]
  activePath: string
  onAction?: (action: string) => void
  user: User | null
}) {
  const [sheetOpen, setSheetOpen] = useState(false)

  const renderUserHeader = () => (
    <div className="flex items-center justify-between rounded-xl bg-muted p-4">
      <AnimatePresence>
        {user ? (
          <motion.div
            key="userLoaded"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary font-semibold">
              {user?.first_name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Welcome back</p>
              <p className="text-base font-semibold text-foreground">
                {user?.first_name}
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex flex-col space-y-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Notifications dropdown */}
      <NotificationArea align="start" />
    </div>
  )

  const renderNav = (close?: () => void) => (
    <div className="flex-1 flex flex-col space-y-6">
      {sections.map((section, i) => (
        <NavList
          key={i}
          title={section.title}
          items={section.items}
          activePath={activePath}
          close={close}
          onAction={onAction}
        />
      ))}
    </div>
  )

  return (
    <>
      {/* Large screens */}
      <aside className="bg-background/60 hidden lg:flex lg:inset-y-0 lg:z-50 lg:w-72 lg:flex-col border-r border-border p-4">
        <div className="flex flex-col gap-y-8 w-full">
          {renderUserHeader()}
          {renderNav()}
        </div>
        <div className="mt-auto">
          <UserProfile user={user} />
        </div>
      </aside>

      {/* Small screens */}
      <div className="bg-background/60 lg:hidden flex h-16 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-3">
          <AnimatePresence>
            {user ? (
              <motion.div
                key="userMobileLoaded"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.4 }}
                className="flex items-center gap-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary font-semibold">
                  {user?.first_name?.[0]?.toUpperCase()}
                </div>
                <span className="font-semibold">
                  {user?.first_name} {user?.last_name}
                </span>
              </motion.div>
            ) : (
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2">
          <NotificationArea align="end" />
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
