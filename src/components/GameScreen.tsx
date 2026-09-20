import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import type { Deck } from '../data/decks'
import { useCardSound } from '../hooks/useCardSound'
import { useDeckQueue } from '../hooks/useDeckQueue'
import { PlayingCard } from './PlayingCard'

interface GameScreenProps {
  deck: Deck
  onBack: () => void
}

const FLIP_HALF_MS = 340

export function GameScreen({ deck, onBack }: GameScreenProps) {
  const queue = useDeckQueue(deck.id, deck.questions)
  const { play: playFlipSound, muted, toggleMuted } = useCardSound()
  const [revealed, setRevealed] = useState(queue.currentQuestion !== null)
  const [displayed, setDisplayed] = useState<string | null>(queue.currentQuestion)
  const pending = useRef(false)

  useEffect(() => {
    if (!pending.current) return
    pending.current = false
    setDisplayed(queue.currentQuestion)
    setRevealed(queue.currentQuestion !== null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue.currentQuestion])

  const handleDraw = () => {
    if (pending.current) return
    pending.current = true
    playFlipSound()
    if (!revealed) {
      queue.draw()
    } else {
      setRevealed(false)
      window.setTimeout(() => {
        playFlipSound()
        queue.draw()
      }, FLIP_HALF_MS)
    }
  }

  const handleBack = () => {
    if (pending.current || !queue.canGoBack) return
    pending.current = true
    playFlipSound()
    if (!revealed) {
      queue.goBack()
    } else {
      setRevealed(false)
      window.setTimeout(() => {
        playFlipSound()
        queue.goBack()
      }, FLIP_HALF_MS)
    }
  }

  const handleReset = () => {
    if (pending.current) return
    pending.current = true
    playFlipSound()
    setRevealed(false)
    window.setTimeout(() => queue.reset(), FLIP_HALF_MS)
  }

  const progress = queue.total > 0 ? Math.min(1, queue.drawnCount / queue.total) : 0

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden px-5 pb-10 pt-[calc(env(safe-area-inset-top,0px)+1.25rem)]">
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: deck.glow }}
        aria-hidden
      />

      <header className="relative z-10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-200 backdrop-blur transition hover:bg-white/10 active:scale-95"
            aria-label="Quay lại chọn bộ bài"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="h-11 w-11 opacity-0" aria-hidden />
        </div>

        <div className="flex flex-col items-center">
          <span className="text-sm font-semibold text-zinc-100">
            {deck.emoji} {deck.title}
          </span>
          <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            {queue.total} câu hỏi
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleMuted}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-200 backdrop-blur transition hover:bg-white/10 active:scale-95"
            aria-label={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {muted ? (
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <path d="M11 5 6 9H3v6h3l5 4V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="m17 9 5 6M22 9l-5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <path d="M11 5 6 9H3v6h3l5 4V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-200 backdrop-blur transition hover:bg-white/10 active:scale-95"
            aria-label="Xáo lại bộ bài"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path
                d="M4 4v5h5M20 20v-5h-5M4.5 9a7.5 7.5 0 0113-4.5L20 7M19.5 15a7.5 7.5 0 01-13 4.5L4 17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </header>

      <div className="relative z-10 mx-auto mt-4 h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-white/5">
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${deck.from}, ${deck.to})` }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-8 py-6">
        <PlayingCard deck={deck} question={displayed} revealed={revealed} onDraw={handleDraw} />

        <div className="flex flex-col items-center gap-3 text-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={displayed === null ? 'empty' : queue.drawnCount}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="text-sm text-zinc-400"
            >
              {displayed === null
                ? 'Chạm vào lá bài để rút câu hỏi đầu tiên'
                : `Câu ${queue.drawnCount} / ${queue.total} · hết bộ sẽ tự xáo lại`}
            </motion.p>
          </AnimatePresence>

          <div className="flex items-center gap-3">
            {displayed !== null && (
              <button
                type="button"
                onClick={handleBack}
                disabled={!queue.canGoBack}
                aria-label="Xem lại lá trước"
                className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-200 backdrop-blur transition hover:bg-white/10 active:scale-95 disabled:pointer-events-none disabled:opacity-30"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                  <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}

            <button
              type="button"
              onClick={handleDraw}
              className="rounded-full px-8 py-3.5 text-base font-semibold text-white shadow-lg transition active:scale-95"
              style={{
                background: `linear-gradient(135deg, ${deck.from}, ${deck.to})`,
                boxShadow: `0 16px 30px -12px ${deck.glow}`,
              }}
            >
              {displayed === null ? 'Bắt đầu' : 'Rút thẻ tiếp theo'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
