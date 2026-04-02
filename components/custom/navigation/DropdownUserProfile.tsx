"use client"

import DropdownModeToggle from "@/components/custom/theme/DropdownModeToggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useMounted } from "@/lib/hooks/useMounted"
import { useAuthentications } from "@/lib/mutations/useAuthentication"
import { getToken } from "@/lib/utils/tokens"
import { LogOutIcon } from "lucide-react"
import React from "react"

export type DropdownUserProfileProps = {
  children: React.ReactNode
  align?: "center" | "start" | "end"
}

export function DropdownUserProfile({
  children,
  align = "end",
}: DropdownUserProfileProps) {
  const refresh = getToken("refresh")
  const mounted = useMounted()
  const { useLogout } = useAuthentications()
  const logout = useLogout()

  if (!mounted) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        className="w-56"
        alignOffset={10}
      >
        <DropdownModeToggle />

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => {
              if (!refresh) return
              logout.mutateAsync(refresh)
            }}
            className="inline-flex justify-between w-full"
          >
            Signout
            <LogOutIcon className="ml-1 size-3 text-muted-foreground" />
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
