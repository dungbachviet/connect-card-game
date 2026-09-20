import { motion } from 'motion/react'
import type { Deck } from '../data/decks'

interface PlayingCardProps {
  deck: Deck
  question: string | null
  revealed: boolean
  onDraw: () => void
}

export function PlayingCard({ deck, question, revealed, onDraw }: PlayingCardProps) {
  return (
    <div
      className="relative mx-auto w-full max-w-sm select-none"
      style={{ perspective: '1800px' }}
    >
      <motion.button
        type="button"
        onClick={onDraw}
        className="relative block aspect-[3/4.3] w-full cursor-pointer rounded-[28px] text-left outline-none"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: revealed ? 180 : 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        whileTap={{ scale: 0.97 }}
        aria-label={revealed ? 'Rút thẻ tiếp theo' : 'Chạm để rút thẻ'}
      >
        {/* Front face — deck cover */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-5 rounded-[28px] p-8 text-center shadow-2xl"
          style={{
            backfaceVisibility: 'hidden',
            background: `linear-gradient(155deg, ${deck.from}, ${deck.to})`,
            boxShadow: `0 30px 60px -20px ${deck.glow}`,
          }}
        >
          <div className="absolute inset-4 rounded-[20px] border border-white/25" />
          <span className="text-6xl drop-shadow-sm">{deck.emoji}</span>
          <div>
            <p
              className="text-2xl font-bold tracking-tight"
              style={{ color: deck.textOnAccent }}
            >
              {deck.title}
            </p>
            <p
              className="mt-2 text-sm font-medium opacity-80"
              style={{ color: deck.textOnAccent }}
            >
              Chạm để rút thẻ
            </p>
          </div>
        </div>

        {/* Back face — question */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-6 rounded-[28px] border border-white/10 bg-zinc-900/95 p-8 text-center shadow-2xl"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            boxShadow: `0 30px 60px -20px ${deck.glow}`,
          }}
        >
          <div
            className="absolute inset-x-6 top-6 h-px opacity-40"
            style={{ background: `linear-gradient(90deg, transparent, ${deck.from}, transparent)` }}
          />
          <span className="text-3xl">{deck.emoji}</span>
          <p className="text-balance text-xl font-semibold leading-snug text-zinc-50 sm:text-2xl">
            {question}
          </p>
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
            {deck.title}
          </span>
        </div>
      </motion.button>
    </div>
  )
}
