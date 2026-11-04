# 09-00. Đọc từng dòng `useDeckQueue.ts`

**File trong bài:** [src/hooks/useDeckQueue.ts](../src/hooks/useDeckQueue.ts)

Bài này đi qua từng dòng của file, từ trên xuống dưới, để bạn hiểu **mỗi dòng làm gì**. Sau đó, [bài 09](09-use-deck-queue.md) sẽ giải thích sâu hơn về **lý do thiết kế** và các khái niệm React.

File có đuôi `.ts` chứ không phải `.tsx`, vì trong file không có JSX. Đây là logic thuần túy, không vẽ giao diện.

## Trước khi đọc: ý tưởng của file

File này quản lý việc rút bài bằng một mảng thứ tự và một con trỏ:

```text
questions = ['A', 'B', 'C', 'D']     Danh sách câu hỏi gốc
order     = [2, 0, 3, 1]             Thứ tự rút. Mỗi số là vị trí trong questions
pointer   = 1                        Đang ở phần tử thứ hai của order

Câu hiện tại = questions[order[1]] = questions[0] = 'A'
```

Khi `pointer = -1`, chưa có lá nào được rút. Rút lá tiếp theo chỉ đơn giản là tăng `pointer` thêm 1.

## Bản đồ của file

```text
Dòng 1-2     Import
Dòng 4-8     Kiểu dữ liệu QueueState
Dòng 10-17   shuffled      Xáo trộn một mảng
Dòng 19-21   arrange       Sắp xếp theo chế độ
Dòng 23-28   freshOrder    Tạo thứ tự mới
Dòng 30-44   loadState     Đọc tiến trình đã lưu
Dòng 46-116  useDeckQueue  Custom hook, phần chính của file
```

## 1. Import ([dòng 1-2](../src/hooks/useDeckQueue.ts#L1-L2))

```ts
import { useCallback, useEffect, useState } from 'react'
import type { DeckOrder } from '../data/decks'
```

- **Dòng 1** lấy ba hook của React. `useState` để ghi nhớ giá trị, `useEffect` để làm việc với bên ngoài React, `useCallback` để giữ một hàm ổn định qua các lần render.
- **Dòng 2** lấy kiểu `DeckOrder`, tức là `'ordered' | 'shuffled'`. Từ khóa `import type` cho biết đây chỉ là kiểu, và sẽ bị xóa khi dịch sang JavaScript. `../` nghĩa là đi lên một thư mục, từ `hooks/` lên `src/`.

## 2. Kiểu `QueueState` ([dòng 4-8](../src/hooks/useDeckQueue.ts#L4-L8))

```ts
interface QueueState {
  order: number[]
  pointer: number
  mode: DeckOrder
}
```

Đây là hình dạng của dữ liệu ván chơi, gồm đúng ba trường:

| Trường | Kiểu | Ý nghĩa |
|---|---|---|
| `order` | Mảng số | Thứ tự rút các câu hỏi |
| `pointer` | Số | Vị trí hiện tại trong `order` |
| `mode` | `'ordered'` hoặc `'shuffled'` | Chế độ "Theo thứ tự" hoặc "Xáo trộn" |

Ví dụ một giá trị hợp lệ:

```ts
{ order: [2, 0, 3, 1], pointer: 1, mode: 'shuffled' }
```

Interface không có `export`, nên chỉ dùng được trong file này.

## 3. Hàm `shuffled`: xáo trộn mảng ([dòng 10-17](../src/hooks/useDeckQueue.ts#L10-L17))

```ts
function shuffled(items: number[]): number[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
```

Hàm nhận một mảng số và trả về một mảng mới đã xáo trộn. Đây là thuật toán Fisher–Yates.

| Dòng code | Ý nghĩa |
|---|---|
| `items: number[]` | Tham số là một mảng số |
| `): number[] {` | Hàm trả về một mảng số |
| `const arr = [...items]` | Chép sang mảng mới, để không sửa mảng gốc |
| `for (let i = arr.length - 1; i > 0; i--)` | Đi từ phần tử cuối về đầu. Dừng trước vị trí 0, vì khi đó chỉ còn một phần tử |
| `Math.random() * (i + 1)` | Một số thực từ 0 đến nhỏ hơn `i + 1` |
| `Math.floor(...)` | Làm tròn xuống, được một vị trí từ `0` đến `i` |
| `[arr[i], arr[j]] = [arr[j], arr[i]]` | Đổi chỗ hai phần tử |
| `return arr` | Trả về mảng đã xáo |

Dấu `;` ở đầu dòng đổi chỗ là có chủ đích. Dự án không dùng dấu chấm phẩy ở cuối dòng, nên nếu thiếu dấu này, JavaScript sẽ hiểu `[` là phần nối tiếp của dòng phía trên.

Giả sử đầu vào là `[0, 1, 2, 3]`, và `Math.random()` lần lượt trả về `0.3`, `0.6`, `0.9`:

```text
i = 3: j = floor(0.3 × 4) = 1 → đổi arr[3] và arr[1] → [0, 3, 2, 1]
i = 2: j = floor(0.6 × 3) = 1 → đổi arr[2] và arr[1] → [0, 2, 3, 1]
i = 1: j = floor(0.9 × 2) = 1 → đổi arr[1] với chính nó → [0, 2, 3, 1]
Kết quả: [0, 2, 3, 1]
```

## 4. Hàm `arrange`: sắp xếp theo chế độ ([dòng 19-21](../src/hooks/useDeckQueue.ts#L19-L21))

```ts
function arrange(items: number[], mode: DeckOrder): number[] {
  return mode === 'shuffled' ? shuffled(items) : [...items].sort((a, b) => a - b)
}
```

Hàm có một dòng với hai trường hợp:

```ts
arrange([3, 1, 5], 'shuffled')   // Xáo ngẫu nhiên, ví dụ [5, 3, 1]
arrange([3, 1, 5], 'ordered')    // Sắp tăng dần: [1, 3, 5]
```

Có hai chi tiết đáng chú ý ở nhánh sắp xếp:

- **`[...items]`** chép mảng trước, vì `.sort()` sửa trực tiếp vào mảng được gọi.
- **`(a, b) => a - b`** là hàm so sánh để sắp theo số. Nếu thiếu nó, `.sort()` so sánh theo chuỗi, và `[10, 2, 1].sort()` sẽ cho `[1, 10, 2]`.

## 5. Hàm `freshOrder`: tạo thứ tự mới ([dòng 23-28](../src/hooks/useDeckQueue.ts#L23-L28))

```ts
function freshOrder(total: number, mode: DeckOrder): number[] {
  return arrange(
    Array.from({ length: total }, (_, i) => i),
    mode,
  )
}
```

Hàm làm hai bước: tạo một mảng số từ `0` đến `total - 1`, rồi đưa cho `arrange`.

`Array.from({ length: 4 }, (_, i) => i)` tạo ra `[0, 1, 2, 3]`. Trong đó, `{ length: 4 }` nói mảng có 4 phần tử, còn `(_, i) => i` quyết định giá trị của từng phần tử là chính vị trí của nó. Tham số đầu không dùng tới nên được đặt tên là `_`.

```ts
freshOrder(4, 'ordered')    // [0, 1, 2, 3]
freshOrder(4, 'shuffled')   // Xáo ngẫu nhiên, ví dụ [2, 0, 3, 1]
```

## 6. Hàm `loadState`: đọc tiến trình đã lưu ([dòng 30-44](../src/hooks/useDeckQueue.ts#L30-L44))

Hàm trả về tiến trình đã lưu nếu dữ liệu hợp lệ, nếu không thì tạo ván mới.

```ts
function loadState(deckId: string, total: number, defaultMode: DeckOrder): QueueState {
```

Hàm nhận id bộ bài, số câu hỏi và chế độ mặc định. Kết quả luôn là một `QueueState`.

```ts
  try {
```

Mở khối `try`. Nếu có lỗi bên trong, code nhảy tới `catch` thay vì làm hỏng app.

```ts
    const raw = localStorage.getItem(`tam-giao:${deckId}`)
```

Đọc dữ liệu đã lưu theo khóa, ví dụ `tam-giao:ban-moi`. Dấu `` ` `` và `${...}` dùng để ghép chuỗi. Giá trị đọc được là một chuỗi, hoặc `null` nếu chưa lưu bao giờ.

```ts
    if (raw) {
```

Chỉ tiếp tục khi có dữ liệu.

```ts
      const parsed = JSON.parse(raw) as Partial<QueueState>
```

`JSON.parse` chuyển chuỗi thành object, và báo lỗi nếu chuỗi hỏng. `as Partial<QueueState>` nói với TypeScript rằng các trường có thể thiếu. Phần `as` không kiểm tra gì lúc chạy.

```ts
      if (Array.isArray(parsed.order) && parsed.order.length === total && typeof parsed.pointer === 'number') {
```

Ba điều kiện phải cùng đúng: `order` là mảng, độ dài khớp số câu hiện tại, và `pointer` là số.

```ts
        const mode = parsed.mode === 'ordered' || parsed.mode === 'shuffled' ? parsed.mode : defaultMode
```

Nếu `mode` đã lưu hợp lệ thì giữ nguyên, nếu không thì dùng `defaultMode`.

```ts
        return { order: parsed.order, pointer: parsed.pointer, mode }
```

Trả về tiến trình cũ, và hàm kết thúc ở đây. `mode` viết tắt cho `mode: mode`.

```ts
      }
    }
  } catch {
    // ignore corrupt storage
  }
```

Đóng các khối. `catch` bắt lỗi nhưng không làm gì, và comment nói rõ là cố ý bỏ qua dữ liệu hỏng.

```ts
  return { order: freshOrder(total, defaultMode), pointer: -1, mode: defaultMode }
}
```

Nếu code chạy tới đây, tức là không có dữ liệu dùng được, nên hàm tạo một ván mới với `pointer: -1`.

[Bài 09](09-use-deck-queue.md#kết-quả-với-từng-loại-dữ-liệu) có bảng kết quả đã chạy thử với 10 loại dữ liệu.

## 7. Bắt đầu hook ([dòng 46-47](../src/hooks/useDeckQueue.ts#L46-L47))

Từ đây là phần chính. Mọi thứ đến hết file đều nằm trong một hàm.

```ts
export function useDeckQueue(deckId: string, questions: string[], defaultMode: DeckOrder = 'shuffled') {
```

- **`export`** cho phép file khác import hàm này.
- **Tên bắt đầu bằng `use`** cho biết đây là custom hook, tức là một hàm có gọi các hook khác.
- **`defaultMode: DeckOrder = 'shuffled'`** là tham số có giá trị mặc định, dùng khi người gọi truyền `undefined`.

`GameScreen` gọi hook này như sau:

```ts
const queue = useDeckQueue(deck.id, deck.questions, deck.defaultOrder)
```

```ts
  const total = questions.length
```

Số câu hỏi. Đây là biến thường, được tính lại mỗi lần render.

## 8. Hai state ([dòng 48-50](../src/hooks/useDeckQueue.ts#L48-L50))

```ts
  const [state, setState] = useState<QueueState>(() => loadState(deckId, total, defaultMode))
```

Tạo state chứa dữ liệu ván chơi. `useState` trả về một cặp: giá trị hiện tại và hàm để đổi giá trị. `<QueueState>` khai báo kiểu của giá trị.

Tham số là một hàm `() => loadState(...)` chứ không phải kết quả của `loadState(...)`. Nhờ vậy, React chỉ gọi nó lúc mount chứ không gọi ở mọi lần render. Kỹ thuật này gọi là khởi tạo lười.

```ts
  // Counts draw/reset/goBack, which may leave the current question unchanged. setMode is excluded.
  const [actionCount, setActionCount] = useState(0)
```

Tạo một bộ đếm, bắt đầu từ 0. Comment giải thích rằng nó đếm `draw`, `reset`, `goBack`, những hành động có thể không làm đổi câu hỏi hiện tại, và không đếm `setMode`. `GameScreen` dùng bộ đếm này làm tín hiệu "hành động đã xong".

## 9. Effect nạp dữ liệu ([dòng 52-55](../src/hooks/useDeckQueue.ts#L52-L55))

```ts
  useEffect(() => {
    setState(loadState(deckId, total, defaultMode))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId])
```

`useEffect` nhận hai thứ: một hàm cần chạy, và một mảng dependency cho biết khi nào chạy lại. Ở đây, hàm chạy khi component mount và khi `deckId` đổi.

Dòng `eslint-disable` là ghi chú rằng mảng dependency được cố ý viết thiếu `total` và `defaultMode`.

Trong app hiện tại, `deckId` không đổi trong suốt đời của một `GameScreen`, vì đổi bộ bài thì `GameScreen` được tạo lại. Nên thực tế effect này chỉ chạy khi mount, và đọc lại dữ liệu mà `useState` vừa đọc. [Bài 09](09-use-deck-queue.md#effect-nạp-dữ-liệu) có phần thử xóa effect này.

## 10. Effect lưu dữ liệu ([dòng 57-63](../src/hooks/useDeckQueue.ts#L57-L63))

```ts
  useEffect(() => {
    try {
      localStorage.setItem(`tam-giao:${deckId}`, JSON.stringify(state))
    } catch {
      // ignore storage quota errors
    }
  }, [deckId, state])
```

Mỗi khi `state` đổi, effect này chạy và ghi tiến trình xuống trình duyệt.

- **`JSON.stringify(state)`** biến object thành chuỗi, vì `localStorage` chỉ lưu được chuỗi.
- **`try/catch`** bỏ qua lỗi không ghi được, ví dụ bộ nhớ đầy. Comment có nhắc tới "quota", tức là giới hạn dung lượng.

Giá trị được lưu trông như sau:

```json
{"order":[2,0,3,1],"pointer":1,"mode":"shuffled"}
```

Nhờ effect này, các hành động bên dưới không cần tự gọi lệnh lưu.

## 11. Biến `justReshuffled` ([dòng 65](../src/hooks/useDeckQueue.ts#L65))

```ts
  const justReshuffled = state.pointer === -1
```

Giá trị này là `true` khi chưa rút lá nào. Tên của nó dễ gây hiểu nhầm, và `GameScreen` hiện không dùng tới.

## 12. Hành động `draw`: rút lá tiếp theo ([dòng 67-76](../src/hooks/useDeckQueue.ts#L67-L76))

```ts
  const draw = useCallback(() => {
```

`useCallback` giữ cho `draw` là cùng một hàm qua các lần render, cho đến khi dependency đổi.

```ts
    setState((prev) => {
```

Truyền vào `setState` một hàm, gọi là updater function. React đưa state mới nhất vào tham số `prev`, và giá trị hàm trả về sẽ là state mới.

```ts
      const nextPointer = prev.pointer + 1
```

Tính vị trí tiếp theo.

```ts
      if (nextPointer >= total) {
        return { ...prev, order: freshOrder(total, prev.mode), pointer: 0 }
      }
```

Nếu đã hết bài, tạo thứ tự mới và đưa con trỏ về `0`. `...prev` chép tất cả các trường của `prev` sang object mới, rồi `order` và `pointer` ghi đè lên.

```ts
      return { ...prev, pointer: nextPointer }
    })
```

Nếu còn bài, chỉ đổi `pointer`. Phải tạo một object mới thay vì sửa `prev`, vì React so sánh theo tham chiếu để biết state có đổi không.

```ts
    setActionCount((count) => count + 1)
  }, [total])
```

Tăng bộ đếm. Mảng `[total]` khai báo rằng hàm có dùng `total`. React gom hai lần cập nhật này thành một lần render.

Ví dụ với bộ bài 4 câu:

```text
pointer = -1 → nextPointer = 0 → còn bài → pointer = 0
pointer =  2 → nextPointer = 3 → còn bài → pointer = 3
pointer =  3 → nextPointer = 4 → 4 >= 4, hết bài → order mới, pointer = 0
```

## 13. Hành động `reset`: chơi lại ([dòng 78-81](../src/hooks/useDeckQueue.ts#L78-L81))

```ts
  const reset = useCallback(() => {
    setState((prev) => ({ ...prev, order: freshOrder(total, prev.mode), pointer: -1 }))
    setActionCount((count) => count + 1)
  }, [total])
```

Tạo thứ tự mới và đưa `pointer` về `-1`, trong khi `mode` được giữ nhờ `...prev`.

Cặp ngoặc `({ ... })` là bắt buộc. Nếu chỉ viết `=> { ... }`, JavaScript hiểu `{` là mở thân hàm chứ không phải một object.

## 14. Hành động `goBack`: xem lại lá trước ([dòng 83-86](../src/hooks/useDeckQueue.ts#L83-L86))

```ts
  const goBack = useCallback(() => {
    setState((prev) => (prev.pointer > 0 ? { ...prev, pointer: prev.pointer - 1 } : prev))
    setActionCount((count) => count + 1)
  }, [])
```

Nếu `pointer` lớn hơn 0 thì giảm đi 1, nếu không thì trả về chính `prev`, tức là không đổi gì. `order` không bị đụng tới, nên không mất lịch sử.

`actionCount` vẫn tăng trong mọi trường hợp. Mảng `[]` rỗng vì hàm không dùng giá trị nào từ component ngoài `prev`.

## 15. Hành động `setMode`: đổi chế độ ([dòng 88-96](../src/hooks/useDeckQueue.ts#L88-L96))

```ts
  // Keep the cards already drawn; only rearrange the ones not yet drawn.
  const setMode = useCallback((mode: DeckOrder) => {
```

Comment nói rõ ý tưởng: giữ các lá đã rút, chỉ sắp lại các lá chưa rút. Hàm nhận chế độ mới qua tham số `mode`.

```ts
    setState((prev) => {
      if (prev.mode === mode) return prev
```

Nếu đang ở đúng chế độ đó thì không làm gì.

```ts
      const drawn = prev.order.slice(0, prev.pointer + 1)
      const remaining = prev.order.slice(prev.pointer + 1)
```

Chia `order` thành hai phần. `slice(a, b)` lấy từ vị trí `a` đến trước vị trí `b`, và `slice(a)` lấy từ `a` đến hết. Phần tử tại `pointer` thuộc về phần đã rút, nên phải cộng thêm 1.

```ts
      return { ...prev, mode, order: [...drawn, ...arrange(remaining, mode)] }
    })
  }, [])
```

Tạo state mới với chế độ mới và thứ tự mới. `[...a, ...b]` nối hai mảng lại. `pointer` không đổi, nên lá đang xem vẫn giữ nguyên.

Ví dụ với `order = [2, 0, 3, 1]`, `pointer = 1`, chuyển sang `'ordered'`:

```text
drawn     = [2, 0]
remaining = [3, 1]
arrange   → [1, 3]
order mới = [2, 0, 1, 3]
```

Hàm này không tăng `actionCount`, vì câu hiện tại không đổi.

## 16. Các giá trị suy ra ([dòng 98-100](../src/hooks/useDeckQueue.ts#L98-L100))

Ba dòng này chạy ở mỗi lần render. Chúng tính kết quả từ state, chứ không lưu thành state riêng.

```ts
  const currentIndex = state.pointer >= 0 ? state.order[state.pointer] : null
```

Vị trí của câu hỏi hiện tại trong `questions`, hoặc `null` nếu chưa rút lá nào.

```ts
  const currentQuestion = currentIndex !== null ? questions[currentIndex] : null
```

Nội dung câu hỏi hiện tại. Phải viết `!== null`, vì nếu chỉ viết `currentIndex ? ...`, vị trí `0` sẽ bị xem là sai và câu hỏi đầu tiên không bao giờ hiện ra.

```ts
  const drawnCount = state.pointer >= 0 ? state.pointer + 1 : 0
```

Số lá đã rút. Cộng 1 vì vị trí được đếm từ 0.

Ví dụ với `questions = ['A', 'B', 'C', 'D']` và `order = [2, 0, 3, 1]`:

| `pointer` | `currentIndex` | `currentQuestion` | `drawnCount` |
|---|---|---|---|
| -1 | `null` | `null` | 0 |
| 0 | 2 | C | 1 |
| 1 | 0 | A | 2 |
| 3 | 1 | B | 4 |

## 17. Giá trị trả về ([dòng 102-115](../src/hooks/useDeckQueue.ts#L102-L115))

```ts
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
```

Đây là những gì `GameScreen` nhận được khi gọi hook. `currentQuestion,` là cách viết tắt của `currentQuestion: currentQuestion`.

| Giá trị | Ý nghĩa | `GameScreen` có dùng? |
|---|---|---|
| `currentQuestion` | Nội dung câu hiện tại, hoặc `null` | Có |
| `actionCount` | Số hành động đã thực hiện | Có |
| `drawnCount` | Số lá đã rút | Có |
| `total` | Tổng số câu | Có |
| `draw`, `reset`, `goBack`, `setMode` | Các hành động | Có |
| `mode` | Chế độ hiện tại | Có |
| `canGoBack` | Có thể xem lại không | Có |
| `justReshuffled` | Chưa rút lá nào | Không |
| `isExhausted` | Đang ở lá cuối | Không |

Dấu `}` cuối cùng đóng hàm `useDeckQueue`, và cũng là dòng cuối của file.

`GameScreen` dùng kết quả như sau:

```tsx
queue.draw()                 // Rút lá tiếp theo
queue.currentQuestion        // Đọc câu hiện tại
queue.canGoBack              // Có bật nút xem lại không
```

## Toàn bộ quá trình khi rút một lá

```text
1. GameScreen gọi queue.draw()
2. draw gọi setState và setActionCount
3. React gọi lại GameScreen, và useDeckQueue chạy lại từ đầu
4. useState trả về state mới, ví dụ pointer từ 1 thành 2
5. currentIndex, currentQuestion, drawnCount được tính lại
6. Hook trả về object mới cho GameScreen
7. Giao diện được cập nhật
8. Effect lưu thấy state đã đổi, nên ghi vào localStorage
```

Ở bước 3, `useState` không chạy lại `loadState`, vì khởi tạo lười chỉ có tác dụng lúc mount.

## Tự kiểm tra

<details>
<summary>1. Vì sao <code>shuffled</code> phải chép mảng bằng <code>[...items]</code>?</summary>

Để không sửa mảng được truyền vào. Hàm trả về một mảng mới và giữ nguyên mảng gốc.
</details>

<details>
<summary>2. Với <code>order = [3, 1, 0, 2]</code> và <code>pointer = 2</code>, câu hiện tại nằm ở vị trí nào trong <code>questions</code>? Đã rút bao nhiêu lá?</summary>

`order[2]` là `0`, nên câu hiện tại là `questions[0]`. `drawnCount` là `pointer + 1`, tức là đã rút 3 lá.
</details>

<details>
<summary>3. Với bộ bài 4 câu, <code>draw()</code> khi <code>pointer = 3</code> cho kết quả gì?</summary>

`nextPointer` là 4, và `4 >= 4` nên đã hết bài. Hook tạo `order` mới theo chế độ hiện tại và đặt `pointer = 0`.
</details>

<details>
<summary>4. Vì sao <code>setMode</code> dùng <code>slice(0, pointer + 1)</code> mà không phải <code>slice(0, pointer)</code>?</summary>

Vì lá tại vị trí `pointer` là lá đang xem, nên thuộc phần đã rút. `slice` không lấy phần tử ở vị trí kết thúc, nên phải cộng thêm 1.
</details>

<details>
<summary>5. Điều gì xảy ra nếu viết <code>currentIndex ? questions[currentIndex] : null</code>?</summary>

Khi `currentIndex` là `0`, JavaScript xem đó là sai, nên kết quả là `null`. Câu hỏi đầu tiên trong mảng sẽ không bao giờ hiện ra, và app coi như chưa rút lá nào.
</details>

---

**Bài tiếp theo:** [09. useDeckQueue: lý do thiết kế](09-use-deck-queue.md)
