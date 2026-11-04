// Hook phát âm thanh lật thẻ và bật/tắt tiếng.
// Âm thanh được tổng hợp bằng Web Audio API nên không cần file âm thanh nào.
import { useCallback, useState } from 'react'

// Khóa lưu trạng thái tắt tiếng trong localStorage
const STORAGE_KEY = 'tam-giao:sound-muted'

// Dùng chung một AudioContext cho cả app. Chỉ tạo ở lần phát đầu tiên,
// vì trình duyệt yêu cầu âm thanh phải bắt đầu từ một thao tác của người dùng.
let audioCtx: AudioContext | null = null

/**
 * Mặc định iOS phát Web Audio qua kênh chuông, nên gạt nút im lặng là mất tiếng.
 * Khai báo audio session "playback" (Safari 17+) để phát như media thông thường.
 */
function setPlaybackAudioSession() {
  const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession
  if (!session) return
  try {
    session.type = 'playback'
  } catch {
    // Bỏ qua nếu trình duyệt không hỗ trợ loại session này
  }
}

/** iOS đời cũ chỉ mở khóa âm thanh khi có một nguồn được phát trong thao tác của người dùng, nên phát 1 mẫu im lặng. */
function unlock(ctx: AudioContext) {
  const source = ctx.createBufferSource()
  source.buffer = ctx.createBuffer(1, 1, ctx.sampleRate)
  source.connect(ctx.destination)
  source.start(0)
}

/** Lấy AudioContext dùng chung (tạo nếu chưa có); trả về null nếu trình duyệt không hỗ trợ. */
function getAudioContext(): AudioContext | null {
  // Safari đời cũ dùng tên webkitAudioContext
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  if (!audioCtx) {
    setPlaybackAudioSession()
    audioCtx = new Ctor()
    unlock(audioCtx)
  }
  // iOS báo "interrupted" (không phải "suspended") sau khi app chạy nền hoặc khóa màn hình.
  if (audioCtx.state !== 'running') audioCtx.resume().catch(() => {})
  return audioCtx
}

/** Đọc trạng thái tắt tiếng đã lưu; lỗi thì coi như đang bật tiếng. */
function loadMuted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

// Lưu lại impulse đã tạo để không phải tính lại mỗi lần lật thẻ
let cachedImpulse: { ctx: AudioContext; buffer: AudioBuffer } | null = null

/** Tạo impulse cho hiệu ứng vang: tiếng ồn nhỏ dần trong 1.8 giây, tạo đuôi ngân cho tiếng chuông mà không cần file âm thanh. */
function getReverbImpulse(ctx: AudioContext): AudioBuffer {
  if (cachedImpulse && cachedImpulse.ctx === ctx) return cachedImpulse.buffer
  const duration = 1.8
  const decayPower = 2.4
  const length = Math.floor(ctx.sampleRate * duration)
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate)
  for (let ch = 0; ch < impulse.numberOfChannels; ch++) {
    const data = impulse.getChannelData(ch)
    for (let i = 0; i < length; i++) {
      // Số ngẫu nhiên từ -1 đến 1 (tiếng ồn), nhân với hệ số giảm dần về 0
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decayPower)
    }
  }
  cachedImpulse = { ctx, buffer: impulse }
  return impulse
}

/**
 * Tổng hợp tiếng lật thẻ gồm 2 phần:
 * 1. Tiếng "vút":    noise → bandpass → noiseGain → loa
 * 2. Tiếng chuông:   oscillator → envelope → dryGain → loa (tiếng gốc)
 *                                         → reverb → wetGain → loa (tiếng vang)
 */
function playFlipTone(ctx: AudioContext) {
  const now = ctx.currentTime
  const whooshDuration = 0.14

  // --- Phần 1: tiếng "vút" ---
  // Tạo đoạn tiếng ồn trắng nhỏ dần
  const bufferSize = Math.floor(ctx.sampleRate * whooshDuration)
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    const decay = 1 - i / bufferSize
    data[i] = (Math.random() * 2 - 1) * decay
  }
  const noise = ctx.createBufferSource()
  noise.buffer = buffer

  // Bộ lọc chỉ cho một dải tần đi qua; tần số trượt từ cao xuống thấp tạo cảm giác lướt qua
  const bandpass = ctx.createBiquadFilter()
  bandpass.type = 'bandpass'
  bandpass.Q.value = 0.9
  bandpass.frequency.setValueAtTime(2200, now)
  bandpass.frequency.exponentialRampToValueAtTime(500, now + whooshDuration)

  // Giảm âm lượng dần. Ramp hàm mũ không thể về đúng 0 nên dừng ở 0.001.
  const noiseGain = ctx.createGain()
  noiseGain.gain.setValueAtTime(0.3, now)
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + whooshDuration)

  noise.connect(bandpass).connect(noiseGain).connect(ctx.destination)
  noise.start(now)
  noise.stop(now + whooshDuration)

  // --- Phần 2: tiếng chuông ---
  // Tiếng chuông đi qua reverb tự tạo để còn ngân vang sau khi thẻ đã lật xong.
  const reverb = ctx.createConvolver()
  reverb.buffer = getReverbImpulse(ctx)

  // dry = tiếng gốc, wet = tiếng đã qua reverb
  const dryGain = ctx.createGain()
  dryGain.gain.value = 0.55
  const wetGain = ctx.createGain()
  wetGain.gain.value = 0.5

  dryGain.connect(ctx.destination)
  reverb.connect(wetGain).connect(ctx.destination)

  // Chuông vang lên khi tiếng "vút" đã đi được 60%
  const chimeStart = now + whooshDuration * 0.6
  // Hai nốt ngân cùng lúc: [tần số Hz, âm lượng lớn nhất]
  const notes: Array<[frequency: number, peakGain: number]> = [
    [523.25, 0.28], // C5
    [784.0, 0.16], // G5
  ]

  for (const [frequency, peakGain] of notes) {
    // Mỗi nốt là một sóng sin
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = frequency

    // Đường bao âm lượng: im lặng → to ngay lúc chuông vang → nhỏ dần trong 0.9 giây
    const envelope = ctx.createGain()
    envelope.gain.setValueAtTime(0.0001, now)
    envelope.gain.setValueAtTime(peakGain, chimeStart)
    envelope.gain.exponentialRampToValueAtTime(0.0001, chimeStart + 0.9)

    // Chia tín hiệu làm hai nhánh: tiếng gốc và tiếng vang
    osc.connect(envelope)
    envelope.connect(dryGain)
    envelope.connect(reverb)

    osc.start(chimeStart)
    osc.stop(chimeStart + 1)
  }
}

export function useCardSound() {
  // Truyền hàm loadMuted (lazy init) để chỉ đọc localStorage một lần lúc khởi tạo
  const [muted, setMuted] = useState(loadMuted)

  // Phát tiếng lật thẻ, trừ khi đang tắt tiếng
  const play = useCallback(() => {
    if (muted) return
    const ctx = getAudioContext()
    if (!ctx) return
    try {
      playFlipTone(ctx)
    } catch {
      // Bỏ qua: bị chặn tự phát hoặc trình duyệt không hỗ trợ
    }
  }, [muted])

  // Đảo trạng thái tắt tiếng và lưu lại cho lần sau
  const toggleMuted = useCallback(() => {
    setMuted((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
      } catch {
        // Bỏ qua lỗi lưu trữ
      }
      return next
    })
  }, [])

  return { play, muted, toggleMuted }
}
