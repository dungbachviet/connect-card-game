# 09. `useDeckQueue`: bộ não của trò chơi

**File trong bài:** [src/hooks/useDeckQueue.ts](../src/hooks/useDeckQueue.ts)

**Sau bài này, bạn sẽ hiểu:** cách mô hình hóa trạng thái, cách cập nhật state bất biến, `useEffect`, `useCallback`, và custom hook là gì.

File này không có một dòng JSX nào: đây là logic thuần túy. Hãy đọc thật chậm, vì đây là nơi tập trung nhiều kiến thức React nhất.

## 1. Mô hình dữ liệu: mảng thứ tự và con trỏ

Bài toán là rút bài không lặp, xem lại được lá trước, và tải lại trang vẫn chơi tiếp được. Cách làm ai cũng nghĩ tới đầu tiên là xóa lá đã rút khỏi mảng, nhưng cách đó mất lịch sử nên không xem lại được.

Dự án dùng một mô hình tốt hơn. State chỉ gồm ba trường ([dòng 4-8](../src/hooks/useDeckQueue.ts#L4-L8)):

```ts
interface QueueState {
  order: number[]    // Thứ tự rút. Mỗi số là vị trí của câu hỏi trong questions
  pointer: number    // Đang ở đâu trong order. -1 nghĩa là chưa rút lá nào
  mode: DeckOrder    // 'ordered' hoặc 'shuffled'
}
```

Ví dụ với bộ bài 4 câu:

```text
questions = ['A', 'B', 'C', 'D']
order     = [ 2,   0,   3,   1 ]
pointer   =        ^ (bằng 1)

Câu hiện tại = questions[order[pointer]] = questions[0] = 'A'
Đã rút        = C, A           ← phần trước và tại con trỏ
Chưa rút      = D, B           ← phần sau con trỏ
```

Chỉ với một mảng và một con số, ta có được những gì cần:

| Yêu cầu | Được đáp ứng thế nào |
|---|---|
| Không lặp lại | Mỗi vị trí chỉ xuất hiện một lần trong `order` |
| Xem lại lá trước | Giảm `pointer`, dữ liệu vẫn còn nguyên |
| Lưu và khôi phục | `JSON.stringify` một object nhỏ |
| Đổi chế độ giữa chừng | Chỉ sắp xếp lại phần sau con trỏ |

Một cấu trúc dữ liệu tốt làm cho code trở nên đơn giản. Hầu hết các hành động dưới đây chỉ dài vài dòng là nhờ mô hình này.

Hãy để ý rằng `questions` **không có trong state**, vì nó đến từ props và không bao giờ đổi. State chỉ lưu những gì thực sự thay đổi.

## 2. Các hàm thuần ở đầu file

Bốn hàm đầu file nằm **ngoài** hook. Chúng không cần gì từ React, không phụ thuộc vào render, và không bị tạo lại mỗi lần render.

### `shuffled`: thuật toán Fisher–Yates

```ts
function shuffled(items: number[]): number[] {
  const arr = [...items]                         // Sao chép, không sửa mảng gốc
  for (let i = arr.length - 1; i > 0; i--) {     // Đi từ cuối về đầu
    const j = Math.floor(Math.random() * (i + 1))   // Chọn ngẫu nhiên một vị trí từ 0 đến i
    ;[arr[i], arr[j]] = [arr[j], arr[i]]            // Đổi chỗ
  }
  return arr
}
```

Cách nghĩ giống hệt khi bạn bốc từng lá: chọn ngẫu nhiên một lá trong phần chưa xếp, đặt nó vào cuối, rồi lặp lại với phần còn lại.

```text
[A B C D]   i=3, j=1 → đổi D và B → [A D C | B]   B đã cố định
[A D C|B]   i=2, j=0 → đổi C và A → [C D | A B]   A đã cố định
[C D|A B]   i=1, j=1 → không đổi  → [C | D A B]
```

Thuật toán này đảm bảo mọi hoán vị có xác suất bằng nhau. Cách viết `.sort(() => Math.random() - 0.5)` mà bạn có thể thấy trên mạng thì **không** có đảm bảo đó.

Hai chi tiết cú pháp:

- **`[...items]`** là spread: tạo một mảng mới chứa các phần tử cũ.
- **`;[arr[i], arr[j]] = ...`** có dấu `;` ở đầu vì dự án viết không có dấu chấm phẩy. Nếu thiếu, JavaScript sẽ hiểu `[` là nối tiếp dòng trên.

### `arrange` và `freshOrder`

```ts
function arrange(items: number[], mode: DeckOrder): number[] {
  return mode === 'shuffled' ? shuffled(items) : [...items].sort((a, b) => a - b)
}

function freshOrder(total: number, mode: DeckOrder): number[] {
  return arrange(Array.from({ length: total }, (_, i) => i), mode)
}
```

- `Array.from({ length: 4 }, (_, i) => i)` tạo ra `[0, 1, 2, 3]`. `_` là quy ước cho tham số không dùng tới.
- `.sort((a, b) => a - b)` bắt buộc phải có hàm so sánh. Mặc định `sort` so sánh theo chuỗi, nên `10` sẽ đứng trước `2`.
- `.sort` sửa trực tiếp mảng, nên phải dùng `[...items]` để sao chép trước.

### `loadState`: đọc dữ liệu như đọc từ người lạ

```ts
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
```

Dữ liệu trong `localStorage` có thể đã cũ, bị sửa tay, hay bị hỏng. TypeScript không giúp được gì lúc chạy, nên hàm này tự phòng thủ qua nhiều lớp:

| Lớp bảo vệ | Trường hợp xử lý |
|---|---|
| `try/catch` | `JSON.parse` gặp chuỗi hỏng, hoặc trình duyệt chặn truy cập `localStorage` |
| `as Partial<QueueState>` | Nói thật với TypeScript rằng các trường có thể thiếu |
| `Array.isArray(parsed.order)` | `order` không phải mảng |
| `parsed.order.length === total` | Số câu của bộ bài đã đổi so với lúc lưu |
| `typeof parsed.pointer === 'number'` | `pointer` sai kiểu |
| Kiểm tra `parsed.mode` | Dữ liệu cũ, từ trước khi có tính năng đổi chế độ |
| Dòng `return` cuối | Mọi trường hợp còn lại: bắt đầu mới |

Kiểm tra `mode` là một dấu tích lịch sử: theo git, tính năng này được thêm sau, nên bản lưu của người dùng cũ không có trường đó. Khi đổi định dạng dữ liệu đã lưu, bạn phải luôn nghĩ tới dữ liệu cũ.

Lưu ý rằng hàm chỉ kiểm tra kiểu của `pointer` chứ không kiểm tra khoảng giá trị. Nếu ai đó sửa tay `pointer` thành `999`, `currentQuestion` sẽ là `undefined`. Với một app chạy trên máy cá nhân thì đây là mức phòng thủ chấp nhận được.

## 3. Bắt đầu hook: khởi tạo lười

```ts
export function useDeckQueue(deckId: string, questions: string[], defaultMode: DeckOrder = 'shuffled') {
  const total = questions.length
  const [state, setState] = useState<QueueState>(() => loadState(deckId, total, defaultMode))
```

Hãy so sánh hai cách viết:

```ts
useState(loadState(deckId, total, defaultMode))        // Chạy loadState ở MỖI lần render, rồi bỏ kết quả
useState(() => loadState(deckId, total, defaultMode))  // Chỉ chạy khi mount
```

Giá trị khởi tạo chỉ được dùng ở lần đầu. Cách viết đầu vẫn đọc `localStorage`, parse JSON và xáo bài ở mọi lần render, chỉ để vứt đi. Khi truyền một hàm, React chỉ gọi nó một lần. Kỹ thuật này gọi là **lazy initialization**, và nên dùng khi việc khởi tạo tốn công.

## 4. Hai `useEffect`

`useEffect` dùng để **đồng bộ React với một hệ thống bên ngoài**, trong trường hợp này là `localStorage`. Phần render phải thuần túy, nên các tác dụng phụ như đọc ghi bộ nhớ, gọi mạng hay hẹn giờ được đặt trong effect. Effect chạy **sau khi** React đã cập nhật DOM.

```ts
useEffect(() => {
  // Việc cần làm
}, [a, b])   // Chạy lại khi a hoặc b đổi so với lần trước
```

| Mảng dependency | Khi nào chạy |
|---|---|
| `[a, b]` | Khi mount, và khi `a` hoặc `b` đổi |
| `[]` | Chỉ khi mount |
| Không có mảng | Sau mọi lần render |

### Effect lưu dữ liệu

```ts
useEffect(() => {
  try {
    localStorage.setItem(`tam-giao:${deckId}`, JSON.stringify(state))
  } catch {
    // ignore storage quota errors
  }
}, [deckId, state])
```

Effect này có nghĩa là "mỗi khi `state` đổi, hãy ghi nó xuống". Hãy để ý cách nó đơn giản hóa phần còn lại: `draw`, `goBack`, `reset`, `setMode` không cần nhớ phải lưu, vì chỉ cần đổi state là tự có lưu.

Nó cũng chạy khi mount, nên chỉ cần **mở** một bộ bài là đã có dữ liệu được ghi. Tôi đã kiểm chứng: vừa vào bộ "Bạn Mới", `localStorage` đã có `pointer: -1`, `mode: 'shuffled'` và `order` đủ 60 phần tử.

### Effect nạp dữ liệu

```ts
useEffect(() => {
  setState(loadState(deckId, total, defaultMode))
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [deckId])
```

Ý định của effect này là nạp lại khi `deckId` đổi. Nhưng trong app hiện tại, **`deckId` không bao giờ đổi** trong suốt đời của một `GameScreen`, vì muốn đổi bộ bài thì `GameScreen` phải unmount, như đã phân tích ở [bài 05](05-tu-duy-react-qua-app.md#7-key-danh-tính-của-một-component). Do đó effect chỉ chạy một lần khi mount, ngay sau khi `useState` vừa nạp cùng dữ liệu đó.

Tôi đã thử xóa nó rồi kiểm tra: rút thẻ ở bộ "Bạn Mới", chuyển sang "Tình Bạn" (bắt đầu mới, đúng), rồi quay về "Bạn Mới" (giữ "Câu 1 / 60", đúng). App vẫn chạy đúng. Vậy đây là code phòng thủ: nó sẽ có ích nếu hook được dùng ở một nơi mà `deckId` thực sự đổi mà không cần mount lại, nhưng hiện tại nó không có tác dụng thực tế.

Có một cách rút ra từ phân tích này: **`key` thường là cách reset state gọn hơn effect.** Thay vì viết effect để theo dõi prop đổi, hãy cho component một `key` theo prop đó, và React sẽ tự tạo lại.

## 5. Các hành động và updater function

### Bất biến: không sửa, chỉ thay thế

React biết state đổi bằng cách so sánh tham chiếu: "đây có phải vẫn là object cũ không?". Nếu sửa trực tiếp, tham chiếu không đổi, và React không thấy gì:

```ts
// ❌ Sai
state.pointer = state.pointer + 1
setState(state)        // Vẫn là object cũ → React coi như không đổi

// ✅ Đúng
setState({ ...state, pointer: state.pointer + 1 })   // Object mới
```

`{ ...prev, pointer: x }` là object spread: chép tất cả các trường của `prev`, rồi ghi đè `pointer`.

### Updater function

Dự án luôn viết `setState((prev) => ...)` thay vì `setState(giá_trị)`. Hàm này nhận state **mới nhất** từ React, chứ không phải giá trị trong bức ảnh chụp của lần render hiện tại:

```ts
// Giả sử count đang là 0, và cả hai dòng chạy trong cùng một lần xử lý sự kiện:

setCount(count + 1)   // → 1
setCount(count + 1)   // → vẫn là 1, vì count trong bức ảnh này là 0

setCount((c) => c + 1)   // → 1
setCount((c) => c + 1)   // → 2, vì nhận kết quả của lệnh trước
```

Hãy nhớ quy tắc: **khi giá trị mới phụ thuộc vào giá trị cũ, hãy dùng updater function.** Nhờ vậy, `draw` cũng không cần phụ thuộc vào `state`, và giữ được ổn định qua các lần render.

### `draw`: rút lá tiếp theo

```ts
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
```

Khi đã rút hết, `draw` không dừng lại mà tạo thứ tự mới và tiếp tục từ đầu. Tôi đã kiểm chứng với bộ 25 lá: lá 25 hiện "Câu 25 / 25", lần rút sau hiện "Câu 1 / 25" và `pointer` về `0`.

Có một lỗi tiềm ẩn: thứ tự xáo mới có thể đặt ngay lá vừa rút ở đầu, với xác suất 1/n, nên người chơi có thể gặp cùng một câu hai lần liên tiếp khi chuyển vòng. Bạn có thể xử lý trong một bài tập ở cuối.

Trong `StrictMode`, updater bị gọi hai lần ở chế độ dev, mà nhánh này lại có `Math.random`. Về nguyên tắc, updater phải thuần túy. Ở đây không có hậu quả gì vì chỉ một kết quả được dùng, và hai kết quả đều hợp lệ.

### `reset`, `goBack`

```ts
const reset = useCallback(() => {
  setState((prev) => ({ ...prev, order: freshOrder(total, prev.mode), pointer: -1 }))
  setActionCount((count) => count + 1)
}, [total])

const goBack = useCallback(() => {
  setState((prev) => (prev.pointer > 0 ? { ...prev, pointer: prev.pointer - 1 } : prev))
  setActionCount((count) => count + 1)
}, [])
```

Trong `goBack`, khi đang ở lá đầu, hàm trả về chính `prev`, nên `state` được giữ nguyên. Nhưng `actionCount` vẫn tăng, nên vẫn có một lần render. Bài sau sẽ giải thích vì sao điều này quan trọng.

Cặp ngoặc `(...)` quanh `{...}` trong `reset` là bắt buộc. Nếu thiếu, JavaScript sẽ hiểu `{` là mở thân hàm chứ không phải object.

### `setMode`: giữ quá khứ, sắp lại tương lai

```ts
const setMode = useCallback((mode: DeckOrder) => {
  setState((prev) => {
    if (prev.mode === mode) return prev
    const drawn = prev.order.slice(0, prev.pointer + 1)
    const remaining = prev.order.slice(prev.pointer + 1)
    return { ...prev, mode, order: [...drawn, ...arrange(remaining, mode)] }
  })
}, [])
```

Đây là kết quả thật khi tôi rút 3 lá của bộ "Từ Yêu Tới Roommate" theo thứ tự rồi chuyển sang "Xáo trộn":

```text
Trước:  [0, 1, 2, 3, 4, 5, 6, 7, ...]
                ^ pointer = 2
Sau:    [0, 1, 2, 11, 19, 10, 5, 24, ...]
         └─────┘  └──────────────────┘
         giữ nguyên     xáo lại
```

Ở trường hợp ngược lại, `arrange` sắp xếp phần còn lại tăng dần, nhưng phần đã rút vẫn giữ nguyên. Vì thế danh sách không phải lúc nào cũng trở về `0, 1, 2...`, và điều này hợp lý vì các lá đã rút rồi không nên xuất hiện lại.

Trường hợp `pointer = -1` cũng hoạt động đúng mà không cần code riêng: `slice(0, 0)` cho mảng rỗng, và `slice(0)` lấy toàn bộ.

### Sơ đồ trạng thái

```text
                    draw                     draw
  ┌─────────┐    pointer=0    ┌─────────┐  pointer+1  ┌──────────┐
  │ Chưa rút│ ──────────────► │ Đang rút│ ──────────► │ Lá cuối  │
  │ ptr = -1│                 │ ptr ≥ 0 │ ◄────────── │ptr=total-1│
  └─────────┘                 └─────────┘   goBack    └──────────┘
       ▲                          │                       │
       │        reset             │                       │ draw:
       └──────────────────────────┘                       │ thứ tự mới
                                                          ▼
                                                   Lại đến ptr = 0
```

## 6. `useCallback` để làm gì

Mỗi lần render, các hàm khai báo trong component được tạo mới. `useCallback` trả về **cùng một hàm** qua các lần render, cho đến khi dependency đổi:

```ts
const draw = useCallback(() => { ... }, [total])
//    Luôn là cùng một hàm, trừ khi total đổi
```

Mảng dependency cần chứa những giá trị từ component mà hàm dùng tới. `draw` dùng `total` nên có `[total]`. `goBack` không dùng gì ngoài `prev` nên có `[]`. Các hàm `setState` luôn ổn định nên không cần khai báo.

**Trong dự án này, nó có cần thiết không?** Thành thật mà nói là không hẳn. `useCallback` có ích khi hàm được truyền cho một component bọc `memo` hoặc nằm trong dependency của một effect. Ở đây không có trường hợp nào như vậy: `GameScreen` chỉ gọi các hàm này trong event handler. Nếu bỏ `useCallback`, hành vi không đổi.

Tuy nhiên, việc giữ các hàm ổn định là thói quen hợp lý cho custom hook, vì hook không biết người dùng nó sẽ làm gì với các hàm đó. Bạn cũng đừng vội cho rằng cứ bọc `useCallback` là app sẽ nhanh hơn: hàm vẫn được tạo mỗi lần render, chỉ là React trả về bản cũ.

## 7. Giá trị suy ra và đầu ra của hook

```ts
const currentIndex = state.pointer >= 0 ? state.order[state.pointer] : null
const currentQuestion = currentIndex !== null ? questions[currentIndex] : null
const drawnCount = state.pointer >= 0 ? state.pointer + 1 : 0
```

Đây là nguyên tắc ở [bài 05](05-tu-duy-react-qua-app.md#5-chỉ-lưu-những-gì-không-tính-được) được áp dụng: `currentQuestion` và `drawnCount` được tính từ state, không lưu riêng.

Dòng so sánh `currentIndex !== null` phải viết đầy đủ thay vì `currentIndex ? ... : ...`. Lý do là vị trí `0` là một vị trí hợp lệ nhưng lại được JavaScript xem là sai. Nếu viết tắt, câu hỏi đầu tiên sẽ không bao giờ hiện ra.

Hook trả về một object, đóng vai trò API công khai của nó:

| Giá trị trả về | `GameScreen` có dùng? | Ghi chú |
|---|---|---|
| `currentQuestion`, `drawnCount`, `total` | Có | Hiển thị |
| `draw`, `reset`, `goBack`, `setMode` | Có | Hành động |
| `mode`, `canGoBack` | Có | Điều khiển nút |
| `actionCount` | Có | Tín hiệu cho effect, xem bài sau |
| `justReshuffled` | **Không** | Tên gây hiểu nhầm: thực chất có nghĩa là "chưa rút lá nào" (`pointer === -1`) |
| `isExhausted` | **Không** | Là `true` khi đang ở lá cuối, không phải sau khi hết |

Hai giá trị cuối là code thừa. TypeScript không báo lỗi vì chúng là thuộc tính của object chứ không phải biến cục bộ.

## 8. Hook này dạy gì về custom hook

Custom hook là một hàm bình thường có tên bắt đầu bằng `use` và có gọi các hook khác. Có ba điều cần hiểu đúng:

**Thứ nhất, nó dùng để tách logic, không phải chia sẻ dữ liệu.** Nếu hai component cùng gọi `useDeckQueue`, mỗi component có một bản state riêng. Hook chia sẻ **cách làm**, không phải **dữ liệu**.

**Thứ hai, state trong hook thuộc về component gọi nó.** Khi `GameScreen` gọi `useDeckQueue`, mọi `useState` bên trong hoạt động như thể được viết trực tiếp trong `GameScreen`. Khi state trong hook đổi, `GameScreen` render lại.

**Thứ ba, ích lợi của nó là một ranh giới rõ ràng:**

```text
GameScreen hỏi:  "Câu hiện tại là gì? Rút lá tiếp đi."
useDeckQueue lo: mảng, con trỏ, xáo bài, localStorage, khôi phục, đổi chế độ
```

Nếu viết tất cả những thứ đó ngay trong `GameScreen`, file đó sẽ dài thêm khoảng 100 dòng và trộn lẫn hai mối quan tâm khác nhau.

## Thử ngay

1. Mở **DevTools → Application → Local Storage**. Rút vài lá và quan sát `pointer` tăng. Bấm "Xem lại lá trước" để thấy nó giảm, và `order` không đổi.
2. Trong tab Application, sửa `pointer` thành một số khác rồi tải lại trang. Bạn vừa tua tiến trình bằng tay.
3. Sửa giá trị thành `abc` rồi tải lại. App vẫn chạy và bắt đầu mới, nhờ `try/catch`.
4. Trong [dòng 20](../src/hooks/useDeckQueue.ts#L20), bỏ `(a, b) => a - b`. Ở chế độ "Theo thứ tự" với bộ có từ 10 câu trở lên, thứ tự sẽ bị sai sau khi đổi chế độ, kiểu `0, 1, 10, 11, ..., 2`.
5. Trong [dòng 99](../src/hooks/useDeckQueue.ts#L99), đổi `currentIndex !== null` thành `currentIndex`. Với bộ "Từ Yêu Tới Roommate", lá đầu tiên ở vị trí `0` sẽ bị coi như chưa rút, và thẻ không lật lên.

## Tự kiểm tra

<details>
<summary>1. Vì sao không lưu <code>currentQuestion</code> vào state?</summary>

Vì nó tính được từ `order`, `pointer` và `questions`. Lưu riêng sẽ tạo ra một bản sao phải giữ đồng bộ, gây nguy cơ lệch nhau.
</details>

<details>
<summary>2. <code>useState(() => loadState(...))</code> khác gì <code>useState(loadState(...))</code>?</summary>

Cách đầu chỉ chạy `loadState` khi mount. Cách sau chạy nó ở mọi lần render rồi bỏ kết quả, đọc `localStorage` và xáo bài một cách lãng phí. Kết quả cuối thì giống nhau.
</details>

<details>
<summary>3. Hai component gọi <code>useDeckQueue('ban-moi', ...)</code> có dùng chung state không?</summary>

Không. Mỗi lần gọi có state riêng trong bộ nhớ React. Chúng chỉ cùng đọc và ghi một khóa `localStorage`, nên có thể ghi đè nhau, nhưng không tự đồng bộ giao diện với nhau.
</details>

<details>
<summary>4. Tại sao <code>draw</code> không cần <code>state</code> trong mảng dependency của <code>useCallback</code>?</summary>

Vì nó nhận state mới nhất qua tham số `prev` của updater function, chứ không đọc biến `state` từ bên ngoài.
</details>

<details>
<summary>5. Vì sao phải viết <code>{ ...prev, pointer: x }</code> chứ không gán <code>prev.pointer = x</code>?</summary>

Vì React so sánh theo tham chiếu. Sửa trực tiếp giữ nguyên tham chiếu, nên React có thể không render lại. Ngoài ra, phần render khác cũng đang dùng object đó như một bức ảnh chụp cố định.
</details>

---

**Bài tiếp theo:** [10. GameScreen](10-game-screen.md)
