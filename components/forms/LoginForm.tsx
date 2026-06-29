"use client"

import { BrandLockup } from "@/components/custom/shared/BrandLockup"
import { PasswordField } from "@/components/custom/inputs/PasswordInput"
import { DeveloperCredit } from "@/components/custom/shared/DeveloperCredit"
import { Spinner } from "@/components/custom/shared/Spinner"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
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
            <BrandLockup
                title="RVDC"
                description="Refrigeration & Air Conditioning Services"
                icon={Snowflake}
            />

            <Card className="border-border/60 shadow-lg">
                <CardHeader className="text-center">
                    <div className="space-y-1">
                        <CardTitle className="text-lg">Sign In</CardTitle>
                        <CardDescription className="text-xs">
                            Access your dashboard
                        </CardDescription>
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

                            <PasswordField
                                name="password"
                                placeholder="Enter your password"
                                disabled={isSubmitting}
                                label="Password"
                            />

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
                                className="w-full font-medium"
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
                    <div className="border-t border-border/60 pt-4">
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
