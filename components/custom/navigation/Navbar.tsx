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
import { cn, getDisplayImage } from "@/lib/utils/helpers"
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

function SidebarToggle() {
    const { collapsed, toggle } = useSidebarCollapse()
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    type="button"
                    onClick={toggle}
                    className="flex items-center justify-center size-9 rounded-xl text-white bg-primary/90 dark:bg-primary/20 hover:bg-primary dark:hover:bg-primary/40 transition-colors cursor-pointer shrink-0"
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
    )
}

function SearchTrigger() {
    return (
        <button
            type="button"
            onClick={() => {
                document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }))
            }}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-muted/50 border border-border/40 text-muted-foreground text-sm w-full max-w-60 cursor-pointer hover:bg-muted/70 transition-colors"
        >
            <Search className="size-4 shrink-0" />
            <span className="text-muted-foreground/60 truncate">Search... </span>
            <kbd className="ml-auto text-[10px] font-mono bg-background/60 px-1.5 py-0.5 rounded border border-border/50 shrink-0">
                Ctrl+K
            </kbd>
        </button>
    )
}

function UserAvatar({ user, displayImage, size }: { user: User; displayImage?: string; size: "sm" | "md" }) {
    return (
        <Avatar className={cn(size === "sm" ? "size-8" : "size-9", "ring-2 ring-primary/10")}>
            <AvatarImage src={displayImage} alt={`${user.first_name} ${user.last_name}`} />
            <AvatarFallback className="text-xs">
                {user.first_name?.[0]}
                {user.last_name?.[0]}
            </AvatarFallback>
        </Avatar>
    )
}

function UserMenu({ user }: { user: User | null }) {
    const displayImage = getDisplayImage(user?.profile_image)
    const refresh = getToken("refresh")
    const { useLogout } = useAuthentications()
    const logout = useLogout()

    if (!user) {
        return (
            <div className="flex items-center gap-2.5 rounded-xl px-2 py-1.5">
                <Skeleton className="size-8 rounded-full" />
                <div className="flex flex-col gap-1">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-2.5 w-16" />
                </div>
            </div>
        )
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-muted/60 transition-colors cursor-pointer"
                >
                    <UserAvatar user={user} displayImage={displayImage} size="sm" />
                    <div className="hidden sm:flex flex-col items-start min-w-0">
                        <span className="text-sm font-semibold text-foreground truncate leading-tight">
                            {user.first_name} {user.last_name}
                        </span>
                        <span className="text-[11px] text-muted-foreground/60 leading-tight truncate capitalize">
                            {user.role || "User"}
                        </span>
                    </div>
                    <ChevronDown className="size-3.5 text-muted-foreground/50 ml-1 shrink-0 hidden sm:block" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-0">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
                    <UserAvatar user={user} displayImage={displayImage} size="md" />
                    <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">
                            {user.first_name} {user.last_name}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate capitalize">
                            {user.email || user.role || "User"}
                        </p>
                    </div>
                </div>
                <div className="p-1">
                    <DropdownModeToggle userId={user?.id} />
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        <DropdownMenuItem asChild>
                            <Link href="/settings/profile" className="cursor-pointer">
                                <UserIcon className="mr-2 size-4" />
                                Profile
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        <DropdownMenuItem
                            onClick={() => {
                                if (!refresh) return
                                logout.mutateAsync(refresh)
                            }}
                            className="cursor-pointer"
                        >
                            <LogOutIcon className="mr-2 size-4" />
                            Sign out
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export function Navbar({ user }: { user: User | null }) {
    return (
        <header className="hidden lg:block sticky top-0 z-30 px-4 pt-4">
            <nav className="flex items-center justify-between gap-4 h-14 px-2 rounded-2xl border border-sidebar-border dark:border-sidebar-border/70  bg-sidebar/50 backdrop-blur-md shadow-sm supports-backdrop-blur:bg-sidebar/20">
                {/* Left: Toggle + Search */}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <SidebarToggle />
                    <SearchTrigger />
                </div>

                {/* Right: Notifications + User dropdown */}
                <div className="flex items-center gap-1.5 shrink-0">
                    <NotificationArea align="end" />
                    <UserMenu user={user} />
                </div>
            </nav>
        </header>
    )
}
