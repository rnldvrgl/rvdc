import { Box } from '@/components/ui/box'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import React, { createElement, useState } from 'react'
import { useFormContext } from 'react-hook-form'

type PasswordFieldProps = {
  name?: string
  placeholder?: string
  description?: string | React.ReactNode
  disabled?: boolean
  label?: string
}

export function PasswordField({
  name = 'password',
  placeholder = 'Enter password',
  description,
  disabled,
  label,
}: PasswordFieldProps) {
  const { control, getFieldState } = useFormContext()
  const [passwordVisibility, setPasswordVisibility] = useState(false)

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <Box className="relative">
              <Input
                {...field}
                disabled={disabled}
                type={passwordVisibility ? 'text' : 'password'}
                autoComplete="on"
                placeholder={placeholder}
                className={`pr-12 ${
                  getFieldState(name).error && 'text-destructive'
                }`}
              />
              <Box
                className="absolute inset-y-0 right-0 flex cursor-pointer items-center p-3 text-muted-foreground"
                onClick={() => setPasswordVisibility(!passwordVisibility)}
              >
                {createElement(passwordVisibility ? EyeOffIcon : EyeIcon, {
                  className: 'size-6',
                })}
              </Box>
            </Box>
          </FormControl>
          <FormMessage />
          {description && <FormDescription>{description}</FormDescription>}
        </FormItem>
      )}
    />
  )
}
