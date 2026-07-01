"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Bell, BellOff, BookOpen, Calendar, Home, LayoutDashboard, PanelLeft, Settings, Shield, SlidersHorizontal, User as UserIcon, Volume2, Wallet } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"

import Loader from "@/app/loading"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import UserProfileForm from "@/components/forms/UserProfileForm"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

import { AnimatedNumber } from "@/components/custom/shared/AnimatedNumber"
import { ConfirmAlert } from "@/components/custom/shared/ConfirmAlert"
import { Button } from "@/components/ui/button"
import { User } from "@/lib/constants/interface"
import { userProfileSchema } from "@/lib/constants/schema"
import { TUserProfile, UserProfilePayload } from "@/lib/constants/types"
import useFileUpload from "@/lib/hooks/useFileUpload"
import { useProfileSettingMutations } from "@/lib/mutations/useProfileSettingMutations"
import { useUserProfile } from "@/lib/queries/useUserProfile"
import useUserProfileStore from "@/lib/store/useUserProfileStore"
import { useCalendarPreferences } from "@/lib/hooks/useCalendarPreferences"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useSidebarCollapse } from "@/lib/hooks/useSidebarCollapse"
import { normalizeProfileImage } from "@/lib/utils/helpers"
import api from "@/lib/utils/api"
import { formatDate } from "@/lib/utils/helpers/date"
import {  RotateCcw } from "lucide-react"
import useSettingsStore, { DEFAULT_SOUND_VOLUME, SettingsStore } from "@/lib/store/useSettingsStore"
import { Badge } from "@/components/ui/badge"

/* -------------------------------- helpers -------------------------------- */

function mapProfileToForm(profile: User | null): TUserProfile {
    return {
        email: profile?.email ?? "",
        username: profile?.username ?? "",
        first_name: profile?.first_name ?? "",
        last_name: profile?.last_name ?? "",
        contact_number: profile?.contact_number ?? "",
        new_password: "",
        current_password: "",
        birthday: profile?.birthday ? new Date(profile.birthday) : undefined,
        profile_image: profile?.profile_image ?? "",
        e_signature: profile?.e_signature ?? "",
    }
}

type EditableField =
    | "first_name"
    | "last_name"
    | "username"
    | "email"
    | "contact_number"

function buildProfilePayload(
    values: TUserProfile,
    current: User | null,
): Partial<UserProfilePayload> {
    if (!current) return {}

    const payload: Partial<UserProfilePayload> = {}

    const fields: EditableField[] = [
        "first_name",
        "last_name",
        "username",
        "email",
        "contact_number",
    ]

    for (const field of fields) {
        if (values[field] !== current[field]) {
            payload[field] = values[field]
        }
    }

    const formattedBirthday = values.birthday ? formatDate(values.birthday) : null

    const currentBirthday = current.birthday ? String(current.birthday) : null

    if (formattedBirthday !== currentBirthday) {
        payload.birthday = formattedBirthday || undefined
    }

    const normalizedImage = normalizeProfileImage(values.profile_image)
    if (
        (normalizedImage === "" && current.profile_image) ||
        (normalizedImage && normalizedImage !== current.profile_image)
    ) {
        payload.profile_image = normalizedImage
    }

    const normalizedESignature = normalizeProfileImage(values.e_signature)
    if (
        (normalizedESignature === "" && current.e_signature) ||
        (normalizedESignature && normalizedESignature !== current.e_signature)
    ) {
        payload.e_signature = normalizedESignature
    }

    // Only include passwords if both current and new are provided and different
    const hasCurrentPassword =
        values.current_password && values.current_password.trim() !== ""
    const hasNewPassword =
        values.new_password && values.new_password.trim() !== ""

    if (
        hasCurrentPassword &&
        hasNewPassword &&
        values.current_password !== values.new_password
    ) {
        payload.new_password = values.new_password
        payload.current_password = values.current_password
    }

    return payload
}

function getChangeSummary(
    values: TUserProfile,
    current: User | null,
): string[] {
    if (!current) return []

    const changes: string[] = []
    const payload = buildProfilePayload(values, current)

    if (payload.first_name) changes.push(`First Name: "${values.first_name}"`)
    if (payload.last_name) changes.push(`Last Name: "${values.last_name}"`)
    if (payload.username) changes.push(`Username: "${values.username}"`)
    if (payload.email) changes.push(`Email: "${values.email}"`)
    if (payload.contact_number)
        changes.push(`Contact Number: "${values.contact_number}"`)
    if (payload.birthday)
        changes.push(
            `Birthday: "${values.birthday ? new Date(values.birthday).toLocaleDateString() : "Not set"}"`,
        )
    if (payload.profile_image !== undefined) changes.push("Profile Image")
    if (payload.e_signature !== undefined) changes.push("E-Signature")
    if (payload.new_password) changes.push("Password")

    return changes
}

/* ------------------------------- component -------------------------------- */

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
    const rawData = atob(base64)
    const buffer = new ArrayBuffer(rawData.length)
    const outputArray = new Uint8Array(buffer)
    for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i)
    return outputArray
}

export default function SettingsPage() {
    const { data, isLoading, refetch } = useUserProfile()
    const { updateUserProfile } = useProfileSettingMutations()

    // Sound volume preference
    const userProfile = useUserProfileStore((s) => s.userProfile)
    const userId = userProfile?.id
    const setSoundVolume = useSettingsStore((s: SettingsStore) => s.setSoundVolume)
    const soundVolume = useSettingsStore((s: SettingsStore) =>
        userId != null ? (s.byUser[userId]?.soundVolume ?? DEFAULT_SOUND_VOLUME) : DEFAULT_SOUND_VOLUME,
    )

    // Sidebar preference
    const { collapsed: sidebarCollapsed, setCollapsed: setSidebarCollapsed } = useSidebarCollapse()

    // Calendar preference (admin/manager only)
    const { canManage } = useCurrentUser()
    const { preferences: calendarPrefs, setWeekStartsOn } = useCalendarPreferences()
    // Landing page preference
    const getLandingPage = useSettingsStore((s: SettingsStore) => s.getLandingPage)
    const setLandingPage = useSettingsStore((s: SettingsStore) => s.setLandingPage)
    const landingPage = userId ? getLandingPage(userId) : "/dashboard"

    // Changelog banner preference
    const getShowChangelogBanner = useSettingsStore((s: SettingsStore) => s.getShowChangelogBanner)
    const setShowChangelogBanner = useSettingsStore((s: SettingsStore) => s.setShowChangelogBanner)
    const showChangelogBanner = userId ? getShowChangelogBanner(userId) : true

    // Push notification state
    const [pushPermission, setPushPermission] = useState<NotificationPermission | "unsupported">("default")
    const [pushSubscribed, setPushSubscribed] = useState(false)
    const [pushLoading, setPushLoading] = useState(false)
    const pushSubscribeRef = useRef(false)

    useEffect(() => {
        if (typeof window === "undefined" || !("Notification" in window)) {
            setPushPermission("unsupported")
            return
        }
        setPushPermission(Notification.permission)
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.ready.then((reg) => {
                reg.pushManager.getSubscription().then((sub) => {
                    setPushSubscribed(!!sub)
                })
            })
        }
    }, [])

    const handleEnablePush = async () => {
        if (pushLoading || pushSubscribeRef.current) return
        pushSubscribeRef.current = true
        setPushLoading(true)
        try {
            const permission = await Notification.requestPermission()
            setPushPermission(permission)
            if (permission !== "granted") return
            const reg = await navigator.serviceWorker.ready
            const { data } = await api.get("/notifications/push/vapid-key/")
            const vapidKey: string = data.public_key
            const keyBytes = urlBase64ToUint8Array(vapidKey)
            const existing = await reg.pushManager.getSubscription()
            if (existing) await existing.unsubscribe()
            const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes })
            const subJson = sub.toJSON()
            await api.post("/notifications/push/subscribe/", { endpoint: subJson.endpoint, keys: subJson.keys })
            setPushSubscribed(true)
        } catch {
            // ignore
        } finally {
            setPushLoading(false)
            pushSubscribeRef.current = false
        }
    }

    const handleDisablePush = async () => {
        if (pushLoading) return
        setPushLoading(true)
        try {
            const reg = await navigator.serviceWorker.ready
            const sub = await reg.pushManager.getSubscription()
            if (sub) {
                await api.delete("/notifications/push/subscribe/", { data: { endpoint: sub.endpoint } })
                await sub.unsubscribe()
            }
            setPushSubscribed(false)
        } catch {
            // ignore
        } finally {
            setPushLoading(false)
        }
    }

    const handleVolumeChange = (value: number) => {
        if (!userId) return
        setSoundVolume(userId, value)
    }

    const handleTestSound = () => {
        try {
            const AudioCtx = window.AudioContext
            if (!AudioCtx) return
            // Use the shared context so the volume is applied
            import("@/lib/utils/getSoundVolume").then(({ getSoundVolume: getVol }) => {
                import("@/lib/utils/audioContext").then(({ getAudioContext }) => {
                    const ctx = getAudioContext()
                    if (ctx.state === "suspended") ctx.resume()
                    const vol = getVol()
                    const now = ctx.currentTime
                    const notes = [523.25, 659.25, 783.99] // C5, E5, G5
                    notes.forEach((freq, i) => {
                        const osc = ctx.createOscillator()
                        const gain = ctx.createGain()
                        osc.type = "sine"
                        osc.frequency.value = freq
                        gain.gain.setValueAtTime(0.45 * vol, now + i * 0.12)
                        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.3)
                        osc.connect(gain)
                        gain.connect(ctx.destination)
                        osc.start(now + i * 0.12)
                        osc.stop(now + i * 0.12 + 0.3)
                    })
                })
            })
        } catch {
            // ignore
        }
    }

    // State for confirm dialog
    const [showResetConfirm, setShowResetConfirm] = useState(false)
    const setUserProfile = useUserProfileStore((s) => s.setUserProfile)

    const form = useForm<TUserProfile>({
        resolver: zodResolver(userProfileSchema),
        mode: "onChange",
        defaultValues: mapProfileToForm(userProfile),
    })

    // Track if there are any changes
    const watchedValues = form.watch()
    const hasChanges = userProfile
        ? Object.keys(buildProfilePayload(watchedValues, userProfile)).length > 0
        : false

    // Track form state for better UX
    const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null)

    useEffect(() => {
        if (data) setUserProfile(data)
    }, [data, setUserProfile])

    useEffect(() => {
        form.reset(mapProfileToForm(userProfile))
    }, [userProfile, form])

    const upload = useFileUpload({
        form,
        fieldName: "profile_image",
        initialImage: userProfile?.profile_image,
    })

    const eSignatureUpload = useFileUpload({
        form,
        fieldName: "e_signature",
        initialImage: userProfile?.e_signature ?? "",
    })

    async function onSubmit(values: TUserProfile) {
        const payload = buildProfilePayload(values, userProfile)

        if (!Object.keys(payload).length) {
            return
        }

        // Mutation automatically invalidates queries and refetches data
        await updateUserProfile.mutateAsync(payload)
        setLastSaveTime(new Date())

        // Explicitly clear password fields after successful update
        form.setValue("current_password", "")
        form.setValue("new_password", "")
    }

    const handleResetClick = () => {
        if (hasChanges) {
            setShowResetConfirm(true)
        } else {
            performReset()
        }
    }

    // Get summary of changes for confirmation dialog
    const changeSummary = getChangeSummary(watchedValues, userProfile)

    const performReset = () => {
        form.reset(mapProfileToForm(userProfile))
        setShowResetConfirm(false)
    }

    const handleRefresh = async () => {
        await refetch()
    }

    if (isLoading) return <Loader />

    return (
        <Wrapper>
            <PageHeader
                icon={Settings}
                onRefresh={handleRefresh}
                title="Account Settings"
                description="Manage your personal information, security settings, and account preferences."
                breadcrumbs={["Dashboard", "Settings"]}
                actionButton={
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleResetClick}
                        disabled={!hasChanges || updateUserProfile.isPending}
                    >
                        <RotateCcw className="size-4 mr-2" />
                        Reset Changes
                    </Button>
                }
            />

            <Card className="overflow-hidden relative">
                {lastSaveTime && (
                    <Badge className="absolute top-m3 right-3 text-xs font-mono">Last saved: {lastSaveTime.toLocaleTimeString()}</Badge>
                )}
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserIcon className="size-5" />
                        Profile Information
                    </CardTitle>
                    <CardDescription>
                        Update your personal details and account settings
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {userProfile && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
                            <Info label="Full Name">
                                {userProfile.first_name} {userProfile.last_name}
                            </Info>
                            <Info label="Username">{userProfile.username}</Info>
                            <Info label="Email Address">
                                {userProfile.email || "Not provided"}
                            </Info>
                            <Info label="Contact Number">
                                {userProfile.contact_number || "Not provided"}
                            </Info>
                            <Info label="Role">
                                {userProfile.role ? (
                                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-info/10 text-info">
                                        <Shield className="size-3" />
                                        {userProfile.role[0].toUpperCase() +
                                            userProfile.role.slice(1)}
                                    </span>
                                ) : (
                                    "No role assigned"
                                )}
                            </Info>
                            <Info label="Birthday">
                                {userProfile.birthday
                                    ? formatDate(new Date(userProfile.birthday), "MMMM dd, yyyy")
                                    : "Not provided"}
                            </Info>
                            <Info label="Cash Ban Balance">
                                <span className="inline-flex items-center gap-1.5 font-semibold text-success">
                                    <Wallet className="size-3" />
                                    <AnimatedNumber
                                        value={Number(userProfile.cash_ban_balance || 0)}
                                        prefix="₱"
                                        format={{ minimumFractionDigits: 0, maximumFractionDigits: 0 }}
                                    />
                                </span>
                            </Info>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Preferences */}
            <Card className="overflow-hidden">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <SlidersHorizontal className="size-5" />
                        Preferences
                    </CardTitle>
                    <CardDescription>
                        Customize your sound, interface, and notification settings
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {/* Sound */}
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <Volume2 className="size-4 text-muted-foreground shrink-0" />
                                    <span className="text-sm font-medium">Sound Volume</span>
                                </div>
                                <AnimatedNumber value={soundVolume * 100} suffix="%" format={{ minimumFractionDigits: 0, maximumFractionDigits: 0 }} className="text-sm text-muted-foreground" />
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={1}
                                step={0.01}
                                value={soundVolume}
                                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                                aria-label="Sound volume"
                                title="Sound volume"
                                className="w-full h-2 rounded-full accent-primary cursor-pointer"
                            />
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleTestSound}
                                    className="text-xs h-7"
                                >
                                    Test Sound
                                </Button>
                                {soundVolume === 0 && (
                                    <span className="text-xs text-muted-foreground">Muted</span>
                                )}
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                                <PanelLeft className="size-4 text-muted-foreground shrink-0" />
                                <span className="text-sm font-medium">Sidebar</span>
                            </div>
                            <div className="flex gap-1.5">
                                {([{ label: "Expanded", value: false }, { label: "Collapsed", value: true }] as const).map(
                                    ({ label, value }) => (
                                        <button
                                            key={label}
                                            type="button"
                                            onClick={() => setSidebarCollapsed(value)}
                                            className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors cursor-pointer ${sidebarCollapsed === value
                                                ? "border-primary bg-primary/10 text-primary"
                                                : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                                                }`}
                                        >
                                            {label}
                                        </button>
                                    ),
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">Default state when the page loads</p>
                        </div>

                        {/* Landing Page */}
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                                <Home className="size-4 text-muted-foreground shrink-0" />
                                <span className="text-sm font-medium">Landing Page</span>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                {([
                                    { label: "Dashboard", value: "/dashboard", icon: LayoutDashboard },
                                    { label: "Sales", value: "/sales", icon: null },
                                    { label: "Services", value: "/services", icon: null },
                                    { label: "Attendance", value: "/attendance", icon: null },
                                ] as const).map(({ label, value }) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => userId && setLandingPage(userId, value)}
                                        className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors cursor-pointer text-left ${landingPage === value
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                                            }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground">Page shown after login</p>
                        </div>

                        <div className="flex flex-col gap-3 rounded-xl border border-dashed border-border/70 bg-muted/20 p-4 sm:col-span-2 xl:col-span-1">
                            <div className="flex items-center gap-2">
                                <Settings className="size-4 text-muted-foreground shrink-0" />
                                <span className="text-sm font-medium">Theme</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Theme selection now lives in the navbar profile menu so it applies earlier during page reloads.
                            </p>
                        </div>

                        {/* Push Notifications */}
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                                {pushSubscribed ? (
                                    <Bell className="size-4 text-muted-foreground shrink-0" />
                                ) : (
                                    <BellOff className="size-4 text-muted-foreground shrink-0" />
                                )}
                                <span className="text-sm font-medium">Push Notifications</span>
                            </div>
                            {pushPermission === "unsupported" ? (
                                <p className="text-xs text-muted-foreground">Not supported in this browser</p>
                            ) : pushPermission === "denied" ? (
                                <p className="text-xs text-destructive">Blocked by browser — allow notifications in browser settings</p>
                            ) : (
                                <div className="flex gap-1.5">
                                    <button
                                        type="button"
                                        onClick={handleEnablePush}
                                        disabled={pushLoading || (pushPermission === "granted" && pushSubscribed)}
                                        className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${pushSubscribed
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                                            }`}
                                    >
                                        {pushLoading && !pushSubscribed ? "Enabling…" : "Enabled"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDisablePush}
                                        disabled={pushLoading || !pushSubscribed}
                                        className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${!pushSubscribed
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                                            }`}
                                    >
                                        {pushLoading && pushSubscribed ? "Disabling…" : "Disabled"}
                                    </button>
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground">Browser push alerts when the tab is closed</p>
                        </div>

                        {/* Changelog Banner */}
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                                <BookOpen className="size-4 text-muted-foreground shrink-0" />
                                <span className="text-sm font-medium">Changelog Banner</span>
                            </div>
                            <div className="flex gap-1.5">
                                {([{ label: "Show", value: true }, { label: "Hide", value: false }] as const).map(
                                    ({ label, value }) => (
                                        <button
                                            key={label}
                                            type="button"
                                            onClick={() => userId && setShowChangelogBanner(userId, value)}
                                            className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors cursor-pointer ${showChangelogBanner === value
                                                ? "border-primary bg-primary/10 text-primary"
                                                : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                                                }`}
                                        >
                                            {label}
                                        </button>
                                    ),
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">New-version banner at the top of the page</p>
                        </div>

                        {/* Calendar — admin/manager only */}
                        {canManage && (
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-2">
                                    <Calendar className="size-4 text-muted-foreground shrink-0" />
                                    <span className="text-sm font-medium">Week Starts On</span>
                                </div>
                                <div className="flex gap-1.5">
                                    {([{ label: "Sunday", value: 0 }, { label: "Monday", value: 1 }] as const).map(
                                        ({ label, value }) => (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() => setWeekStartsOn(value)}
                                                className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors cursor-pointer ${calendarPrefs.weekStartsOn === value
                                                    ? "border-primary bg-primary/10 text-primary"
                                                    : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                                                    }`}
                                            >
                                                {label}
                                            </button>
                                        ),
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">Applies to calendar and schedule views</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card className="overflow-hidden">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="size-5" />
                        Edit Profile
                    </CardTitle>
                    <CardDescription>
                        Update your account information and change your password
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <UserProfileForm
                        form={form}
                        onSubmit={onSubmit}
                        upload={upload}
                        eSignatureUpload={eSignatureUpload}
                        hasChanges={hasChanges}
                        isSubmitting={updateUserProfile.isPending}
                    />
                </CardContent>
            </Card>

            {/* Reset Confirmation Dialog */}
            <ConfirmAlert
                open={showResetConfirm}
                onOpenChange={setShowResetConfirm}
                onConfirm={performReset}
                title="Reset Profile Changes?"
                description={
                    changeSummary.length > 0
                        ? `You will lose the following changes: ${changeSummary.join(", ")}. This action cannot be undone.`
                        : "You have unsaved changes to your profile. Resetting will restore all fields to their original values and cannot be undone."
                }
                confirmText="Reset Changes"
                cancelText="Keep Editing"
                confirmVariant="destructive"
                isConfirming={updateUserProfile.isPending}
            />
        </Wrapper>
    )
}

/* ---------------------------- small ui helper ----------------------------- */

function Info({
    label,
    children,
}: {
    label: string
    children: React.ReactNode
}) {
    return (
        <div>
            <label className="text-sm font-medium text-muted-foreground">
                {label}
            </label>
            <p className="text-base font-medium">{children}</p>
        </div>
    )
}
