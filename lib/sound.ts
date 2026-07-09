/**
 * Shared sound-effect helpers built on top of the app's existing
 * `getAudioContext` (singleton AudioContext, resumed elsewhere on first
 * user gesture) and `getSoundVolume` (user's sound preference, 0–1).
 *
 * Any component that wants a short synthesized chime — network status,
 * notification toasts, in-app alerts — should call `playTone` or
 * `playChime` here instead of creating its own AudioContext/oscillator
 * chain. Keeps volume and gesture-resume behavior consistent everywhere.
 */

import { getAudioContext } from "@/lib/utils/audioContext"
import { getSoundVolume } from "@/lib/utils/getSoundVolume"

/* -------------------------------------------------------------------------
 * Primitives
 * ---------------------------------------------------------------------- */

export interface ToneOptions {
    /** Starting frequency in Hz */
    startFreq: number
    /** Ending frequency in Hz — omit for a flat (non-sweeping) tone */
    endFreq?: number
    /** Total duration in seconds */
    duration?: number
    /** Peak volume, 0–1, before the user's sound-volume preference is applied */
    volume?: number
    waveform?: OscillatorType
}

/** Plays a single tone, optionally sweeping from startFreq to endFreq. */
export function playTone({
    startFreq,
    endFreq = startFreq,
    duration = 0.24,
    volume = 0.12,
    waveform = "sine",
}: ToneOptions): void {
    try {
        const ctx = getAudioContext()
        if (ctx.state !== "running") return

        const now = ctx.currentTime
        const vol = getSoundVolume()

        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.type = waveform
        osc.frequency.setValueAtTime(startFreq, now)
        osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration * 0.75)

        gain.gain.setValueAtTime(0, now)
        gain.gain.linearRampToValueAtTime(volume * vol, now + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start(now)
        osc.stop(now + duration + 0.02)
    } catch {
        // Audio not available – silently ignore
    }
}

export interface ChimeStep {
    frequency: number
    /** Seconds after the chime starts */
    offset: number
    duration: number
}

/** Plays a sequence of discrete tones sharing one gain envelope (a "ding"). */
export function playChime(steps: ChimeStep[], { volume = 0.55 }: { volume?: number } = {}): void {
    if (steps.length === 0) return

    try {
        const ctx = getAudioContext()
        if (ctx.state !== "running") return

        const now = ctx.currentTime
        const vol = getSoundVolume()
        const end = Math.max(...steps.map((s) => s.offset + s.duration))

        const gain = ctx.createGain()
        gain.gain.setValueAtTime(volume * vol, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + end)
        gain.connect(ctx.destination)

        for (const step of steps) {
            const osc = ctx.createOscillator()
            osc.type = "sine"
            osc.frequency.setValueAtTime(step.frequency, now + step.offset)
            osc.connect(gain)
            osc.start(now + step.offset)
            osc.stop(now + step.offset + step.duration)
        }
    } catch {
        // Audio not available – silently ignore
    }
}

/* -------------------------------------------------------------------------
 * Presets
 * ---------------------------------------------------------------------- */

type ConnectionSound = "offline" | "online"

const connectionTones: Record<ConnectionSound, ToneOptions> = {
    online: { startFreq: 523.25, endFreq: 783.99 }, // short ascending tone
    offline: { startFreq: 392, endFreq: 261.63 }, // short descending tone
}

/** Connection-status chime, used by the network status banner. */
export function playConnectionSound(kind: ConnectionSound): void {
    playTone(connectionTones[kind])
}

const notificationChimeSteps: ChimeStep[] = [
    { frequency: 830, offset: 0, duration: 0.12 },
    { frequency: 1100, offset: 0.12, duration: 0.38 },
]

/** Two-tone "ding" chime, used by the notification bell. */
export function playNotificationChime(): void {
    playChime(notificationChimeSteps, { volume: 0.55 })
}
