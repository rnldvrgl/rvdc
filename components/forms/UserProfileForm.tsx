'use client'

import DatePicker from '@/components/custom/inputs/DatePicker'
import ImageUpload from '@/components/custom/inputs/ImageUpload'
import { PasswordField } from '@/components/custom/inputs/PasswordInput'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { TUserProfile } from '@/lib/constants/types'
import { Loader } from 'lucide-react'

import { UseFormReturn } from 'react-hook-form'

type UserProfileFormProps = {
  form: UseFormReturn<TUserProfile>
  onSubmit: (values: TUserProfile) => void | Promise<void>
  upload: {
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    handleFileRemove: () => void
    image: string
  }
}

const UserProfileForm = ({ form, onSubmit, upload }: UserProfileFormProps) => {
  return (
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
          <Card className="lg:col-span-2 space-y-6">
            <CardContent className="px-6 py-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>First Name</FormLabel>
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
                      <FormLabel required>Last Name</FormLabel>
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
                    <FormLabel required>Username</FormLabel>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-2">
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

              <FormField
                control={form.control}
                name="birthday"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <DatePicker
                        label="Birthday"
                        field={field}
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
                      <ImageUpload
                        fieldName={field.name}
                        handleFileChange={upload.handleFileChange}
                        handleFileRemove={upload.handleFileRemove}
                        image={upload.image}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-center md:justify-end pt-4">
                <Button
                  type="submit"
                  className="w-full max-w-56"
                  disabled={
                    form.formState.isSubmitting ||
                    !form.formState.isDirty ||
                    Object.keys(form.formState.errors).length > 0
                  }
                >
                  {form.formState.isSubmitting ? <Loader /> : 'Save settings'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </Form>
  )
}

export default UserProfileForm
