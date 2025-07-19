'use client'

import DropdownModeToggle from '@/components/custom/theme/DropdownModeToggle'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useDRFToastError } from '@/lib/hooks/useDRFToastError'
import { useMounted } from '@/lib/hooks/useMounted'
import useUserProfileStore from '@/lib/store/useUserProfileStore'
import api from '@/lib/utils/api'
import { getToken, removeToken } from '@/lib/utils/tokens'
import { ArrowUpRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React from 'react'
import toast from 'react-hot-toast'

export type DropdownUserProfileProps = {
  children: React.ReactNode
  align?: 'center' | 'start' | 'end'
}

export function DropdownUserProfile({
  children,
  align = 'start',
}: DropdownUserProfileProps) {
  const router = useRouter()
  const mounted = useMounted()
  const { handleError } = useDRFToastError()
  const clearUserProfile = useUserProfileStore(
    (state) => state.clearUserProfile,
  )

  const handleLogout = async () => {
    try {
      const response = await api.post('/auth/logout/', {
        refresh: getToken('refresh'),
      })
      // Clear local tokens + cookies
      removeToken('access')
      removeToken('refresh')
      removeToken('remember')

      await fetch('/api/delete-cookie', {
        method: 'POST',
        credentials: 'include',
      })

      // Clear zustand user store
      clearUserProfile()

      toast.success(response.data.detail || 'Logout successful.')
      window.location.href = '/'
    } catch (error) {
      handleError(error)
    }
  }

  if (!mounted) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        className="w-56"
      >
        <DropdownModeToggle />

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem onClick={handleLogout}>
            Signout
            <ArrowUpRight className="ml-1 size-3 text-muted-foreground" />
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
