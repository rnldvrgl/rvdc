"use client"

import DatePicker from "@/components/custom/inputs/DatePicker"
import ImageUpload from "@/components/custom/inputs/ImageUpload"
import { PasswordField } from "@/components/custom/inputs/PasswordInput"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { TUserProfile } from "@/lib/constants/types"
import { AlertCircle, Loader, Save } from "lucide-react"

import { UseFormReturn } from "react-hook-form"

type UserProfileFormProps = {
  form: UseFormReturn<TUserProfile>
  onSubmit: (values: TUserProfile) => void | Promise<void>
  upload: {
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    handleFileRemove: () => void
    image: string
  }
  hasChanges?: boolean
  isSubmitting?: boolean
}

const UserProfileForm = ({
  form,
  onSubmit,
  upload,
  hasChanges = false,
  isSubmitting = false,
}: UserProfileFormProps) => {
  const { formState } = form
  const { errors } = formState

  const hasErrors = Object.keys(errors).length > 0
  const isFormDisabled = isSubmitting || hasErrors || !hasChanges

  // Check if password fields have values
  const currentPassword = form.watch("current_password")
  const newPassword = form.watch("new_password")
  const isChangingPassword = Boolean(currentPassword || newPassword)

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8"
      >
        <div className="grid grid-cols-1 gap-x-8 gap-y-8 lg:grid-cols-3">
          <div>
            <h2 className="text-lg font-semibold">Personal Information</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Update your personal details and account information.
            </p>

            {isChangingPassword && (
              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Both current and new passwords are required to change your
                  password.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <Card className="lg:col-span-2">
            <CardContent className="space-y-6 p-6">
              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>First Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your first name"
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
                          placeholder="Enter your last name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Username */}
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Username</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your username"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email address"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Contact Number */}
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

              {/* Birthday */}
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

              {/* Profile Image */}
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

              {/* Password Section */}
              <div className="pt-6 border-t">
                <h3 className="text-base font-medium mb-4">Change Password</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Leave password fields empty if you don&apos;t want to change
                  your password.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <PasswordField
                    name="current_password"
                    placeholder="Enter current password"
                    label="Current Password"
                    required={isChangingPassword}
                    autoComplete="off"
                  />
                  <PasswordField
                    name="new_password"
                    placeholder="Enter new password"
                    label="New Password"
                    required={isChangingPassword}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t">
                <div className="text-sm text-muted-foreground">
                  {hasChanges ? (
                    <span className="text-amber-600 dark:text-amber-400">
                      You have unsaved changes
                    </span>
                  ) : (
                    "Make changes above to save your profile"
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full sm:w-auto min-w-[120px]"
                  disabled={isFormDisabled}
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
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
