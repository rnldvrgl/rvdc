"use client"

import { Button } from "@/components/ui/button"
import { useSystemSettings } from "@/lib/queries/useSystemSettings"
import { useUserProfile } from "@/lib/queries/useUserProfile"
import { Cake, Gift, PartyPopper, X } from "lucide-react"
import { useEffect, useState } from "react"

export function BirthdayGreeting() {
  const { data: profile } = useUserProfile()
  const { data: settings } = useSystemSettings()
  const [showGreeting, setShowGreeting] = useState(false)
  const [confetti, setConfetti] = useState<
    Array<{ id: number; left: number; delay: number; duration: number }>
  >([])

  useEffect(() => {
    if (!profile?.birthday || !settings?.birthday_greeting_enabled) return

    // Check if it's the user's birthday
    const today = new Date()
    const birthday = new Date(profile.birthday)

    const isToday =
      today.getDate() === birthday.getDate() &&
      today.getMonth() === birthday.getMonth()

    if (!isToday) return

    // Check if user has already seen the greeting today
    const storageKey = `birthday-greeting-seen-${today.toDateString()}-${profile.id}`
    const hasSeenToday = localStorage.getItem(storageKey)

    if (!hasSeenToday) {
      setShowGreeting(true)
      // Generate confetti
      const confettiArray = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 3 + Math.random() * 2,
      }))
      setConfetti(confettiArray)
    }
  }, [profile, settings])

  const handleDismiss = () => {
    if (!profile) return

    const today = new Date()
    const storageKey = `birthday-greeting-seen-${today.toDateString()}-${profile.id}`
    localStorage.setItem(storageKey, "true")
    setShowGreeting(false)
  }

  if (!showGreeting || !profile) return null

  // Get emojis based on gender
  const getEmojiList = () => {
    if (!settings) return ["🎈", "🎊", "🎁", "🎉", "🎈"]

    const emojiString =
      profile.gender === "female"
        ? settings.birthday_greeting_female_emojis
        : settings.birthday_greeting_male_emojis

    return emojiString.split(",").map((e) => e.trim())
  }

  const emojiList = getEmojiList()

  // Get colors based on gender - hardcoded in frontend
  const getCardGradient = () => {
    if (profile.gender === "female") {
      return "from-purple-50 via-pink-50 to-rose-50 dark:from-purple-950 dark:via-pink-950 dark:to-rose-950"
    }
    return "from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950 dark:via-indigo-950 dark:to-purple-950"
  }

  const getTitleGradient = () => {
    if (profile.gender === "female") {
      return "from-purple-600 via-pink-600 to-rose-600"
    }
    return "from-blue-600 via-indigo-600 to-purple-600"
  }

  const getButtonGradient = () => {
    if (profile.gender === "female") {
      return "from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
    }
    return "from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
  }

  const getAgeColor = () => {
    if (profile.gender === "female") {
      return "text-pink-600 dark:text-pink-400"
    }
    return "text-blue-600 dark:text-blue-400"
  }

  const calculateAge = () => {
    if (!profile.birthday) return null
    const today = new Date()
    const birthDate = new Date(profile.birthday)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--
    }
    return age
  }

  const getOrdinalSuffix = (num: number) => {
    const j = num % 10
    const k = num % 100
    if (j === 1 && k !== 11) return "st"
    if (j === 2 && k !== 12) return "nd"
    if (j === 3 && k !== 13) return "rd"
    return "th"
  }

  const age = calculateAge()
  const ageText = age ? `${age}${getOrdinalSuffix(age)} Birthday` : ""

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300 h-screen">
      {/* Confetti */}
      {settings?.birthday_greeting_show_confetti && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {confetti.map((conf) => (
            <div
              key={conf.id}
              className="absolute top-0 w-2 h-2 rounded-full animate-fall"
              style={{
                left: `${conf.left}%`,
                animationDelay: `${conf.delay}s`,
                animationDuration: `${conf.duration}s`,
                backgroundColor: [
                  "#ff6b6b",
                  "#4ecdc4",
                  "#45b7d1",
                  "#f9ca24",
                  "#6c5ce7",
                  "#fd79a8",
                  "#fdcb6e",
                ][Math.floor(Math.random() * 7)],
              }}
            />
          ))}
        </div>
      )}

      {/* Greeting Card */}
      <div
        className={`relative w-full max-w-2xl mx-4 bg-linear-to-br ${getCardGradient()} rounded-3xl shadow-2xl p-8 md:p-12 animate-in zoom-in-95 duration-500`}
      >
        {/* Close Button */}
        <Button
          variant="link"
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/50 dark:hover:bg-black/30 transition-colors"
          aria-label="Close"
        >
          <X className="size-5" />
        </Button>

        {/* Content */}
        <div className="text-center space-y-6">
          {/* Icon Section */}
          <div className="flex justify-center gap-4 mb-6">
            <div className="relative">
              <Cake className="size-16 text-pink-500 animate-bounce" />
              <div className="absolute -top-2 -right-2">
                <PartyPopper
                  className="size-8 text-yellow-500 animate-spin"
                  style={{ animationDuration: "3s" }}
                />
              </div>
            </div>
            <Gift className="size-16 text-purple-500 animate-pulse" />
          </div>

          {/* Main Message */}
          <div className="space-y-3">
            {age && (
              <p
                className={`text-lg font-medium ${getAgeColor()} animate-in slide-in-from-bottom-5 duration-700 delay-200`}
              >
                {ageText}
              </p>
            )}
            <h1
              className={`text-4xl md:text-5xl font-bold bg-linear-to-r ${getTitleGradient()} bg-clip-text text-transparent animate-in slide-in-from-bottom-5 duration-700`}
            >
              {settings?.birthday_greeting_title || "Happy Birthday!"}
            </h1>
            <p className="text-2xl md:text-3xl font-semibold text-foreground animate-in slide-in-from-bottom-5 duration-700 delay-150">
              {profile.first_name} {profile.last_name}!
            </p>
          </div>

          {/* Birthday Message */}
          <div className="max-w-md mx-auto space-y-4 animate-in slide-in-from-bottom-5 duration-700 delay-300">
            <p className="text-lg text-muted-foreground whitespace-pre-line">
              {settings?.birthday_greeting_message ||
                "Wishing you a wonderful day filled with happiness and joy! Thank you for being part of our team."}
            </p>
          </div>

          {/* Decorative Elements */}
          {settings?.birthday_greeting_show_emojis && (
            <div className="flex justify-center gap-3 text-4xl animate-in slide-in-from-bottom-5 duration-700 delay-500">
              {emojiList.map((emoji, index) => (
                <span
                  key={index}
                  className="animate-bounce"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {emoji}
                </span>
              ))}
            </div>
          )}

          {/* Action Button */}
          <div className="pt-4 animate-in slide-in-from-bottom-5 duration-700 delay-700">
            <Button
              onClick={handleDismiss}
              size="lg"
              className={`bg-linear-to-r ${getButtonGradient()} text-white px-8 py-6 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all`}
            >
              {settings?.birthday_greeting_button_text || "Thank You! 💝"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
