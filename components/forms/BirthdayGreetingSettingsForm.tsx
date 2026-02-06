"use client"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useBirthdayGreetingSettingsMutations } from "@/lib/mutations/useBirthdayGreetingSettingsMutations"
import { SystemSettings } from "@/lib/queries/useSystemSettings"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

const birthdayGreetingSettingsSchema = z.object({
  birthday_greeting_enabled: z.boolean(),
  birthday_greeting_title: z.string().min(1, "Title is required").max(100),
  birthday_greeting_message: z.string().min(1, "Message is required"),
  birthday_greeting_button_text: z
    .string()
    .min(1, "Button text is required")
    .max(50),
  birthday_greeting_show_confetti: z.boolean(),
  birthday_greeting_show_emojis: z.boolean(),
  birthday_greeting_male_emojis: z.string().min(1, "Male emojis are required"),
  birthday_greeting_female_emojis: z
    .string()
    .min(1, "Female emojis are required"),
})

type BirthdayGreetingSettingsFormValues = z.infer<
  typeof birthdayGreetingSettingsSchema
>

interface BirthdayGreetingSettingsFormProps {
  settings: SystemSettings
}

export function BirthdayGreetingSettingsForm({
  settings,
}: BirthdayGreetingSettingsFormProps) {
  const { updateSettings } = useBirthdayGreetingSettingsMutations()

  const form = useForm<BirthdayGreetingSettingsFormValues>({
    resolver: zodResolver(birthdayGreetingSettingsSchema),
    defaultValues: {
      birthday_greeting_enabled: settings.birthday_greeting_enabled,
      birthday_greeting_title: settings.birthday_greeting_title,
      birthday_greeting_message: settings.birthday_greeting_message,
      birthday_greeting_button_text: settings.birthday_greeting_button_text,
      birthday_greeting_show_confetti: settings.birthday_greeting_show_confetti,
      birthday_greeting_show_emojis: settings.birthday_greeting_show_emojis,
      birthday_greeting_male_emojis: settings.birthday_greeting_male_emojis,
      birthday_greeting_female_emojis: settings.birthday_greeting_female_emojis,
    },
  })

  // Update form when settings change
  useEffect(() => {
    if (settings) {
      form.reset({
        birthday_greeting_enabled: settings.birthday_greeting_enabled,
        birthday_greeting_title: settings.birthday_greeting_title,
        birthday_greeting_message: settings.birthday_greeting_message,
        birthday_greeting_button_text: settings.birthday_greeting_button_text,
        birthday_greeting_show_confetti:
          settings.birthday_greeting_show_confetti,
        birthday_greeting_show_emojis: settings.birthday_greeting_show_emojis,
        birthday_greeting_male_emojis: settings.birthday_greeting_male_emojis,
        birthday_greeting_female_emojis:
          settings.birthday_greeting_female_emojis,
      })
    }
  }, [settings, form])

  const onSubmit = async (data: BirthdayGreetingSettingsFormValues) => {
    await updateSettings.mutateAsync(data)
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
      >
        {/* Birthday Greeting Enabled */}
        <FormField
          control={form.control}
          name="birthday_greeting_enabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  Enable Birthday Greetings
                </FormLabel>
                <FormDescription>
                  Show birthday greeting modal to employees on their birthday
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Birthday Greeting Title */}
        <FormField
          control={form.control}
          name="birthday_greeting_title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Birthday Greeting Title</FormLabel>
              <FormControl>
                <Input
                  placeholder="Happy Birthday!"
                  {...field}
                  disabled={!form.watch("birthday_greeting_enabled")}
                />
              </FormControl>
              <FormDescription>
                The title shown in the birthday greeting modal
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Birthday Greeting Message */}
        <FormField
          control={form.control}
          name="birthday_greeting_message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Birthday Greeting Message</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Wishing you a wonderful day..."
                  className="min-h-[120px]"
                  {...field}
                  disabled={!form.watch("birthday_greeting_enabled")}
                />
              </FormControl>
              <FormDescription>
                The message shown in the birthday greeting modal
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Birthday Greeting Button Text */}
        <FormField
          control={form.control}
          name="birthday_greeting_button_text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Button Text</FormLabel>
              <FormControl>
                <Input
                  placeholder="Thank You! 💝"
                  {...field}
                  disabled={!form.watch("birthday_greeting_enabled")}
                />
              </FormControl>
              <FormDescription>
                Text shown on the dismiss button
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Show Confetti */}
        <FormField
          control={form.control}
          name="birthday_greeting_show_confetti"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Show Confetti</FormLabel>
                <FormDescription>
                  Display animated confetti effects
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={!form.watch("birthday_greeting_enabled")}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Show Emojis */}
        <FormField
          control={form.control}
          name="birthday_greeting_show_emojis"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  Show Emoji Decorations
                </FormLabel>
                <FormDescription>
                  Display emoji decorations at the bottom
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={!form.watch("birthday_greeting_enabled")}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Male Emoji Selection */}
        <FormField
          control={form.control}
          name="birthday_greeting_male_emojis"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Male Emoji Decorations</FormLabel>
              <FormControl>
                <Input
                  placeholder="🎈,🎊,🎁,🎉,🍺"
                  {...field}
                  disabled={
                    !form.watch("birthday_greeting_enabled") ||
                    !form.watch("birthday_greeting_show_emojis")
                  }
                />
              </FormControl>
              <FormDescription>
                Comma-separated emojis for male employees (e.g.,
                🎈,🎊,🎁,🎉,🍺,🎂)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Female Emoji Selection */}
        <FormField
          control={form.control}
          name="birthday_greeting_female_emojis"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Female Emoji Decorations</FormLabel>
              <FormControl>
                <Input
                  placeholder="🎈,🎊,🎁,🎉,💐"
                  {...field}
                  disabled={
                    !form.watch("birthday_greeting_enabled") ||
                    !form.watch("birthday_greeting_show_emojis")
                  }
                />
              </FormControl>
              <FormDescription>
                Comma-separated emojis for female employees (e.g.,
                🎈,🎊,🎁,🎉,💐,🎂)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            disabled={updateSettings.isPending}
          >
            Reset
          </Button>
          <Button
            type="submit"
            disabled={updateSettings.isPending}
          >
            {updateSettings.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
