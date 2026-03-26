"use client"

import { PasswordField } from "@/components/custom/inputs/PasswordInput"
import { DeveloperCredit } from "@/components/custom/shared/DeveloperCredit"
import { Spinner } from "@/components/custom/shared/Spinner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { loginSchema } from "@/lib/constants/schema"
import { LoginFormValues } from "@/lib/constants/types"
import { useAuthentications } from "@/lib/mutations/useAuthentication"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRight, Shield, Snowflake, User } from "lucide-react"
import { useForm } from "react-hook-form"

export function LoginForm() {
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      remember_me: true,
    },
  })

  const { handleSubmit, control, formState } = form
  const { isSubmitting } = formState
  const { useLogin } = useAuthentications()
  const { mutateAsync } = useLogin()

  const onSubmit = async (values: LoginFormValues) => {
    await mutateAsync(values)
  }

  return (
    <div className="w-full space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-4">
        <div className="mx-auto w-20 h-20 bg-linear-to-br from-purple-700 via-violet-700 to-purple-800 dark:from-purple-500 dark:via-violet-500 dark:to-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/25 relative overflow-hidden">
          <div className="absolute inset-2 bg-white/5 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <Snowflake className="w-6 h-6 text-white" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-linear-to-r from-purple-700 via-violet-700 to-purple-800 dark:from-purple-500 dark:via-violet-500 dark:to-purple-600 bg-clip-text text-transparent">
            RVDC
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Refrigeration & Air Conditioning Services
          </p>
        </div>
      </div>

      {/* Main Login Card */}
      <Card className="shadow-lg border-slate-200 dark:border-slate-800">
        <CardHeader className="text-center">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground">Sign In</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Access your dashboard
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <Form {...form}>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <FormField
                control={control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Username
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 z-10" />
                        <Input
                          placeholder="Enter your username"
                          className="pl-10 pr-4"
                          autoFocus
                          disabled={isSubmitting}
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <PasswordField
                  name="password"
                  placeholder="Enter your password"
                  disabled={isSubmitting}
                  label="Password"
                />
              </div>

              <FormField
                control={control}
                name="remember_me"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isSubmitting}
                          />
                          <label className="text-sm text-muted-foreground cursor-pointer select-none">
                            Keep me signed in
                          </label>
                        </div>
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-linear-to-r from-purple-700 via-violet-700 to-purple-800 dark:from-purple-500 dark:via-violet-500 dark:to-purple-600 text-white font-medium py-2.5 transition-all duration-200 shadow-md hover:shadow-lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Spinner className="w-4 h-4" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </form>
          </Form>

          {/* Security Footer */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center gap-2">
              <Shield className="w-4 h-4 text-success" />
              <span className="text-xs text-muted-foreground">
                Your connection is secure and encrypted
              </span>
            </div>
          </div>

          {/* Developer Credit */}
          <DeveloperCredit
            variant="subtle"
            size="sm"
          />
        </CardContent>
      </Card>
    </div>
  )
}
