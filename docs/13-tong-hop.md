# 13. Tổng hợp: nhìn lại cả dự án

**Sau bài này, bạn sẽ:** ghép mọi kiến thức lại thành một bức tranh, nhìn ra điểm yếu của dự án, và tự kiểm tra xem mình đã thật sự nắm được hay chưa.

## 1. Theo dấu một cú click qua mọi lớp

Hãy theo một tình huống cụ thể: bạn đang ở bộ "Bạn Mới", câu 1, thẻ đang ngửa, và bạn bấm "Rút thẻ tiếp theo". Đây là tất cả những gì xảy ra:

```text
TRÌNH DUYỆT
│ Sự kiện click, React gọi onClick của nút
▼
GameScreen.handleDraw()
├─ pending.current = true                 Khóa, có hiệu lực ngay
├─ playFlipSound()
│   └─ useCardSound.play() → muted? không → getAudioContext()
│      → playFlipTone(ctx): dựng đồ thị âm thanh, phát "whoosh + chime"
├─ setRevealed(false)                     Xếp lịch render
└─ setTimeout(..., 340)                   Hẹn giờ
▼
RENDER 1 của GameScreen (revealed = false)
│ PlayingCard nhận revealed = false
▼
COMMIT → Motion thấy animate đổi, xoay thẻ từ 180° về 0°
│ Khoảng 85ms sau, thẻ qua mốc 90°: câu cũ đã bị che
▼
340ms: hàm hẹn giờ chạy
├─ playFlipSound()                        Tiếng thứ hai
└─ queue.draw()
    ├─ setState(prev => pointer + 1)      Updater nhận state mới nhất
    └─ setActionCount(n => n + 1)
▼
RENDER 2 (gom hai lần set thành một)
│ currentQuestion = câu mới; displayed vẫn là câu cũ
│ Thanh tiến trình nhận width mới; dòng trạng thái có key mới
▼
COMMIT → hai effect chạy, theo thứ tự khai báo:
├─ useDeckQueue: state đổi → ghi localStorage
└─ GameScreen: actionCount đổi → pending = false,
                                 setDisplayed(câu mới), setRevealed(true)
▼
RENDER 3 (revealed = true, displayed = câu mới)
│ PlayingCard: in câu mới lên mặt sau đang ẩn
▼
COMMIT → Motion xoay thẻ về 180° → câu mới hiện ra
```

Nếu bạn đọc được sơ đồ này mà hiểu từng dòng, bạn đã nắm được phần cốt lõi của dự án.

## 2. Bản đồ kiến trúc

### Ai giữ dữ liệu gì

| Dữ liệu | Nơi giữ | Loại | Tồn tại đến khi nào |
|---|---|---|---|
| Nội dung câu hỏi | `decks.ts` | Hằng số | Đến khi có bản build mới |
| Bật tắt Halloween | `halloween.ts` | Hằng số | Đến khi có bản build mới |
| Bộ bài đang chọn | `App` | State | Đến khi tải lại trang |
| Thứ tự, con trỏ, chế độ | `useDeckQueue` | State **và** `localStorage` | Lâu dài, đến khi xóa dữ liệu trình duyệt |
| Bộ đếm hành động | `useDeckQueue` | State | Đến khi unmount `GameScreen` |
| Thẻ đang ngửa, câu đang in | `GameScreen` | State | Đến khi unmount `GameScreen` |
| Đang bận lật thẻ | `GameScreen` | Ref | Đến khi unmount `GameScreen` |
| Tắt tiếng | `useCardSound` | State **và** `localStorage` | Lâu dài |
| Bộ phát âm thanh | `useCardSound` | Biến module | Đến khi tải lại trang |

Bảng này cho thấy một điều quan trọng: mỗi dữ liệu được đặt ở **nơi thấp nhất có thể mà vẫn đủ dùng**. Đó là lý do `App` không render lại khi rút thẻ.

Hãy so sánh cách chọn công cụ lưu trữ:

```text
Giá trị có ảnh hưởng tới giao diện?
├─ Có
│   ├─ Tính được từ dữ liệu sẵn có?   → Biến thường trong lúc render (progress, isOrdered)
│   └─ Không tính được                → useState
│       └─ Cần tồn tại sau khi tải lại? → Thêm localStorage
└─ Không
    ├─ Theo từng component instance   → useRef (pending)
    └─ Dùng chung cho cả trang        → Biến module (audioCtx)
```

### Ba tầng trách nhiệm

```text
TẦNG DỮ LIỆU       decks.ts
                   Không biết gì về React hay giao diện
                       │ cung cấp nội dung
                       ▼
TẦNG LOGIC         useDeckQueue, useCardSound
                   Biết React, nhưng không biết giao diện trông thế nào
                       │ cung cấp giá trị và hành động
                       ▼
TẦNG ĐIỀU PHỐI     App, GameScreen
                   Ghép logic với giao diện, xử lý thời điểm
                       │ truyền props
                       ▼
TẦNG TRÌNH BÀY     DeckSelector, PlayingCard, HalloweenDecor
                   Chỉ biết vẽ theo props và báo sự kiện
```

Mũi tên chỉ đi một chiều. `decks.ts` không import gì của React, và `PlayingCard` không biết `useDeckQueue` tồn tại. Nhờ đó, bạn có thể thay giao diện lá bài mà không đụng đến logic rút bài, và ngược lại.

## 3. Bản đồ khái niệm React trong dự án

| Khái niệm | Ví dụ tiêu biểu trong dự án |
|---|---|
| Component, JSX | [App.tsx](../src/App.tsx) |
| Props, callback | [DeckSelector.tsx:5-8](../src/components/DeckSelector.tsx#L5-L8) |
| Render có điều kiện | [App.tsx:15-17](../src/App.tsx#L15-L17) |
| Danh sách, `key` | [DeckSelector.tsx:62-64](../src/components/DeckSelector.tsx#L62-L64) |
| `useState`, khởi tạo lười | [useDeckQueue.ts:48](../src/hooks/useDeckQueue.ts#L48) |
| Updater function, bất biến | [useDeckQueue.ts:67-76](../src/hooks/useDeckQueue.ts#L67-L76) |
| Giá trị suy ra | [useDeckQueue.ts:98-100](../src/hooks/useDeckQueue.ts#L98-L100) |
| `useEffect`, đồng bộ bên ngoài | [useDeckQueue.ts:57-63](../src/hooks/useDeckQueue.ts#L57-L63) |
| `useEffect`, phản ứng với tín hiệu | [GameScreen.tsx:22-28](../src/components/GameScreen.tsx#L22-L28) |
| `useRef` | [GameScreen.tsx:20](../src/components/GameScreen.tsx#L20) |
| `useCallback` | [useCardSound.ts:138-147](../src/hooks/useCardSound.ts#L138-L147) |
| Custom hook | [useDeckQueue.ts:46](../src/hooks/useDeckQueue.ts#L46) |
| Lifting state up | [App.tsx:10](../src/App.tsx#L10) |
| `key` để reset hoặc kích hoạt animation | [App.tsx:19](../src/App.tsx#L19), [GameScreen.tsx:193](../src/components/GameScreen.tsx#L193) |
| `StrictMode` | [main.tsx:7](../src/main.tsx#L7) |

**Những gì dự án không có** và bạn sẽ gặp ở các dự án lớn hơn:

| Chủ đề | Dùng khi nào |
|---|---|
| `useContext` | Nhiều component ở xa nhau cần cùng một dữ liệu |
| `useReducer` | State có nhiều hành động phức tạp, ví dụ chính `useDeckQueue` |
| `useMemo`, `memo` | Tính toán nặng hoặc tránh render lại tốn kém, sau khi đã đo |
| React Router | Mỗi màn hình có URL riêng |
| TanStack Query hoặc tương tự | Lấy dữ liệu từ server |
| Vitest, React Testing Library | Kiểm thử tự động |
| Form có kiểm soát | Ô nhập liệu do state điều khiển |

## 4. Bài tập lớn

### Bài 1: Dọn trùng lặp và dọn timer (có lời giải)

`handleDraw` và `handleBack` gần như giống hệt nhau, và `setTimeout` không được hủy khi unmount. Hãy gộp chúng thành một hàm dùng chung và thêm bước dọn dẹp, trong khi vẫn giữ nguyên hành vi.

<details>
<summary>Lời giải đã được kiểm chứng</summary>

Thay ba hàm `handleDraw`, `handleBack`, `handleReset` trong [GameScreen.tsx:30-66](../src/components/GameScreen.tsx#L30-L66) bằng:

```tsx
const timer = useRef<number | undefined>(undefined)

useEffect(() => () => window.clearTimeout(timer.current), [])

const flipThen = (action: () => void) => {
  if (pending.current) return
  pending.current = true
  playFlipSound()
  if (!revealed) {
    action()
    return
  }
  setRevealed(false)
  timer.current = window.setTimeout(() => {
    playFlipSound()
    action()
  }, FLIP_HALF_MS)
}

const handleDraw = () => flipThen(queue.draw)

const handleBack = () => {
  if (queue.canGoBack) flipThen(queue.goBack)
}

const handleReset = () => {
  if (pending.current) return
  pending.current = true
  playFlipSound()
  setRevealed(false)
  timer.current = window.setTimeout(() => queue.reset(), FLIP_HALF_MS)
}
```

Hai điểm cần chú ý:

- `useEffect(() => () => ..., [])` có hai mũi tên. Hàm ngoài là effect, còn hàm được trả về là **cleanup**, được React gọi khi unmount. Đây là lần đầu bạn thấy cleanup trong tài liệu này.
- `flipThen(queue.draw)` truyền thẳng hàm mà không gọi. Điều này an toàn vì `draw` không phụ thuộc vào `this`.

`handleReset` được giữ riêng vì nó có hành vi khác: luôn úp thẻ trước và không có âm thanh thứ hai.

Tôi đã kiểm tra lời giải này: `tsc` không báo lỗi. Trên trình duyệt, bấm đúp vẫn chỉ sang một câu, xem lại lá trước, làm lại, và bấm quay lại giữa lúc lật đều hoạt động đúng và không có lỗi trong Console.
</details>

### Bài 2: Báo hiệu hết bộ (có gợi ý)

Khi đang ở lá cuối, hãy hiện dòng "Đã hết bộ! Rút tiếp để bắt đầu vòng mới".

<details>
<summary>Gợi ý</summary>

Hook đã trả về `isExhausted`. Hãy thêm một nhánh vào biểu thức dòng trạng thái ở [GameScreen.tsx:200-204](../src/components/GameScreen.tsx#L200-L204). Tôi đã thử với bộ 25 lá, và dòng chữ xuất hiện đúng ở lá 25.
</details>

### Bài 3: Không lặp câu khi sang vòng mới

Hiện tại, thứ tự xáo mới có thể đặt ngay câu vừa rút ở đầu. Hãy sửa `draw` để điều này không xảy ra.

<details>
<summary>Gợi ý</summary>

Trong nhánh hết bộ của `draw`, lấy `prev.order[prev.pointer]` là câu cuối vừa rút. Sau khi gọi `freshOrder`, nếu phần tử đầu trùng câu đó và `total > 1`, hãy đổi chỗ nó với một phần tử khác. Hãy nghĩ thêm: có cần áp dụng cho chế độ "Theo thứ tự" không?
</details>

### Bài 4: Tự viết một thứ mới

Hãy thêm nút "Bỏ qua câu này" mà không làm tăng số câu đã rút. Bài này không có lời giải. Trước khi viết code, hãy tự trả lời:

1. Thay đổi này thuộc tầng nào? Mô hình `order` và `pointer` có đáp ứng được không, hay cần thêm trường mới?
2. Làm sao tương thích với dữ liệu đã lưu của người dùng cũ?
3. Hành động này có cần tăng `actionCount` không?
4. Nó có cần đi qua cơ chế lật thẻ và `pending` không?

### Các bài thử thách khác

- **Khả năng tiếp cận:** làm cho trình đọc màn hình đọc được câu hỏi, như đã phân tích ở [bài 08](08-playing-card.md#5-một-điểm-yếu-về-khả-năng-tiếp-cận).
- **`useReducer`:** viết lại `useDeckQueue` với `useReducer`, gom toàn bộ phần chuyển trạng thái vào một hàm thuần. Sau đó viết test cho hàm đó.
- **URL:** đưa bộ bài đang chọn lên URL dạng `#ban-moi`, để nút Back của trình duyệt và việc tải lại trang đều giữ đúng màn hình.

## 5. Những điểm yếu đang tồn tại

Đây là danh sách có thật, được tìm ra khi viết bộ tài liệu này. **Không có điểm nào làm app hỏng trong sử dụng bình thường**. Hãy dùng nó như bài luyện đọc code một cách phản biện.

| Vị trí | Vấn đề | Đã phân tích ở |
|---|---|---|
| `package.json` | `clsx` được khai báo nhưng không dùng | [Bài 03](03-lop-vo-du-an.md) |
| `index.css` | `.text-balance` trùng với class có sẵn của Tailwind | [Bài 04](04-khoi-dong-app.md) |
| `GameScreen`, `useDeckQueue` | Comment `eslint-disable` thừa, vì dự án dùng oxlint và luật đó không được bật | [Bài 03](03-lop-vo-du-an.md) |
| `decks.ts` | `description` có số câu viết tay, dễ lệch | [Bài 06](06-du-lieu-va-typescript.md) |
| `decks.ts`, `useDeckQueue` | Sửa danh sách câu hỏi có thể làm lệch tiến trình đã lưu | [Bài 06](06-du-lieu-va-typescript.md) |
| `useDeckQueue` | `justReshuffled`, `isExhausted` không được dùng | [Bài 09](09-use-deck-queue.md) |
| `useDeckQueue` | Effect theo `deckId` không có tác dụng thực tế | [Bài 09](09-use-deck-queue.md) |
| `useDeckQueue` | Có thể gặp lại ngay câu vừa rút khi sang vòng mới | [Bài 09](09-use-deck-queue.md) |
| `GameScreen` | `setTimeout` không được hủy khi unmount | [Bài 10](10-game-screen.md) |
| `GameScreen` | Tắt tiếng trong 340ms vẫn nghe một tiếng | [Bài 10](10-game-screen.md) |
| `GameScreen`, `PlayingCard` | `FLIP_HALF_MS` và thời lượng animation nằm ở hai nơi | [Bài 10](10-game-screen.md) |
| `PlayingCard` | `aria-label` che mất câu hỏi với trình đọc màn hình | [Bài 08](08-playing-card.md) |
| `useCardSound` | Có tác dụng phụ trong updater function | [Bài 12](12-use-card-sound.md) |
| Toàn app | URL không đổi, nên nút Back của trình duyệt rời khỏi app | [Bài 01](01-overview.md) |
| Toàn app | Không có test tự động | |

## 6. Bài thi cuối

Hãy trả lời mà không mở code. Nếu trả lời được phần lớn, bạn đã đạt được mục tiêu của bộ tài liệu.

<details>
<summary>1. Điều gì xảy ra từ lúc mở URL đến khi thấy màn hình chọn bài?</summary>

Server trả về `index.html` với `#root` rỗng. Trình duyệt tải `main.tsx` và cây import của nó. `createRoot(...).render(<App />)` chạy, React gọi `App`, nhận mô tả giao diện, rồi tạo DOM thật trong `#root`.
</details>

<details>
<summary>2. Vẽ cây component của màn hình chơi.</summary>

`App` → `HalloweenDecor` (có `SpiderWeb`, `Bat`) và `AnimatePresence` → `motion.div` → `GameScreen` → `PlayingCard` (có `SpiderWeb`). `useDeckQueue` và `useCardSound` là hook, không phải component, nên không nằm trên cây.
</details>

<details>
<summary>3. Vì sao rút thẻ không làm <code>App</code> render lại?</summary>

Vì state rút bài nằm ở `GameScreen` (qua `useDeckQueue`). State đổi chỉ làm render lại component chứa nó và các con, không ảnh hưởng tới cha.
</details>

<details>
<summary>4. Vì sao <code>draw</code> lại dùng <code>setState((prev) =&gt; ...)</code>?</summary>

Giá trị mới phụ thuộc giá trị cũ, nên cần state mới nhất. Điều này cũng giúp `draw` không bị stale closure khi được gọi từ `setTimeout`, và không cần `state` trong dependency.
</details>

<details>
<summary>5. Giải thích vai trò của <code>order</code>, <code>pointer</code> và lý do <code>pointer</code> bắt đầu từ -1.</summary>

`order` là thứ tự rút, lưu vị trí câu hỏi. `pointer` là vị trí hiện tại trong `order`. Giá trị -1 biểu diễn "chưa rút lá nào", để lần rút đầu đưa nó về 0, và phần `[0, pointer]` luôn đúng là phần đã rút.
</details>

<details>
<summary>6. Vì sao cần <code>actionCount</code>?</summary>

Để effect của `GameScreen` luôn chạy sau mỗi hành động, kể cả khi câu hỏi không đổi. Nếu không, `pending` có thể kẹt ở `true` và khóa toàn bộ các nút.
</details>

<details>
<summary>7. <code>pending</code> dùng state có được không? Hỏng ở đâu?</summary>

Không nên, dù với click thật nó vẫn chạy đúng. State chỉ đổi ở lần render sau, nên hai lời gọi liên tiếp không có render xen giữa sẽ cùng đọc thấy `false` và lọt qua khóa. Ngoài ra, nó còn gây ra những lần render không cần thiết, vì giao diện không hiển thị gì từ giá trị này.
</details>

<details>
<summary>8. Tải lại trang khi đang ở câu 5, chuyện gì xảy ra với từng state?</summary>

`selectedDeckId` về `null` nên hiện màn hình chọn bài. Khi chọn lại bộ đó, `useDeckQueue` đọc `order`, `pointer` và `mode` từ `localStorage`. `currentQuestion` có giá trị, nên `revealed` khởi tạo là `true` và `displayed` là câu 5. `actionCount` về 0.
</details>

<details>
<summary>9. Thêm một bộ bài mới cần sửa những file nào?</summary>

Chỉ `decks.ts`. Mọi giao diện đều được sinh ra từ dữ liệu, và tiến trình được lưu tự động theo `id`.
</details>

<details>
<summary>10. Vì sao <code>className={`bg-[${deck.from}]`}</code> không hoạt động?</summary>

Tailwind quét code nguồn dưới dạng văn bản lúc build, chứ không chạy code, nên không biết giá trị của `deck.from`, và không sinh CSS cho class đó. Giá trị động phải dùng `style`.
</details>

<details>
<summary>11. <code>useEffect</code> trong dev bị chạy hai lần khi mount. Vì sao, và có cần sửa không?</summary>

Đây là `StrictMode` cố ý chạy effect, cleanup, rồi chạy lại, để phát hiện effect không có cleanup đúng cách. Chỉ xảy ra ở dev, và không cần sửa nếu effect được viết đúng.
</details>

<details>
<summary>12. Khi nào thì KHÔNG cần <code>useEffect</code>?</summary>

Khi giá trị có thể tính ngay trong lúc render, ví dụ `progress`, hoặc khi việc cần làm là phản ứng với một sự kiện, thì đặt nó trong event handler. Effect dành cho việc đồng bộ với hệ thống bên ngoài React. Effect theo `deckId` trong `useDeckQueue` cũng là ví dụ có thể thay bằng `key`.
</details>

## 7. Đi tiếp từ đây

Thứ tự tôi gợi ý, từ gần đến xa so với những gì bạn đã biết:

1. **Làm các bài tập lớn ở trên.** Chỉ đọc hiểu thôi chưa đủ. Bạn sẽ gặp nhiều vấn đề mà đọc code không thấy được.
2. **Đọc phần Learn của [react.dev](https://react.dev/learn).** Bạn sẽ thấy nhiều khái niệm quen thuộc, đặc biệt là các bài [Keeping Components Pure](https://react.dev/learn/keeping-components-pure) và [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect).
3. **Tự xây lại app này từ đầu mà không nhìn code.** Hãy bắt đầu từ `useDeckQueue`, chỉ dùng giao diện đơn giản, rồi mới thêm animation.
4. **Học `useContext`, `useReducer` và React Router**, rồi thử áp dụng vào dự án này.
5. **Thêm một backend nhỏ:** lưu tiến trình lên server, để học về lấy dữ liệu, trạng thái đang tải, và xử lý lỗi. Đây là phần lớn nhất mà dự án này chưa có.
