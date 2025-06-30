'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

import { PasswordField } from '@/components/custom/inputs/PasswordInput'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUserProfile } from '@/lib/queries/useUserProfile'
import useUserProfileStore from '@/lib/store/useUserProfileStore'
import api from '@/lib/utils/api'
import toast from 'react-hot-toast'

const formSchema = z.object({
  email: z.string().email(),
  current_password: z.string().optional(),
  new_password: z.string().optional(),
  username: z.string().min(2),
  first_name: z.string().min(2),
  last_name: z.string().min(2),
  contact_number: z.string().min(7),
  birthday: z.string(),
  profile_image: z.any().optional(),
})

export default function SettingsPage() {
  const { data, isLoading, refetch } = useUserProfile()
  const setUserProfile = useUserProfileStore((state) => state.setUserProfile)
  const userProfile = useUserProfileStore((state) => state.userProfile)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      username: '',
      first_name: '',
      last_name: '',
      contact_number: '',
      birthday: '',
    },
  })

  useEffect(() => {
    if (data) setUserProfile(data)
  }, [data, setUserProfile])

  useEffect(() => {
    if (userProfile) {
      form.reset({
        email: userProfile.email || '',
        username: userProfile.username || '',
        first_name: userProfile.first_name || '',
        last_name: userProfile.last_name || '',
        contact_number: userProfile.contact_number || '',
        birthday: userProfile.birthday || '',
      })
    }
  }, [userProfile, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const payload = { ...values }
    if (!payload.new_password) delete payload.new_password
    if (!payload.current_password) delete payload.current_password

    try {
      // build FormData so we can send files + strings
      const formData = new FormData()
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value)
        }
      })

      const response = await api.patch('/users/profile/', formData)

      toast.success('Profile updated successfully.')

      // update Zustand immediately
      setUserProfile(response.data)

      // refetch tanstack query to update global cache
      await refetch()

      // clear password fields after submit
      form.setValue('current_password', undefined)
      form.setValue('new_password', undefined)
    } catch (error: any) {
      toast.error(
        error?.response?.data?.detail ||
          'An error occurred while saving your profile.',
      )
    }
  }

  return (
    <div className="space-y-12 px-4 lg:px-0">
      {isLoading ? (
        <div>Loading profile...</div>
      ) : (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-10"
          >
            <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-3">
              <div>
                <h2 className="text-lg font-semibold">Personal Information</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Manage your personal information and credentials.
                </p>
              </div>
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Juan"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Dela Cruz"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="juandelacruz"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contact_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="09171234567"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="juan.delacruz@email.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <PasswordField
                    name="current_password"
                    placeholder="••••••••"
                    label="Current Password"
                  />

                  <PasswordField
                    name="new_password"
                    placeholder="••••••••"
                    label="New Password"
                  />
                </div>

                <FormField
                  control={form.control}
                  name="birthday"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Birthday</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="profile_image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profile Image</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          onChange={(e) => field.onChange(e.target.files?.[0])}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end pt-4">
                  <Button type="submit">Save settings</Button>
                </div>
              </div>
            </div>
          </form>
        </Form>
      )}
    </div>
  )
}
