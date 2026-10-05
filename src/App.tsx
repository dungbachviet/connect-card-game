import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { DeckSelector } from './components/DeckSelector'
import { HalloweenDecor } from './components/HalloweenDecor'
import { GameScreen } from './components/GameScreen'
import { decks, getDeckById } from './data/decks'
import { HALLOWEEN } from './theme/halloween'

function App() {
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null)
  const selectedDeck = selectedDeckId ? getDeckById(selectedDeckId) : undefined

  return (
    <>
      {HALLOWEEN && <HalloweenDecor />}
      <AnimatePresence mode="wait">
        {selectedDeck ? (
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
