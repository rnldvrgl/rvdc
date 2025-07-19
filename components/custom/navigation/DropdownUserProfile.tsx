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

      // Clear localStorage/sessionStorage tokens
      removeToken('access')
      removeToken('refresh')
      removeToken('remember')

      // Tell the server to delete HTTP-only cookies
      const res = await fetch('/api/delete-cookie', {
        method: 'POST',
        credentials: 'include',
      })

      if (!res.ok) {
        throw new Error('Failed to delete auth cookies')
      }

      // Wait to ensure cookies are gone before redirect
      await new Promise((resolve) => setTimeout(resolve, 200))

      // Clear client-side user state
      clearUserProfile()

      toast.success(response.data.detail || 'Logout successful.')

      // Redirect
      router.push('/')
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
