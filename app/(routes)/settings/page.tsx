'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import Loader from '@/app/loading'
import UserProfileForm from '@/components/forms/UserProfileForm'
import { userProfileSchema } from '@/lib/constants/schema'
import useFileUpload from '@/lib/hooks/useFileUpload'
import { useUserProfile } from '@/lib/queries/useUserProfile'
import useUserProfileStore from '@/lib/store/useUserProfileStore'
import api from '@/lib/utils/api'
import { formatLocalDate, normalizeProfileImage } from '@/lib/utils/helpers'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { data, isLoading, refetch } = useUserProfile()
  const setUserProfile = useUserProfileStore((state) => state.setUserProfile)
  const userProfile = useUserProfileStore((state) => state.userProfile)

  type TUserProfile = z.infer<typeof userProfileSchema>
  const form = useForm<TUserProfile>({
    resolver: zodResolver(userProfileSchema) as any,
    defaultValues: {
      email: '',
      username: '',
      first_name: '',
      last_name: '',
      contact_number: '',
      birthday: undefined,
      profile_image: '',
    },
  })

  useEffect(() => {
    if (data) setUserProfile(data)
  }, [data, setUserProfile])

  useEffect(() => {
    if (userProfile) {
      form.reset({
        email: userProfile.email ?? '',
        username: userProfile.username ?? '',
        first_name: userProfile.first_name ?? '',
        last_name: userProfile.last_name ?? '',
        contact_number: userProfile.contact_number ?? '',
        birthday: userProfile.birthday
          ? new Date(userProfile.birthday)
          : undefined,
        profile_image:
          userProfile.profile_image != null ? userProfile.profile_image : '',
      })
    }
  }, [userProfile, form])

  const upload = useFileUpload({
    form,
    fieldName: 'profile_image',
    initialImage: userProfile?.profile_image,
  })

  async function onSubmit(values: TUserProfile) {
    const payload: any = {
      ...values,
      birthday: values.birthday ? formatLocalDate(values.birthday) : undefined,
      profile_image: normalizeProfileImage(values.profile_image),
    }

    if (!payload.new_password) delete payload.new_password
    if (!payload.current_password) delete payload.current_password
    try {
      const response = await api.patch('/users/profile/', payload)
      toast.success('Profile updated successfully.')
      setUserProfile(response.data)
      await refetch()
      form.setValue('current_password', '')
      form.setValue('new_password', '')
    } catch (error: any) {
      toast.error(
        error?.response?.data?.detail ||
          'An error occurred while saving your profile.',
      )
    }
  }

  if (isLoading) return <Loader />

  return (
    <div className="space-y-12 px-4 lg:px-0">
      <UserProfileForm
        form={form}
        onSubmit={onSubmit}
        upload={upload}
      />
    </div>
  )
}
