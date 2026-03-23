"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { User } from "@/lib/constants/interface"
import {
  cn,
  concatString,
  focusRing,
  getDisplayImage,
} from "@/lib/utils/helpers"
import { MoreVertical } from "lucide-react"
import { DropdownUserProfile } from "./DropdownUserProfile"

type Props = {
  user: User | null
}

export const UserProfile = ({ user }: Props) => {
  const displayImage = getDisplayImage(user?.profile_image)

  return (
    <DropdownUserProfile>
      <Button
        aria-label="User settings"
        variant="ghost"
        className={cn(
          focusRing,
          "group flex w-full items-center justify-between rounded-md text-sm font-medium ",
        )}
      >
        <span className="flex items-center gap-3">
          <Avatar
            className="size-8 border"
            aria-hidden="true"
          >
            <AvatarImage
              src={displayImage}
              alt="user"
            />
            <AvatarFallback className="text-xs">
              {user?.first_name?.[0]}
              {user?.last_name?.[0]}
            </AvatarFallback>
          </Avatar>
          <span>
            {user ? concatString(user.first_name, user.last_name) : "Guest"}
          </span>
        </span>
        <MoreVertical
          className="size-4 shrink-0"
          aria-hidden="true"
        />
      </Button>
    </DropdownUserProfile>
  )
}
