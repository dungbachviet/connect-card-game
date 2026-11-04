// Lá bài lật 3D: mặt trước là bìa bộ bài, mặt sau là câu hỏi.
//
// Cách làm hiệu ứng lật:
// - Thẻ cha đặt `perspective` để tạo chiều sâu, nếu thiếu thì lúc xoay trông như bị bóp dẹt.
// - Nút bấm đặt `preserve-3d` để hai mặt con cùng nằm trong không gian 3D và xoay theo nó.
// - Hai mặt nằm chồng lên nhau, mặt sau xoay sẵn 180°, cả hai ẩn đi khi quay lưng lại (backfaceVisibility).
// - Chỉ cần xoay nút bấm 0° ↔ 180° là mặt tương ứng hiện ra.
import { motion } from 'motion/react'
import type { Deck } from '../data/decks'
import { HALLOWEEN } from '../theme/halloween'
import { SpiderWeb } from './HalloweenDecor'

interface PlayingCardProps {
  deck: Deck
  /** Câu hỏi hiển thị ở mặt sau; null khi chưa rút lá nào. */
  question: string | null
  /** true = đang ngửa mặt câu hỏi, false = đang úp mặt bìa. */
  revealed: boolean
  onDraw: () => void
}

export function PlayingCard({ deck, question, revealed, onDraw }: PlayingCardProps) {
  return (
    // Khung ngoài: tạo phối cảnh 3D, select-none để không bôi đen chữ khi chạm
    <div
      className="relative mx-auto w-full max-w-sm select-none"
      style={{ perspective: '1800px' }}
    >
      {/* Toàn bộ lá bài là một nút bấm, xoay quanh trục dọc theo `revealed` */}
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
        {/* ===== MẶT TRƯỚC: bìa bộ bài (nền gradient, emoji, tên bộ) ===== */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-5 rounded-[28px] p-8 text-center shadow-2xl"
          style={{
            backfaceVisibility: 'hidden',
            background: `linear-gradient(155deg, ${deck.from}, ${deck.to})`,
            boxShadow: `0 30px 60px -20px ${deck.glow}`,
          }}
        >
          {/* Viền trang trí bên trong, cách mép thẻ một khoảng */}
          <div className="absolute inset-4 rounded-[20px] border border-white/25" />

          {/* Mạng nhện và bí ngô ở hai góc (chỉ có trong theme Halloween) */}
          {HALLOWEEN && (
            <>
              <SpiderWeb className="absolute right-4 top-4 h-20 w-20 rounded-tr-[20px] text-white/40" flip />
              <span className="absolute bottom-6 left-7 text-2xl opacity-90">🎃</span>
            </>
          )}

          {/* Emoji lớn của bộ bài */}
          <span className="text-6xl drop-shadow-sm">{deck.emoji}</span>

          {/* Tên bộ bài và lời nhắc chạm */}
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

        {/* ===== MẶT SAU: câu hỏi (xoay sẵn 180° nên lúc đầu đang quay lưng) ===== */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-6 rounded-[28px] border border-white/10 bg-zinc-900/95 p-8 text-center shadow-2xl"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            boxShadow: `0 30px 60px -20px ${deck.glow}`,
          }}
        >
          {/* Đường kẻ sáng mảnh ở mép trên */}
          <div
            className="absolute inset-x-6 top-6 h-px opacity-40"
            style={{ background: `linear-gradient(90deg, transparent, ${deck.from}, transparent)` }}
          />

          {/* Mạng nhện ở góc trái (chỉ có trong theme Halloween) */}
          {HALLOWEEN && (
            <SpiderWeb className="absolute left-0 top-0 h-16 w-16 rounded-tl-[28px] text-zinc-400/20" />
          )}

          {/* Emoji nhỏ, nội dung câu hỏi, tên bộ bài ở dưới cùng */}
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
