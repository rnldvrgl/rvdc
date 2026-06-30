"use client"

import { Button } from "@/components/ui/button"
import { CHART_PALETTE } from "@/lib/constants/theme"
import { useSystemSettings } from "@/lib/queries/useSystemSettings"
import { useUserProfile } from "@/lib/queries/useUserProfile"
import { Cake, Gift, PartyPopper, X } from "lucide-react"
import { useEffect, useState } from "react"

const confettiLeftClasses = [
    "left-[2%]",
    "left-[8%]",
    "left-[14%]",
    "left-[20%]",
    "left-[26%]",
    "left-[32%]",
    "left-[38%]",
    "left-[44%]",
    "left-[50%]",
    "left-[56%]",
    "left-[62%]",
    "left-[68%]",
    "left-[74%]",
    "left-[80%]",
    "left-[86%]",
    "left-[92%]",
] as const

const confettiDelayClasses = [
    "[animation-delay:0s]",
    "[animation-delay:0.15s]",
    "[animation-delay:0.3s]",
    "[animation-delay:0.45s]",
    "[animation-delay:0.6s]",
    "[animation-delay:0.75s]",
    "[animation-delay:0.9s]",
    "[animation-delay:1.05s]",
] as const

const confettiDurationClasses = [
    "animation-duration-[2.4s]",
    "animation-duration-[2.8s]",
    "animation-duration-[3.2s]",
] as const

const emojiDelayClasses = [
    "[animation-delay:0s]",
    "[animation-delay:0.15s]",
    "[animation-delay:0.3s]",
    "[animation-delay:0.45s]",
    "[animation-delay:0.6s]",
] as const

const celebrationBalloonDelayClass = "[animation-delay:0.2s]"

const celebrationSpinDelayClasses = [
    "[animation-delay:0s]",
    "[animation-delay:0.2s]",
    "[animation-delay:0.4s]",
    "[animation-delay:0.6s]",
] as const

const confettiColors = CHART_PALETTE.map((color) => `bg-[${color}]`)

type ConfettiPiece = {
    id: number
    leftClass: string
    delayClass: string
    durationClass: string
    colorClass: string
}

export function BirthdayGreeting() {
    const { data: profile } = useUserProfile()
    const { data: settings } = useSystemSettings()
    const [showGreeting, setShowGreeting] = useState(false)
    const [confetti, setConfetti] = useState<
        ConfettiPiece[]
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
                leftClass:
                    confettiLeftClasses[Math.floor(Math.random() * confettiLeftClasses.length)],
                delayClass:
                    confettiDelayClasses[Math.floor(Math.random() * confettiDelayClasses.length)],
                durationClass:
                    confettiDurationClasses[
                    Math.floor(Math.random() * confettiDurationClasses.length)
                    ],
                colorClass:
                    confettiColors[Math.floor(Math.random() * confettiColors.length)],
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

    const variant = settings?.birthday_greeting_variant || "default"

    // Render different card designs based on variant
    const renderDefaultVariant = () => (
        <div
            className={`relative w-full max-w-2xl mx-3 sm:mx-4 bg-linear-to-br ${getCardGradient()} rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-12 animate-in zoom-in-95 duration-500`}
        >
            <Button
                variant="link"
                onClick={handleDismiss}
                className="absolute top-2 right-2 sm:top-4 sm:right-4 p-1.5 sm:p-2 rounded-full hover:bg-white/50 dark:hover:bg-black/30 transition-colors"
                aria-label="Close"
            >
                <X className="size-4 sm:size-5" />
            </Button>

            <div className="text-center space-y-3 sm:space-y-4 md:space-y-6">
                <div className="flex justify-center gap-2 sm:gap-4 mb-3 sm:mb-6">
                    <div className="relative">
                        <Cake className="size-10 sm:size-12 md:size-16 text-pink-500 animate-bounce" />
                        <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2">
                            <PartyPopper
                                className="size-5 sm:size-6 md:size-8 text-yellow-500 animate-spin animation-duration-[3s]"
                            />
                        </div>
                    </div>
                    <Gift className="size-10 sm:size-12 md:size-16 text-purple-500 animate-pulse" />
                </div>

                <div className="space-y-1.5 sm:space-y-2 md:space-y-3">
                    {age && (
                        <p
                            className={`text-sm sm:text-base md:text-lg font-medium ${getAgeColor()} animate-in slide-in-from-bottom-5 duration-700`}
                        >
                            {ageText}
                        </p>
                    )}
                    <h1
                        className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-linear-to-r ${getTitleGradient()} bg-clip-text text-transparent animate-in slide-in-from-bottom-5 duration-700`}
                    >
                        {settings?.birthday_greeting_title || "Happy Birthday!"}
                    </h1>
                    <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-foreground animate-in slide-in-from-bottom-5 duration-700 delay-150">
                        {profile.first_name} {profile.last_name}!
                    </p>
                </div>

                <div className="max-w-md mx-auto px-2 sm:px-0 animate-in slide-in-from-bottom-5 duration-700 delay-300">
                    <p className="text-sm sm:text-base md:text-lg text-muted-foreground whitespace-pre-line">
                        {settings?.birthday_greeting_message ||
                            "Wishing you a wonderful day filled with happiness and joy! Thank you for being part of our team."}
                    </p>
                </div>

                {settings?.birthday_greeting_show_emojis && (
                    <div className="flex justify-center gap-1.5 sm:gap-2 md:gap-3 text-2xl sm:text-3xl md:text-4xl animate-in slide-in-from-bottom-5 duration-700 delay-500">
                        {emojiList.map((emoji, index) => (
                            <span
                                key={index}
                                className={`animate-bounce [animation-delay:${index * 0.1}s]`}
                            >
                                {emoji}
                            </span>
                        ))}
                    </div>
                )}

                <div className="pt-2 sm:pt-4 animate-in slide-in-from-bottom-5 duration-700 delay-700">
                    <Button
                        onClick={handleDismiss}
                        size="lg"
                        className={`bg-linear-to-r ${getButtonGradient()} text-white px-6 py-4 sm:px-8 sm:py-6 text-base sm:text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all`}
                    >
                        {settings?.birthday_greeting_button_text || "Thank You! 💝"}
                    </Button>
                </div>
            </div>
        </div>
    )

    const renderMinimalistVariant = () => (
        <div className="relative w-full max-w-lg mx-3 sm:mx-4 bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8 md:p-12 animate-in zoom-in-95 duration-500">
            <Button
                variant="ghost"
                onClick={handleDismiss}
                className="absolute top-2 right-2 sm:top-3 sm:right-3"
                size="icon"
                aria-label="Close"
            >
                <X className="size-3.5 sm:size-4" />
            </Button>

            <div className="text-center space-y-4 sm:space-y-6 md:space-y-8">
                <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-linear-to-br ${getCardGradient()} animate-pulse">
                    <Cake className="size-7 sm:size-8 md:size-10 text-white" />
                </div>

                <div className="space-y-1 sm:space-y-2">
                    {age && (
                        <p
                            className={`text-xs sm:text-sm font-medium uppercase tracking-wider ${getAgeColor()}`}
                        >
                            {ageText}
                        </p>
                    )}
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-light text-foreground">
                        {settings?.birthday_greeting_title || "Happy Birthday"}
                    </h1>
                    <p className="text-base sm:text-lg md:text-xl font-medium text-foreground">
                        {profile.first_name} {profile.last_name}
                    </p>
                </div>

                <p className="text-sm sm:text-base text-muted-foreground max-w-sm mx-auto leading-relaxed px-2 sm:px-0">
                    {settings?.birthday_greeting_message ||
                        "Wishing you a wonderful day filled with happiness and joy! Thank you for being part of our team."}
                </p>

                {settings?.birthday_greeting_show_emojis && (
                    <div className="flex justify-center gap-1.5 sm:gap-2 text-xl sm:text-2xl opacity-60">
                        {emojiList.map((emoji, index) => (
                            <span key={index}>{emoji}</span>
                        ))}
                    </div>
                )}

                <Button
                    onClick={handleDismiss}
                    variant="outline"
                    className="mt-4 sm:mt-6 border-2 hover:bg-accent"
                >
                    {settings?.birthday_greeting_button_text || "Thank You"}
                </Button>
            </div>
        </div>
    )

    const renderCelebrationVariant = () => (
        <div
            className={`relative w-full max-w-3xl mx-3 sm:mx-4 bg-linear-to-br ${getCardGradient()} rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500`}
        >
            {/* Decorative circles */}
            <div className="absolute top-0 left-0 w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-40 h-40 sm:w-48 sm:h-48 md:w-60 md:h-60 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3" />
            <div className="absolute top-1/2 right-4 sm:right-10 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-white/5 rounded-full" />

            <div className="relative z-10 p-4 sm:p-6 md:p-8 lg:p-12">
                <Button
                    variant="ghost"
                    onClick={handleDismiss}
                    className="absolute top-2 right-2 sm:top-4 sm:right-4 text-foreground/70 hover:text-foreground hover:bg-white/20"
                    size="icon"
                    aria-label="Close"
                >
                    <X className="size-4 sm:size-5" />
                </Button>

                <div className="text-center space-y-3 sm:space-y-4 md:space-y-6">
                    <div className="flex justify-center gap-2 sm:gap-4 md:gap-6">
                        <Cake className="size-12 sm:size-16 md:size-20 text-yellow-400 animate-bounce drop-shadow-lg" />
                        <Gift className="size-12 sm:size-16 md:size-20 text-pink-400 animate-pulse drop-shadow-lg" />
                        <PartyPopper
                            className={`size-12 sm:size-16 md:size-20 text-purple-400 animate-bounce drop-shadow-lg ${celebrationBalloonDelayClass}`}
                        />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2 md:space-y-3">
                        {age && (
                            <p className="text-base sm:text-xl md:text-2xl font-bold text-yellow-300 drop-shadow-md animate-bounce">
                                {ageText}
                            </p>
                        )}
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white drop-shadow-2xl uppercase tracking-tight">
                            {settings?.birthday_greeting_title || "Happy Birthday!"}
                        </h1>
                        <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white/90 drop-shadow-lg">
                            {profile.first_name} {profile.last_name}!
                        </p>
                    </div>

                    <div className="max-w-lg mx-auto bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6">
                        <p className="text-sm sm:text-base md:text-lg text-white/90 whitespace-pre-line">
                            {settings?.birthday_greeting_message ||
                                "Wishing you a wonderful day filled with happiness and joy! Thank you for being part of our team."}
                        </p>
                    </div>

                    {settings?.birthday_greeting_show_emojis && (
                        <div className="flex justify-center gap-2 sm:gap-3 md:gap-4 text-3xl sm:text-4xl md:text-5xl">
                            {emojiList.map((emoji, index) => (
                                <span
                                    key={index}
                                    className={`animate-bounce drop-shadow-lg ${emojiDelayClasses[index % emojiDelayClasses.length]} animation-duration-[1s]`}
                                >
                                    {emoji}
                                </span>
                            ))}
                        </div>
                    )}

                    <Button
                        onClick={handleDismiss}
                        size="lg"
                        className="bg-white text-purple-600 hover:bg-white/90 px-6 py-4 sm:px-8 sm:py-5 md:px-10 md:py-6 text-base sm:text-lg md:text-xl font-bold rounded-full shadow-2xl"
                    >
                        {settings?.birthday_greeting_button_text || "Thank You! 💝"}
                    </Button>
                </div>
            </div>
        </div>
    )

    const renderElegantVariant = () => (
        <div className="relative w-full max-w-2xl mx-3 sm:mx-4 animate-in zoom-in-95 duration-500">
            <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-2xl border-2 sm:border-4 border-double ${profile.gender === 'female' ? 'border-pink-300 dark:border-pink-700' : 'border-blue-300 dark:border-blue-700'}">
                {/* Ornate corner decorations */}
                <div className="absolute top-0 left-0 w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 border-t-2 border-l-2 sm:border-t-4 sm:border-l-4 ${profile.gender === 'female' ? 'border-pink-400' : 'border-blue-400'} rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 border-t-2 border-r-2 sm:border-t-4 sm:border-r-4 ${profile.gender === 'female' ? 'border-pink-400' : 'border-blue-400'} rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 border-b-2 border-l-2 sm:border-b-4 sm:border-l-4 ${profile.gender === 'female' ? 'border-pink-400' : 'border-blue-400'} rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 border-b-2 border-r-2 sm:border-b-4 sm:border-r-4 ${profile.gender === 'female' ? 'border-pink-400' : 'border-blue-400'} rounded-br-lg" />

                <Button
                    variant="ghost"
                    onClick={handleDismiss}
                    className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10"
                    size="icon"
                    aria-label="Close"
                >
                    <X className="size-3.5 sm:size-4" />
                </Button>

                <div className="p-6 sm:p-8 md:p-12 lg:p-16 text-center space-y-3 sm:space-y-4 md:space-y-6">
                    <div className="inline-block p-2.5 sm:p-3 md:p-4 rounded-full bg-linear-to-br ${getCardGradient()}">
                        <Cake className="size-8 sm:size-10 md:size-12 text-white" />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2 md:space-y-3 border-b border-t border-gray-200 dark:border-gray-700 py-3 sm:py-4 md:py-6">
                        {age && (
                            <p
                                className={`text-xs sm:text-sm font-serif italic ${getAgeColor()}`}
                            >
                                Celebrating Your {ageText}
                            </p>
                        )}
                        <h1
                            className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-bold bg-linear-to-r ${getTitleGradient()} bg-clip-text text-transparent`}
                        >
                            {settings?.birthday_greeting_title || "Happy Birthday"}
                        </h1>
                        <p className="text-base sm:text-lg md:text-2xl font-serif text-foreground">
                            {profile.first_name} {profile.last_name}
                        </p>
                    </div>

                    <p className="text-sm sm:text-base font-serif text-muted-foreground max-w-md mx-auto leading-relaxed italic px-2 sm:px-0">
                        {settings?.birthday_greeting_message ||
                            "Wishing you a wonderful day filled with happiness and joy! Thank you for being part of our team."}
                    </p>

                    {settings?.birthday_greeting_show_emojis && (
                        <div className="flex justify-center gap-1.5 sm:gap-2 md:gap-3 text-2xl sm:text-2xl md:text-3xl pt-2">
                            {emojiList.map((emoji, index) => (
                                <span
                                    key={index}
                                    className="opacity-70"
                                >
                                    {emoji}
                                </span>
                            ))}
                        </div>
                    )}

                    <Button
                        onClick={handleDismiss}
                        variant="outline"
                        size="lg"
                        className={`mt-4 sm:mt-6 border-2 ${profile.gender === "female" ? "border-pink-400 text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950" : "border-blue-400 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"} font-serif`}
                    >
                        {settings?.birthday_greeting_button_text || "Thank You"}
                    </Button>
                </div>
            </div>
        </div>
    )

    const renderPlayfulVariant = () => (
        <div className="relative w-full max-w-2xl mx-3 sm:mx-4 animate-in zoom-in-95 slide-in-from-bottom-10 duration-700">
            <div
                className={`relative bg-linear-to-br ${getCardGradient()} rounded-4xl sm:rounded-[3rem] shadow-2xl p-4 sm:p-6 md:p-8 lg:p-12 transform rotate-1 hover:rotate-0 transition-transform duration-300 overflow-hidden`}
            >
                {/* Decorative circles */}
                <div className="absolute top-0 left-0 w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-40 h-40 sm:w-48 sm:h-48 md:w-60 md:h-60 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3" />
                <div className="absolute top-1/2 right-4 sm:right-10 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-white/5 rounded-full" />
                <Button
                    variant="ghost"
                    onClick={handleDismiss}
                    className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-white/80 hover:bg-white rounded-full"
                    size="icon"
                    aria-label="Close"
                >
                    <X className="size-3.5 sm:size-4" />
                </Button>

                <div className="text-center space-y-3 sm:space-y-4 md:space-y-6">
                    <div className="flex justify-center gap-1.5 sm:gap-2 md:gap-3 -mb-2">
                        {[...Array(5)].map((_, i) => (
                            <div
                                key={i}
                                className={`text-2xl sm:text-3xl md:text-4xl animate-bounce ${celebrationBalloonDelayClass} animation-duration-[0.6s]`}
                            >
                                🎈
                            </div>
                        ))}
                    </div>

                    <div className="relative inline-block">
                        <div className="absolute inset-0 bg-yellow-300 rounded-2xl sm:rounded-3xl rotate-3" />
                        <div className="relative bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl p-3 sm:p-4 md:p-6 shadow-lg transform -rotate-2">
                            <Cake
                                className={`size-10 sm:size-12 md:size-16 mx-auto ${profile.gender === "female" ? "text-pink-500" : "text-blue-500"} animate-pulse`}
                            />
                        </div>
                    </div>

                    <div className="space-y-1 sm:space-y-2">
                        {age && (
                            <div className="inline-block bg-yellow-300 text-yellow-900 px-3 py-1.5 sm:px-4 sm:py-2 md:px-6 md:py-2 rounded-full font-black text-sm sm:text-base md:text-lg transform -rotate-2 shadow-lg">
                                {ageText}!
                            </div>
                        )}
                        <h1
                            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white drop-shadow-lg transform -rotate-1 px-2 sm:px-0 font-[Comic_Sans_MS,cursive]"
                        >
                            {settings?.birthday_greeting_title || "Happy Birthday!"}
                        </h1>
                        <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white drop-shadow-md transform rotate-1">
                            {profile.first_name} {profile.last_name}!
                        </p>
                    </div>

                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-3 sm:p-4 md:p-6 transform rotate-1">
                        <p className="text-sm sm:text-base md:text-lg text-white font-medium whitespace-pre-line">
                            {settings?.birthday_greeting_message ||
                                "Wishing you a wonderful day filled with happiness and joy! Thank you for being part of our team."}
                        </p>
                    </div>

                    {settings?.birthday_greeting_show_emojis && (
                        <div className="flex justify-center gap-1.5 sm:gap-2 md:gap-3">
                            {emojiList.map((emoji, index) => (
                                <div
                                    key={index}
                                    className={`text-3xl sm:text-4xl md:text-5xl animate-spin ${celebrationSpinDelayClasses[index % celebrationSpinDelayClasses.length]} animation-duration-[3s]`}
                                >
                                    {emoji}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="pt-1 sm:pt-2">
                        <Button
                            onClick={handleDismiss}
                            size="lg"
                            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-6 py-3 sm:px-8 sm:py-4 md:px-10 md:py-6 text-base sm:text-lg md:text-xl font-black rounded-full shadow-2xl transform -rotate-2 hover:rotate-0 hover:scale-110 transition-all"
                        >
                            {settings?.birthday_greeting_button_text || "Awesome! 🎉"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )

    const renderVariant = () => {
        switch (variant) {
            case "minimalist":
                return renderMinimalistVariant()
            case "celebration":
                return renderCelebrationVariant()
            case "elegant":
                return renderElegantVariant()
            case "playful":
                return renderPlayfulVariant()
            default:
                return renderDefaultVariant()
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300 h-screen">
            {/* Confetti */}
            {settings?.birthday_greeting_show_confetti && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {confetti.map((conf) => (
                        <div
                            key={conf.id}
                            className={`absolute top-0 size-2 rounded-full animate-fall ${conf.leftClass} ${conf.delayClass} ${conf.durationClass} ${conf.colorClass}`}
                        />
                    ))}
                </div>
            )}

            {/* Render selected variant */}
            {renderVariant()}
        </div>
    )
}
