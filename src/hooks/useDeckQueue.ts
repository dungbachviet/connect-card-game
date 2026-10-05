import { useCallback, useEffect, useState } from 'react'
import type { DeckOrder } from '../data/decks'

interface QueueState {
  order: number[]
  pointer: number
  mode: DeckOrder
}

function shuffled(items: number[]): number[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function arrange(items: number[], mode: DeckOrder): number[] {
  return mode === 'shuffled' ? shuffled(items) : [...items].sort((a, b) => a - b)
}

function freshOrder(total: number, mode: DeckOrder): number[] {
  return arrange(
    Array.from({ length: total }, (_, i) => i),
    mode,
  )
}

function loadState(deckId: string, total: number, defaultMode: DeckOrder): QueueState {
  try {
    const raw = localStorage.getItem(`tam-giao:${deckId}`)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<QueueState>
      if (Array.isArray(parsed.order) && parsed.order.length === total && typeof parsed.pointer === 'number') {
        const mode = parsed.mode === 'ordered' || parsed.mode === 'shuffled' ? parsed.mode : defaultMode
        return { order: parsed.order, pointer: parsed.pointer, mode }
      }
    }
  } catch {
    // ignore corrupt storage
  }
  return { order: freshOrder(total, defaultMode), pointer: -1, mode: defaultMode }
}

export function useDeckQueue(deckId: string, questions: string[], defaultMode: DeckOrder = 'shuffled') {
  const total = questions.length
  const [state, setState] = useState<QueueState>(() => loadState(deckId, total, defaultMode))

  useEffect(() => {
    setState(loadState(deckId, total, defaultMode))
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
        return { ...prev, order: freshOrder(total, prev.mode), pointer: 0 }
      }
      return { ...prev, pointer: nextPointer }
    })
  }, [total])

  const reset = useCallback(() => {
    setState((prev) => ({ ...prev, order: freshOrder(total, prev.mode), pointer: -1 }))
  }, [total])

  const goBack = useCallback(() => {
    setState((prev) => (prev.pointer > 0 ? { ...prev, pointer: prev.pointer - 1 } : prev))
  }, [])

  // Keep the cards already drawn; only rearrange the ones not yet drawn.
  const setMode = useCallback((mode: DeckOrder) => {
    setState((prev) => {
      if (prev.mode === mode) return prev
      const drawn = prev.order.slice(0, prev.pointer + 1)
      const remaining = prev.order.slice(prev.pointer + 1)
      return { ...prev, mode, order: [...drawn, ...arrange(remaining, mode)] }
    })
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
    mode: state.mode,
    setMode,
    canGoBack: state.pointer > 0,
    justReshuffled,
    isExhausted: drawnCount >= total,
  }
}
