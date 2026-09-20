import { useCallback, useEffect, useState } from 'react'

interface QueueState {
  order: number[]
  pointer: number
}

function shuffle(length: number): number[] {
  const arr = Array.from({ length }, (_, i) => i)
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function loadState(deckId: string, total: number): QueueState {
  try {
    const raw = localStorage.getItem(`tam-giao:${deckId}`)
    if (raw) {
      const parsed = JSON.parse(raw) as QueueState
      if (Array.isArray(parsed.order) && parsed.order.length === total) {
        return parsed
      }
    }
  } catch {
    // ignore corrupt storage
  }
  return { order: shuffle(total), pointer: -1 }
}

export function useDeckQueue(deckId: string, questions: string[]) {
  const total = questions.length
  const [state, setState] = useState<QueueState>(() => loadState(deckId, total))

  useEffect(() => {
    setState(loadState(deckId, total))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId])

  useEffect(() => {
    try {
      localStorage.setItem(`tam-giao:${deckId}`, JSON.stringify(state))
    } catch {
      // ignore storage quota errors
    }
  }, [deckId, state])

  const justReshuffled = state.pointer === -1

  const draw = useCallback(() => {
    setState((prev) => {
      const nextPointer = prev.pointer + 1
      if (nextPointer >= total) {
        return { order: shuffle(total), pointer: 0 }
      }
      return { ...prev, pointer: nextPointer }
    })
  }, [total])

  const reset = useCallback(() => {
    setState({ order: shuffle(total), pointer: -1 })
  }, [total])

  const goBack = useCallback(() => {
    setState((prev) => (prev.pointer > 0 ? { ...prev, pointer: prev.pointer - 1 } : prev))
  }, [])

  const currentIndex = state.pointer >= 0 ? state.order[state.pointer] : null
  const currentQuestion = currentIndex !== null ? questions[currentIndex] : null
  const drawnCount = state.pointer >= 0 ? state.pointer + 1 : 0

  return {
    currentQuestion,
    drawnCount,
    total,
    draw,
    reset,
    goBack,
    canGoBack: state.pointer > 0,
    justReshuffled,
    isExhausted: drawnCount >= total,
  }
}
