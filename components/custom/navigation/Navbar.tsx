"use client"

import NotificationArea from "@/components/custom/navigation/NotificationArea"
import DropdownModeToggle from "@/components/custom/theme/DropdownModeToggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { User } from "@/lib/constants/interface"
import { useSidebarCollapse } from "@/lib/hooks/useSidebarCollapse"
import { useAuthentications } from "@/lib/mutations/useAuthentication"
import { getDisplayImage } from "@/lib/utils/helpers"
import { getToken } from "@/lib/utils/tokens"
import {
  ChevronDown,
  LogOutIcon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  UserIcon,
} from "lucide-react"
import Link from "next/link"

export function Navbar({ user }: { user: User | null }) {
  const displayImage = getDisplayImage(user?.profile_image)
  const { collapsed, toggle } = useSidebarCollapse()
  const refresh = getToken("refresh")
  const { useLogout } = useAuthentications()
  const logout = useLogout()

  return (
    <header className="hidden lg:flex items-center justify-between h-14 px-4 shrink-0 mt-4">
      {/* Left: Toggle + Search */}
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={toggle}
              className="flex items-center justify-center size-9 rounded-xl text-white bg-primary/90 dark:bg-primary/20 hover:bg-primary dark:hover:bg-primary/40 transition-colors cursor-pointer"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <PanelLeftOpen className="size-[18px]" />
              ) : (
                <PanelLeftClose className="size-[18px]" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {collapsed ? "Expand sidebar" : "Collapse sidebar"}
          </TooltipContent>
        </Tooltip>

        <button
          type="button"
          onClick={() => {
            document.dispatchEvent(
              new KeyboardEvent("keydown", { key: "k", ctrlKey: true }),
            )
          }}
          className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-muted/50 border border-border/40 text-muted-foreground text-sm min-w-60 cursor-pointer hover:bg-muted/70 transition-colors"
        >
          <Search className="size-4 shrink-0" />
          <span className="text-muted-foreground/60">Search... </span>
          <kbd className="ml-auto text-[10px] font-mono bg-background/60 px-1.5 py-0.5 rounded border border-border/50">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right: Notifications + User dropdown */}
      <div className="flex items-center gap-1.5">
        <NotificationArea align="end" />

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-muted/60 transition-colors cursor-pointer"
            >
              {user ? (
                <>
                  <Avatar className="size-8 ring-2 ring-primary/10">
                    <AvatarImage
                      src={displayImage}
                      alt={`${user.first_name} ${user.last_name}`}
                    />
                    <AvatarFallback className="text-xs">
                      {user.first_name?.[0]}
                      {user.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start min-w-0">
                    <span className="text-sm font-semibold text-foreground truncate leading-tight">
                      {user.first_name} {user.last_name}
                    </span>
                    <span className="text-[11px] text-muted-foreground/60 leading-tight truncate capitalize">
                      {user.role || "User"}
                    </span>
                  </div>
                  <ChevronDown className="size-3.5 text-muted-foreground/50 ml-1 shrink-0" />
                </>
              ) : (
                <>
                  <Skeleton className="size-8 rounded-full" />
                  <div className="flex flex-col gap-1">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-2.5 w-16" />
                  </div>
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-64 p-0"
          >
            {/* User header */}
            {user && (
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
                <Avatar className="size-9 ring-2 ring-primary/10">
                  <AvatarImage
                    src={displayImage}
                    alt={`${user.first_name} ${user.last_name}`}
                  />
                  <AvatarFallback className="text-xs">
                    {user.first_name?.[0]}
                    {user.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate capitalize">
                    {user.email || user.role || "User"}
                  </p>
                </div>
              </div>
            )}
            <div className="p-1">
              <DropdownModeToggle />
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link
                    href="/settings/profile"
                    className="cursor-pointer"
                  >
                    <UserIcon className="mr-2 size-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => logout.mutateAsync(refresh)}
                  className="cursor-pointer"
                >
                  <LogOutIcon className="mr-2 size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
