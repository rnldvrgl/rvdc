"use client"

import NavList from "@/components/custom/navigation/NavList"
import { UserProfile } from "@/components/custom/navigation/UserProfile"
import { DeveloperCredit } from "@/components/custom/shared/DeveloperCredit"
import { ModeToggle } from "@/components/custom/theme/ModeToggle"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { User } from "@/lib/constants/interface"
import { useAuthentications } from "@/lib/mutations/useAuthentication"
import { getDisplayImage } from "@/lib/utils/helpers"
import { getToken } from "@/lib/utils/tokens"
import { RemixiconComponentType } from "@remixicon/react"
import { AnimatePresence, motion } from "framer-motion"
import { LogOutIcon, LucideIcon, Menu, X } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

type SidebarItem = {
  name: string
  href?: string
  icon: LucideIcon | RemixiconComponentType
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
  const refresh = getToken("refresh")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { useLogout } = useAuthentications()
  const logout = useLogout()
  const displayImage = getDisplayImage(user?.profile_image)
  const hasCustomImage =
    user?.profile_image && !user.profile_image.includes("default_image")

  const renderUserHeader = () => (
    <div className="flex items-center justify-between rounded-lg bg-primary/10 dark:bg-muted/50 p-3 border border-border/50">
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
            {hasCustomImage ? (
              <Image
                src={displayImage}
                alt={`${user?.first_name} ${user?.last_name}`}
                width={36}
                height={36}
                className="h-9 w-9 rounded-full object-cover border border-border"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-primary font-semibold text-sm">
                {user?.first_name?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Welcome back</p>
              <p className="text-sm font-semibold text-foreground truncate">
                {user?.first_name}
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex flex-col space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        )}
      </AnimatePresence>

      <ModeToggle />
      {/* Notifications dropdown */}
      {/* DISABLED */}
      {/* <NotificationArea align="start" /> */}
    </div>
  )

  const renderNav = (close?: () => void) => (
    <div className="flex-1 flex flex-col space-y-6">
      {sections.length > 0 &&
        sections.map((section, i) =>
          section.items.length > 0 ? (
            <NavList
              key={i}
              title={section.title}
              items={section.items}
              activePath={activePath}
              close={close}
              onAction={onAction}
            />
          ) : null,
        )}
    </div>
  )

  return (
    <>
      {/* Large screens */}
      <aside className="hidden lg:flex lg:inset-y-0 lg:z-50 lg:w-80 lg:flex-col border-r bg-primary/5 border-border px-6 py-10 h-full overflow-y-auto">
        <div className="flex flex-col gap-y-8 w-full pb-4">
          {renderUserHeader()}
          {renderNav()}
        </div>
        <div className="mt-auto space-y-4">
          <Button
            variant="default"
            className="w-full"
            onClick={() => logout.mutateAsync(refresh)}
          >
            <LogOutIcon />
            Signout
          </Button>
          <DeveloperCredit
            variant="subtle"
            size="sm"
          />
          {/* <UserProfile user={user} /> */}
        </div>
      </aside>

      {/* Small screens - Full screen mobile menu */}
      <div className="lg:hidden flex h-16 items-center justify-between  bg-primary/5 border-b border-border px-6">
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
                {hasCustomImage ? (
                  <Image
                    src={displayImage}
                    alt={`${user?.first_name} ${user?.last_name}`}
                    width={36}
                    height={36}
                    className="h-9 w-9 rounded-full object-cover border border-border"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/30 text-primary font-semibold text-sm">
                    {user?.first_name?.[0]?.toUpperCase()}
                  </div>
                )}
                <span className="font-semibold text-sm">
                  {user?.first_name} {user?.last_name}
                </span>
              </motion.div>
            ) : (
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2">
          {/* <NotificationArea align="end" /> */}
          <Button
            size="icon"
            className="rounded-lg"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Full Screen Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden fixed inset-0 z-50 bg-background flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border shrink-0 bg-primary/5">
              <div className="flex items-center gap-3">
                {user &&
                  (hasCustomImage ? (
                    <Image
                      src={displayImage}
                      alt={`${user?.first_name} ${user?.last_name}`}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full object-cover border border-border"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/30 text-primary font-semibold text-lg">
                      {user?.first_name?.[0]?.toUpperCase()}
                    </div>
                  ))}
                <div>
                  <p className="text-sm font-semibold">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user?.role || "User"}
                  </p>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            {/* Scrollable Navigation */}
            <div className="flex-1 overflow-y-auto">
              <div className="py-6 px-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className="space-y-6"
                >
                  {sections.length > 0 &&
                    sections.map((section, i) =>
                      section.items.length > 0 ? (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + i * 0.05, duration: 0.3 }}
                        >
                          <NavList
                            title={section.title}
                            items={section.items}
                            activePath={activePath}
                            close={() => setMobileMenuOpen(false)}
                            onAction={(action) => {
                              onAction?.(action)
                              setMobileMenuOpen(false)
                            }}
                          />
                        </motion.div>
                      ) : null,
                    )}
                </motion.div>
              </div>
            </div>
            {/* Footer */}
            <div className="shrink-0 py-2 px-4 border-t border-border space-y-3 mb-2">
              <UserProfile user={user} />
              <DeveloperCredit
                variant="subtle"
                size="sm"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
