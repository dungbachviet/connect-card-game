import { motion } from 'motion/react'
import type { Deck } from '../data/decks'
import { HALLOWEEN } from '../theme/halloween'

interface DeckSelectorProps {
  decks: Deck[]
  onSelect: (deckId: string) => void
}

export function DeckSelector({ decks, onSelect }: DeckSelectorProps) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden px-5 pb-12 pt-[calc(env(safe-area-inset-top,0px)+2.5rem)]">
      <div
        className={`pointer-events-none absolute -top-40 left-1/2 h-96 w-[36rem] -translate-x-1/2 rounded-full blur-[110px] ${
          HALLOWEEN ? 'bg-orange-500/20' : 'bg-fuchsia-500/20'
        }`}
        aria-hidden
      />
      <div
        className={`pointer-events-none absolute bottom-[-8rem] right-[-6rem] h-72 w-72 rounded-full blur-[100px] ${
          HALLOWEEN ? 'bg-purple-600/15' : 'bg-sky-500/10'
        }`}
        aria-hidden
      />

      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 mx-auto max-w-md text-center"
      >
        {HALLOWEEN ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-400/30 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-200 backdrop-blur">
            🎃 Halloween · Bộ bài kết nối
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-300 backdrop-blur">
            🃏 Bộ bài kết nối
          </span>
        )}
        <h1
          className={`mt-4 bg-gradient-to-br bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl ${
            HALLOWEEN
              ? 'from-amber-200 via-orange-400 to-purple-400 drop-shadow-[0_0_24px_rgba(249,115,22,0.35)]'
              : 'from-white via-white to-zinc-400'
          }`}
        >
          Tâm Giao
        </h1>
        <p className="mt-3 text-balance text-sm leading-relaxed text-zinc-400 sm:text-base">
          Chọn một bộ bài, rút một lá, và để câu hỏi dẫn dắt cuộc trò chuyện.
          Chỉ cần một chiếc điện thoại để cả nhóm hiểu nhau hơn.
        </p>
        {HALLOWEEN && (
          <p className="mt-2 text-sm font-medium text-orange-300/80">
            Đêm Halloween — kể nhau nghe những điều thật lòng nhất 👻
          </p>
        )}
      </motion.header>

      <div className="relative z-10 mx-auto mt-10 grid w-full max-w-2xl gap-4 sm:grid-cols-2">
        {decks.map((deck, index) => (
          <motion.button
            key={deck.id}
            type="button"
            onClick={() => onSelect(deck.id)}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: index * 0.07 }}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.97 }}
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-left backdrop-blur transition hover:border-white/20"
          >
            <div
              className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-30 blur-2xl transition group-hover:opacity-50"
              style={{ background: `linear-gradient(135deg, ${deck.from}, ${deck.to})` }}
              aria-hidden
            />
            <div className="relative flex items-start justify-between">
              <span
                className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl shadow-lg"
                style={{ background: `linear-gradient(135deg, ${deck.from}, ${deck.to})` }}
              >
                {deck.emoji}
              </span>
              <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[11px] font-medium text-zinc-400">
                {deck.questions.length} câu
              </span>
            </div>
            <h2 className="relative mt-4 text-lg font-bold text-zinc-50">{deck.title}</h2>
            <p className="relative mt-0.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {deck.tagline}
            </p>
            <p className="relative mt-2 text-sm leading-relaxed text-zinc-400">{deck.description}</p>
            <span className="relative mt-4 inline-flex items-center gap-1 text-sm font-semibold text-zinc-200">
              Bắt đầu chơi
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 transition group-hover:translate-x-0.5">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </motion.button>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="relative z-10 mx-auto mt-10 max-w-md text-center text-xs leading-relaxed text-zinc-500"
      >
        Mẹo: ngồi thành vòng tròn, truyền điện thoại cho nhau. Mỗi lượt một người rút thẻ và trả lời trước cả nhóm.
      </motion.p>
    </div>
  )
}
