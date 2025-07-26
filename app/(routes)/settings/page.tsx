'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import Loader from '@/app/loading'
import UserProfileForm from '@/components/forms/UserProfileForm'
import { userProfileSchema } from '@/lib/constants/schema'
import { TUserProfile, UserProfilePayload } from '@/lib/constants/types'
import { useDRFToastError } from '@/lib/hooks/useDRFToastError'
import useFileUpload from '@/lib/hooks/useFileUpload'
import { useUserProfile } from '@/lib/queries/useUserProfile'
import useUserProfileStore from '@/lib/store/useUserProfileStore'
import api from '@/lib/utils/api'
import { normalizeProfileImage } from '@/lib/utils/helpers'
import { formatDate } from '@/lib/utils/helpers/date'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { data, isLoading, refetch } = useUserProfile()
  const { handleError } = useDRFToastError()
  const setUserProfile = useUserProfileStore((state) => state.setUserProfile)
  const userProfile = useUserProfileStore((state) => state.userProfile)

  const form = useForm<TUserProfile>({
    resolver: zodResolver(userProfileSchema),
    mode: 'onChange',
    defaultValues: {
      email: userProfile?.email ?? '',
      username: userProfile?.username ?? '',
      first_name: userProfile?.first_name ?? '',
      last_name: userProfile?.last_name ?? '',
      contact_number: userProfile?.contact_number ?? '',
      new_password: '',
      current_password: '',
      birthday: userProfile?.birthday
        ? new Date(userProfile.birthday)
        : undefined,
      profile_image: userProfile?.profile_image ?? '',
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
        new_password: '',
        current_password: '',
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
    const payload: Partial<UserProfilePayload> = {}

    if (values.first_name !== userProfile?.first_name)
      payload.first_name = values.first_name
    if (values.last_name !== userProfile?.last_name)
      payload.last_name = values.last_name
    if (values.username !== userProfile?.username)
      payload.username = values.username
    if (values.email !== userProfile?.email) payload.email = values.email
    if (values.contact_number !== userProfile?.contact_number)
      payload.contact_number = values.contact_number

    if (values.birthday) {
      const formattedBirthday = formatDate(values.birthday)
      if (formattedBirthday !== userProfile?.birthday) {
        payload.birthday = formattedBirthday
      }
    }

    const normalizedImage = normalizeProfileImage(values.profile_image)
    if (
      (normalizedImage === '' && userProfile?.profile_image) ||
      (normalizedImage && normalizedImage !== userProfile?.profile_image)
    ) {
      payload.profile_image = normalizedImage
    }

    if (values.new_password) payload.new_password = values.new_password
    if (values.current_password)
      payload.current_password = values.current_password

    try {
      const response = await api.patch('/users/profile/', payload)
      toast.success('Profile updated successfully.')
      setUserProfile(response.data)
      await refetch()
      form.setValue('current_password', '')
      form.setValue('new_password', '')
    } catch (error: unknown) {
      handleError(error)
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
