"use client"

import { Button } from "@/components/ui/button"
import { User } from "@/lib/constants/interface"
import {
  cn,
  concatString,
  focusRing,
  getDisplayImage,
} from "@/lib/utils/helpers"
import { MoreVertical } from "lucide-react"
import { default as Image } from "next/image"
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
          <Image
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border"
            aria-hidden="true"
            src={`${displayImage}`}
            width={100}
            height={100}
            alt="user"
          />
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
