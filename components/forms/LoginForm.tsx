'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

import { PasswordField } from '@/components/custom/inputs/PasswordInput'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { loginSchema } from '@/lib/constants/schema'
import { LoginFormValues } from '@/lib/constants/types'
import { useDRFToastError } from '@/lib/hooks/useDRFToastError'
import useUserProfileStore from '@/lib/store/useUserProfileStore'
import api from '@/lib/utils/api'
import { setCookie } from '@/lib/utils/cookies'
import { setToken } from '@/lib/utils/tokens'

export function LoginForm() {
  const router = useRouter()
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
      remember_me: true,
    },
  })

  const { handleSubmit, control, formState } = form
  const { isSubmitting, errors } = formState
  const setUserProfile = useUserProfileStore((state) => state.setUserProfile)
  const { handleError } = useDRFToastError()

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const response = await api.post('/auth/login/', values)
      setToken('access', response.data.access)
      setToken('refresh', response.data.refresh)
      setToken('remember', values.remember_me ? 'true' : 'false')
      setCookie('access', response.data.access)
      setCookie('refresh', response.data.refresh)
      setUserProfile(response.data)

      router.push('/dashboard')
      toast.success(`Welcome back, ${response.data.first_name}!`)
    } catch (err: any) {
      handleError(err)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto rounded-3xl border border-border/40 bg-background/70 backdrop-blur-lg shadow-2xl">
      <CardHeader className="flex flex-col items-center gap-1">
        <h2 className="text-3xl font-bold tracking-tight">Welcome Back</h2>
        <p className="text-center text-muted-foreground text-sm">
          Sign in to continue
        </p>
        <Separator className="w-10 mt-2" />
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <FormField
              control={control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Username</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your username"
                      autoFocus
                      disabled={isSubmitting}
                      className="focus-visible:ring-2 focus-visible:ring-primary"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <PasswordField
              name="password"
              placeholder="••••••••"
              disabled={isSubmitting}
              label="Password"
            />

            <FormField
              control={control}
              name="remember_me"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                      />
                      <span className="text-sm leading-none">Remember Me</span>
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full rounded-xl"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Logging in...' : 'Sign In'}
            </Button>

            {errors.root && (
              <div className="text-center text-sm text-destructive">
                {errors.root.message}
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
