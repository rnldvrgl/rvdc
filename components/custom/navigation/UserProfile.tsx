'use client'

import { Button } from '@/components/ui/button'
import { User } from '@/lib/constants/interface'
import { cn, concatString, focusRing } from '@/lib/utils/helpers'
import { MoreVertical, User as UserIcon } from 'lucide-react'
import Image from 'next/image'
import { DropdownUserProfile } from './DropdownUserProfile'

type Props = {
  user: User | null
}

export const UserProfile = ({ user }: Props) => {
  return (
    <DropdownUserProfile>
      <Button
        aria-label="User settings"
        variant="ghost"
        className={cn(
          focusRing,
          'group flex w-full items-center justify-between rounded-md p-5 text-sm font-medium ',
        )}
      >
        <span className="flex items-center gap-3">
          {user?.profile_image ? (
            <Image
              className="flex size-8 shrink-0 items-center justify-center rounded-full border"
              aria-hidden="true"
              src={`${process.env.NEXT_PUBLIC_BASE_URL}${user.profile_image}`}
              width={100}
              height={100}
              alt="user"
            />
          ) : (
            <span className="flex size-8 items-center justify-center rounded-full border bg-muted text-muted-foreground">
              <UserIcon className="size-4" />
            </span>
          )}
          <span>
            {user ? concatString(user.first_name, user.last_name) : 'Guest'}
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
