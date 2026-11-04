// Component gốc: quyết định đang hiện màn nào (chọn bộ bài hay màn chơi) và làm hiệu ứng chuyển màn.
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { DeckSelector } from './components/DeckSelector'
import { HalloweenDecor } from './components/HalloweenDecor'
import { GameScreen } from './components/GameScreen'
import { decks, getDeckById } from './data/decks'
import { HALLOWEEN } from './theme/halloween'

function App() {
  // null = chưa chọn bộ nào → hiện màn chọn bộ bài.
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null)
  // Chỉ lưu id trong state, còn object bộ bài thì tra ra từ id mỗi lần render.
  const selectedDeck = selectedDeckId ? getDeckById(selectedDeckId) : undefined

  return (
    <>
      {/* Lớp trang trí nền: nằm ngoài AnimatePresence nên không bị mờ đi khi chuyển màn */}
      {HALLOWEEN && <HalloweenDecor />}

      {/* AnimatePresence cho phép chạy `exit` trước khi gỡ component.
          mode="wait": màn cũ mờ hẳn rồi màn mới mới hiện. */}
      <AnimatePresence mode="wait">
        {selectedDeck ? (
          // Màn chơi. `key` khác nhau giúp AnimatePresence biết đây là hai màn khác nhau.
          <motion.div
            key={selectedDeck.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <GameScreen deck={selectedDeck} onBack={() => setSelectedDeckId(null)} />
          </motion.div>
        ) : (
          // Màn chọn bộ bài
          <motion.div
            key="selector"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <DeckSelector decks={decks} onSelect={setSelectedDeckId} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default App
