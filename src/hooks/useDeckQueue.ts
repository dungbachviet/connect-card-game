// Hook quản lý "hàng đợi" của một bộ bài: thứ tự câu hỏi, lá hiện tại, rút/quay lại/làm mới.
// Trạng thái được lưu vào localStorage nên tải lại trang vẫn chơi tiếp được.
import { useCallback, useEffect, useState } from 'react'
import type { DeckOrder } from '../data/decks'

interface QueueState {
  /** Thứ tự rút bài: mảng các chỉ số của câu hỏi, ví dụ [2, 0, 1]. */
  order: number[]
  /** Vị trí của lá hiện tại trong `order`; -1 = chưa rút lá nào. */
  pointer: number
  mode: DeckOrder
}

/** Xáo mảng bằng thuật toán Fisher–Yates; trả về mảng mới, không sửa mảng gốc. */
function shuffled(items: number[]): number[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    // Dấu `;` đầu dòng để dòng này không bị hiểu là nối tiếp dòng trên (code không dùng dấu chấm phẩy)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** Sắp xếp theo chế độ: xáo ngẫu nhiên hoặc tăng dần (đúng thứ tự gốc của câu hỏi). */
function arrange(items: number[], mode: DeckOrder): number[] {
  return mode === 'shuffled' ? shuffled(items) : [...items].sort((a, b) => a - b)
}

/** Tạo thứ tự mới cho cả bộ bài từ dãy chỉ số 0, 1, 2, ..., total - 1. */
function freshOrder(total: number, mode: DeckOrder): number[] {
  return arrange(
    Array.from({ length: total }, (_, i) => i),
    mode,
  )
}

/** Đọc trạng thái đã lưu; nếu không có hoặc không còn hợp lệ thì tạo trạng thái mới. */
function loadState(deckId: string, total: number, defaultMode: DeckOrder): QueueState {
  try {
    const raw = localStorage.getItem(`tam-giao:${deckId}`)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<QueueState>
      // Kiểm tra độ dài vì số câu hỏi có thể đã đổi so với lần lưu trước
      if (Array.isArray(parsed.order) && parsed.order.length === total && typeof parsed.pointer === 'number') {
        const mode = parsed.mode === 'ordered' || parsed.mode === 'shuffled' ? parsed.mode : defaultMode
        return { order: parsed.order, pointer: parsed.pointer, mode }
      }
    }
  } catch {
    // Bỏ qua nếu dữ liệu lưu bị hỏng
  }
  return { order: freshOrder(total, defaultMode), pointer: -1, mode: defaultMode }
}

export function useDeckQueue(deckId: string, questions: string[], defaultMode: DeckOrder = 'shuffled') {
  const total = questions.length
  // Truyền hàm vào useState (lazy init) để chỉ đọc localStorage một lần lúc khởi tạo
  const [state, setState] = useState<QueueState>(() => loadState(deckId, total, defaultMode))
  // Đếm số lần gọi draw/reset/goBack, kể cả khi câu hiện tại không đổi; setMode không được tính.
  // GameScreen theo dõi biến này để biết một thao tác vừa xong.
  const [actionCount, setActionCount] = useState(0)

  // Đổi sang bộ bài khác thì nạp lại trạng thái của bộ đó
  useEffect(() => {
    setState(loadState(deckId, total, defaultMode))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId])

  // Mỗi khi state đổi thì ghi xuống localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`tam-giao:${deckId}`, JSON.stringify(state))
    } catch {
      // Bỏ qua lỗi hết dung lượng lưu trữ
    }
  }, [deckId, state])

  // true khi chưa rút lá nào: lúc mới vào bộ bài hoặc vừa reset
  const justReshuffled = state.pointer === -1

  // Các hàm dưới đây dùng setState((prev) => ...) để luôn tính từ state mới nhất.
  // useCallback giữ nguyên tham chiếu hàm giữa các lần render.

  // Rút lá tiếp theo; nếu đã hết bộ thì tạo thứ tự mới và quay lại lá đầu
  const draw = useCallback(() => {
    setState((prev) => {
      const nextPointer = prev.pointer + 1
      if (nextPointer >= total) {
        return { ...prev, order: freshOrder(total, prev.mode), pointer: 0 }
      }
      return { ...prev, pointer: nextPointer }
    })
    setActionCount((count) => count + 1)
  }, [total])

  // Tạo thứ tự mới và trở về trạng thái chưa rút lá nào
  const reset = useCallback(() => {
    setState((prev) => ({ ...prev, order: freshOrder(total, prev.mode), pointer: -1 }))
    setActionCount((count) => count + 1)
  }, [total])

  // Lùi về lá trước; đang ở lá đầu tiên thì giữ nguyên
  const goBack = useCallback(() => {
    setState((prev) => (prev.pointer > 0 ? { ...prev, pointer: prev.pointer - 1 } : prev))
    setActionCount((count) => count + 1)
  }, [])

  // Đổi chế độ: giữ nguyên các lá đã rút, chỉ sắp xếp lại các lá chưa rút.
  const setMode = useCallback((mode: DeckOrder) => {
    setState((prev) => {
      if (prev.mode === mode) return prev
      const drawn = prev.order.slice(0, prev.pointer + 1)
      const remaining = prev.order.slice(prev.pointer + 1)
      return { ...prev, mode, order: [...drawn, ...arrange(remaining, mode)] }
    })
  }, [])

  // Các giá trị suy ra từ state: pointer → chỉ số câu hỏi → nội dung câu hỏi
  const currentIndex = state.pointer >= 0 ? state.order[state.pointer] : null
  const currentQuestion = currentIndex !== null ? questions[currentIndex] : null
  const drawnCount = state.pointer >= 0 ? state.pointer + 1 : 0

  return {
    currentQuestion,
    actionCount,
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
