/**
 * Shared AudioContext singleton that auto-resumes on first user gesture.
 *
 * Browsers block AudioContext playback until the user interacts with the page.
 * This module creates a single context and attaches a one-time click/keydown
 * listener to resume it, so all subsequent sound calls Just Work™.
 */

let ctx: AudioContext | null = null
let resumed = false

function ensureResumed(audioCtx: AudioContext) {
  if (resumed) return
  if (audioCtx.state === "running") {
    resumed = true
    return
  }

  const resume = () => {
    audioCtx.resume().then(() => {
      resumed = true
      document.removeEventListener("click", resume)
      document.removeEventListener("keydown", resume)
      document.removeEventListener("touchstart", resume)
    })
  }

  document.addEventListener("click", resume, { once: false })
  document.addEventListener("keydown", resume, { once: false })
  document.addEventListener("touchstart", resume, { once: false })
}

/**
 * Returns the shared AudioContext, creating it on first call.
 * Automatically schedules a resume on user gesture if needed.
 */
export function getAudioContext(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext()
    ensureResumed(ctx)
  }
  return ctx
}
