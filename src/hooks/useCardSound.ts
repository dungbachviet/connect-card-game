import { useCallback, useState } from 'react'

const STORAGE_KEY = 'tam-giao:sound-muted'

let audioCtx: AudioContext | null = null

/**
 * iOS routes Web Audio through the ringer channel by default, so the silent switch mutes it.
 * Declaring a "playback" audio session (Safari 17+) makes it play like media instead.
 */
function setPlaybackAudioSession() {
  const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession
  if (!session) return
  try {
    session.type = 'playback'
  } catch {
    // ignore: unsupported session type
  }
}

/** Older iOS only unlocks audio once a source is started inside a user gesture. */
function unlock(ctx: AudioContext) {
  const source = ctx.createBufferSource()
  source.buffer = ctx.createBuffer(1, 1, ctx.sampleRate)
  source.connect(ctx.destination)
  source.start(0)
}

function getAudioContext(): AudioContext | null {
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  if (!audioCtx) {
    setPlaybackAudioSession()
    audioCtx = new Ctor()
    unlock(audioCtx)
  }
  // iOS reports "interrupted" (not "suspended") after the app is backgrounded or the screen locks.
  if (audioCtx.state !== 'running') audioCtx.resume().catch(() => {})
  return audioCtx
}

function loadMuted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

let cachedImpulse: { ctx: AudioContext; buffer: AudioBuffer } | null = null

/** Algorithmic reverb impulse (decaying noise) — gives the chime a "vang" (resonant) tail without any audio asset. */
function getReverbImpulse(ctx: AudioContext): AudioBuffer {
  if (cachedImpulse && cachedImpulse.ctx === ctx) return cachedImpulse.buffer
  const duration = 1.8
  const decayPower = 2.4
  const length = Math.floor(ctx.sampleRate * duration)
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate)
  for (let ch = 0; ch < impulse.numberOfChannels; ch++) {
    const data = impulse.getChannelData(ch)
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decayPower)
    }
  }
  cachedImpulse = { ctx, buffer: impulse }
  return impulse
}

/** Synthesizes a card-flip "whoosh" followed by a resonant bell chime that rings out through reverb. */
function playFlipTone(ctx: AudioContext) {
  const now = ctx.currentTime
  const whooshDuration = 0.14

  const bufferSize = Math.floor(ctx.sampleRate * whooshDuration)
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    const decay = 1 - i / bufferSize
    data[i] = (Math.random() * 2 - 1) * decay
  }
  const noise = ctx.createBufferSource()
  noise.buffer = buffer

  const bandpass = ctx.createBiquadFilter()
  bandpass.type = 'bandpass'
  bandpass.Q.value = 0.9
  bandpass.frequency.setValueAtTime(2200, now)
  bandpass.frequency.exponentialRampToValueAtTime(500, now + whooshDuration)

  const noiseGain = ctx.createGain()
  noiseGain.gain.setValueAtTime(0.3, now)
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + whooshDuration)

  noise.connect(bandpass).connect(noiseGain).connect(ctx.destination)
  noise.start(now)
  noise.stop(now + whooshDuration)

  // Resonant chime, sent through a generated reverb so it rings out ("vang") after the flip settles.
  const reverb = ctx.createConvolver()
  reverb.buffer = getReverbImpulse(ctx)

  const dryGain = ctx.createGain()
  dryGain.gain.value = 0.55
  const wetGain = ctx.createGain()
  wetGain.gain.value = 0.5

  dryGain.connect(ctx.destination)
  reverb.connect(wetGain).connect(ctx.destination)

  const chimeStart = now + whooshDuration * 0.6
  const notes: Array<[frequency: number, peakGain: number]> = [
    [523.25, 0.28], // C5
    [784.0, 0.16], // G5
  ]

  for (const [frequency, peakGain] of notes) {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = frequency

    const envelope = ctx.createGain()
    envelope.gain.setValueAtTime(0.0001, now)
    envelope.gain.setValueAtTime(peakGain, chimeStart)
    envelope.gain.exponentialRampToValueAtTime(0.0001, chimeStart + 0.9)

    osc.connect(envelope)
    envelope.connect(dryGain)
    envelope.connect(reverb)

    osc.start(chimeStart)
    osc.stop(chimeStart + 1)
  }
}

export function useCardSound() {
  const [muted, setMuted] = useState(loadMuted)

  const play = useCallback(() => {
    if (muted) return
    const ctx = getAudioContext()
    if (!ctx) return
    try {
      playFlipTone(ctx)
    } catch {
      // ignore: autoplay restrictions or unsupported browser
    }
  }, [muted])

  const toggleMuted = useCallback(() => {
    setMuted((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
      } catch {
        // ignore storage errors
      }
      return next
    })
  }, [])

  return { play, muted, toggleMuted }
}
