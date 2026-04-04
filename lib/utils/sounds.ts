import { getSoundVolume } from "@/lib/utils/getSoundVolume"

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  return audioCtx
}

/** Play a short success chime using Web Audio API */
export function playSuccessSound() {
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime
    const vol = getSoundVolume()

    // Two-tone ascending chime
    const frequencies = [523.25, 659.25] // C5, E5
    frequencies.forEach((freq, i) => {
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
  } catch {
    // Silently ignore if audio is not available
  }
}
