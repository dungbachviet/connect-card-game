// Màn chơi chính: điều khiển việc rút/lật thẻ và vẽ header, thanh tiến độ, lá bài, các nút bấm.
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import type { Deck, DeckOrder } from '../data/decks'
import { useCardSound } from '../hooks/useCardSound'
import { useDeckQueue } from '../hooks/useDeckQueue'
import { PlayingCard } from './PlayingCard'

interface GameScreenProps {
  deck: Deck
  /** Quay về màn chọn bộ bài. */
  onBack: () => void
}

// Thời gian lá bài úp xuống (khoảng nửa animation lật 0.65s trong PlayingCard).
// Đợi hết khoảng này mới đổi câu hỏi để không lộ câu mới khi thẻ còn đang xoay.
const FLIP_HALF_MS = 340

export function GameScreen({ deck, onBack }: GameScreenProps) {
  const queue = useDeckQueue(deck.id, deck.questions, deck.defaultOrder)
  const { play: playFlipSound, muted, toggleMuted } = useCardSound()
  // true = lá bài đang ngửa mặt câu hỏi. Nếu đang chơi dở từ lần trước thì ngửa luôn khi mở lại.
  const [revealed, setRevealed] = useState(queue.currentQuestion !== null)
  // Câu đang vẽ trên thẻ. Tách khỏi queue.currentQuestion để chỉ đổi chữ vào đúng lúc thẻ đang úp.
  const [displayed, setDisplayed] = useState<string | null>(queue.currentQuestion)
  // Khóa chống bấm liên tục khi đang lật. Dùng ref vì đổi giá trị không cần vẽ lại giao diện.
  const pending = useRef(false)

  // Chạy sau mỗi draw/goBack/reset: cập nhật câu mới, lật thẻ theo kết quả rồi mở khóa.
  // Theo dõi actionCount thay vì currentQuestion, vì có thao tác không làm đổi câu hỏi
  // (ví dụ reset khi chưa rút lá nào) mà vẫn phải mở khóa.
  useEffect(() => {
    if (!pending.current) return
    pending.current = false
    setDisplayed(queue.currentQuestion)
    setRevealed(queue.currentQuestion !== null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue.actionCount])

  // Rút thẻ tiếp theo
  const handleDraw = () => {
    if (pending.current) return
    pending.current = true
    playFlipSound()
    if (!revealed) {
      // Thẻ đang úp: rút luôn, effect phía trên sẽ lật thẻ lên.
      queue.draw()
    } else {
      // Thẻ đang ngửa: úp xuống trước, đợi nửa nhịp lật rồi mới rút.
      setRevealed(false)
      window.setTimeout(() => {
        playFlipSound()
        queue.draw()
      }, FLIP_HALF_MS)
    }
  }

  // Xem lại lá trước, cùng trình tự với handleDraw
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

  // Úp thẻ rồi làm mới bộ bài về trạng thái chưa rút lá nào
  const handleReset = () => {
    if (pending.current) return
    pending.current = true
    playFlipSound()
    setRevealed(false)
    window.setTimeout(() => queue.reset(), FLIP_HALF_MS)
  }

  const isOrdered = queue.mode === 'ordered'

  // Hai lựa chọn của công tắc thứ tự rút bài
  const orderOptions: { value: DeckOrder; label: string }[] = [
    { value: 'ordered', label: 'Theo thứ tự' },
    { value: 'shuffled', label: 'Xáo trộn' },
  ]

  // Tỉ lệ tiến độ từ 0 đến 1 (kiểm tra total để tránh chia cho 0)
  const progress = queue.total > 0 ? Math.min(1, queue.drawnCount / queue.total) : 0

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden px-5 pb-10 pt-[calc(env(safe-area-inset-top,0px)+1.25rem)]">
      {/* Vệt sáng nền phía trên, theo màu của bộ bài */}
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: deck.glow }}
        aria-hidden
      />

      {/* ===== HEADER: [nút quay lại] — [tên bộ bài] — [âm thanh, xáo lại] ===== */}
      <header className="relative z-10 flex items-center justify-between gap-3">
        {/* Cụm trái */}
        <div className="flex items-center gap-2">
          {/* Nút quay về màn chọn bộ bài (icon mũi tên trái) */}
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
          {/* Ô tàng hình: cụm trái rộng bằng cụm phải (2 nút) để tên bộ bài nằm giữa */}
          <div className="h-11 w-11 opacity-0" aria-hidden />
        </div>

        {/* Cụm giữa: tên bộ bài và tổng số câu */}
        <div className="flex flex-col items-center">
          <span className="text-sm font-semibold text-zinc-100">
            {deck.emoji} {deck.title}
          </span>
          <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            {queue.total} câu hỏi
          </span>
        </div>

        {/* Cụm phải */}
        <div className="flex items-center gap-2">
          {/* Nút bật/tắt âm thanh, đổi icon theo trạng thái muted */}
          <button
            type="button"
            onClick={toggleMuted}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-200 backdrop-blur transition hover:bg-white/10 active:scale-95"
            aria-label={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {muted ? (
              // Icon loa có dấu X
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <path d="M11 5 6 9H3v6h3l5 4V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="m17 9 5 6M22 9l-5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              // Icon loa có sóng âm
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <path d="M11 5 6 9H3v6h3l5 4V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>

          {/* Nút bắt đầu lại / xáo lại (icon hai mũi tên xoay vòng) */}
          <button
            type="button"
            onClick={handleReset}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-200 backdrop-blur transition hover:bg-white/10 active:scale-95"
            aria-label={isOrdered ? 'Bắt đầu lại từ câu đầu tiên' : 'Xáo lại bộ bài'}
            title={isOrdered ? 'Bắt đầu lại từ câu đầu tiên' : 'Xáo lại bộ bài'}
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

      {/* ===== THANH TIẾN ĐỘ: motion tự animate độ rộng theo số lá đã rút ===== */}
      <div className="relative z-10 mx-auto mt-4 h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-white/5">
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${deck.from}, ${deck.to})` }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* ===== CÔNG TẮC THỨ TỰ: "Theo thứ tự" | "Xáo trộn" ===== */}
      <div
        role="radiogroup"
        aria-label="Thứ tự rút bài"
        className="relative z-10 mx-auto mt-4 flex rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur"
      >
        {orderOptions.map((option) => {
          // Lựa chọn đang bật được tô màu gradient của bộ bài
          const active = queue.mode === option.value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => queue.setMode(option.value)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition active:scale-95 ${
                active ? 'shadow' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              style={
                active
                  ? { background: `linear-gradient(135deg, ${deck.from}, ${deck.to})`, color: deck.textOnAccent }
                  : undefined
              }
            >
              {option.label}
            </button>
          )
        })}
      </div>

      {/* ===== KHU VỰC CHÍNH: lá bài ở giữa, bên dưới là dòng trạng thái và các nút ===== */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-8 py-6">
        {/* Lá bài: bấm vào thẻ cũng rút thẻ giống nút bên dưới */}
        <PlayingCard deck={deck} question={displayed} revealed={revealed} onDraw={handleDraw} />

        <div className="flex flex-col items-center gap-3 text-center">
          {/* Dòng trạng thái "Câu x / y". `key` đổi là dòng cũ mờ đi, dòng mới trượt vào */}
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
                : `Câu ${queue.drawnCount} / ${queue.total} · ${
                    isOrdered ? 'theo thứ tự gốc' : 'hết bộ sẽ tự xáo lại'
                  }`}
            </motion.p>
          </AnimatePresence>

          {/* Hàng nút điều khiển */}
          <div className="flex items-center gap-3">
            {/* Nút xem lại lá trước: chỉ hiện khi đã rút thẻ, bị mờ nếu đang ở lá đầu tiên */}
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

            {/* Nút chính: "Bắt đầu" khi chưa rút lá nào, sau đó là "Rút thẻ tiếp theo" */}
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
