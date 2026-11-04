# 05-00. Đọc hiểu code `App.tsx`

**File trong bài:** [src/App.tsx](../src/App.tsx)

Bài này giúp bạn đọc hiểu từng dòng của `App.tsx`, và trả lời một câu hỏi rất hay gặp: `AnimatePresence` và `motion.div` có thực sự tạo ra thẻ HTML không? Khi đã hiểu code, bạn đọc tiếp [bài 05](05-tu-duy-react-qua-app.md) để nắm cách React hoạt động ở bên dưới.

## 1. `App.tsx` làm nhiệm vụ gì?

`App.tsx` là **component gốc**, đứng ở tầng cao nhất của giao diện. Bạn có thể xem nó như một tổng đài điều phối, với ba việc:

- **Quyết định hiển thị màn hình nào:** màn hình chọn bộ bài (`DeckSelector`) hay màn hình chơi (`GameScreen`).
- **Tạo hiệu ứng chuyển màn hình:** màn hình cũ mờ dần, rồi màn hình mới hiện lên.
- **Bật phần trang trí Halloween:** dơi, nhện, mạng nhện nằm ở lớp nền phía sau.

Đây là toàn bộ file:

```tsx
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
```

## 2. Giải thích từng phần

### A. Phần import ([dòng 1-7](../src/App.tsx#L1-L7))

Mỗi dòng `import` lấy về một thứ mà file này cần dùng:

| Thứ được import | Là gì | Dùng để làm gì |
|---|---|---|
| `useState` | Hook của React | Giúp component ghi nhớ bộ bài đang được chọn |
| `motion`, `AnimatePresence` | Công cụ của thư viện Motion (tên cũ là Framer Motion) | Tạo hiệu ứng khi một phần tử xuất hiện hoặc biến mất |
| `DeckSelector` | Component của dự án | Màn hình chọn bộ bài |
| `GameScreen` | Component của dự án | Màn hình chơi |
| `HalloweenDecor` | Component của dự án | Lớp trang trí Halloween |
| `decks`, `getDeckById` | Dữ liệu và hàm trong `decks.ts` | Danh sách các bộ bài thật, và hàm tìm một bộ theo id |
| `HALLOWEEN` | Hằng số `true` hoặc `false` | Công tắc bật tắt phần trang trí |

Cách đọc đường dẫn rất đơn giản: có `./` ở đầu là file trong dự án (như `./components/DeckSelector`), không có là thư viện đã cài (như `react`).

### B. Khai báo component ([dòng 9](../src/App.tsx#L9))

```tsx
function App() {
```

Component chỉ là **một hàm JavaScript trả về giao diện**. Tên phải viết hoa để React phân biệt nó với thẻ HTML: `<App>` là component, còn `<div>` là thẻ HTML.

### C. Ghi nhớ bộ bài đang chọn ([dòng 10](../src/App.tsx#L10))

```tsx
const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null)
```

Dòng này tạo ra một **state**, tức là một giá trị được React ghi nhớ. Tách ra từng phần:

| Phần code | Ý nghĩa |
|---|---|
| `selectedDeckId` | Giá trị hiện tại: id của bộ bài đang chọn |
| `setSelectedDeckId` | Hàm dùng để đổi giá trị. Gọi hàm này thì React sẽ vẽ lại giao diện |
| `useState(null)` | Giá trị ban đầu là `null`, nghĩa là chưa chọn bộ nào |
| `<string \| null>` | Kiểu TypeScript: giá trị chỉ có thể là một chuỗi hoặc `null` |

Dấu `[a, b] = ...` là cách viết tắt để lấy hai phần tử từ mảng mà `useState` trả về.

### D. Tìm thông tin của bộ bài ([dòng 11](../src/App.tsx#L11))

```tsx
const selectedDeck = selectedDeckId ? getDeckById(selectedDeckId) : undefined
```

`điều kiện ? A : B` nghĩa là "nếu đúng thì lấy A, nếu sai thì lấy B". State chỉ lưu id, nên dòng này dùng id đó để lấy ra toàn bộ thông tin của bộ bài:

| `selectedDeckId` | `selectedDeck` |
|---|---|
| `null` | `undefined` |
| `'ban-moi'` | Object bộ bài "Bạn Mới", gồm tên, màu sắc, câu hỏi... |

`selectedDeck` là biến thường, không phải state. Nó được tính lại mỗi khi `App` chạy.

### E. Phần giao diện ([dòng 13-40](../src/App.tsx#L13-L40))

**Thẻ rỗng `<>...</>` ([dòng 14](../src/App.tsx#L14)).** Một hàm chỉ trả về được một giá trị, trong khi `App` cần trả về hai thứ ngang hàng là phần trang trí và màn hình hiện tại. Thẻ rỗng, gọi là Fragment, gom chúng lại.

**Phần trang trí ([dòng 15](../src/App.tsx#L15)).**

```tsx
{HALLOWEEN && <HalloweenDecor />}
```

Dấu `{ }` cho phép viết JavaScript trong JSX. Cả dòng này có nghĩa là: nếu `HALLOWEEN` là `true` thì hiển thị `HalloweenDecor`, nếu là `false` thì không hiển thị gì.

**`AnimatePresence` ([dòng 16](../src/App.tsx#L16)).** Bình thường, React xóa một phần tử ngay khi nó không còn trong code trả về, nên không kịp chạy hiệu ứng mờ dần. `AnimatePresence` giữ phần tử đó lại cho đến khi hiệu ứng chạy xong. `mode="wait"` nghĩa là chờ màn hình cũ biến mất hẳn rồi mới hiện màn hình mới.

**Chọn màn hình ([dòng 17](../src/App.tsx#L17) và [dòng 27](../src/App.tsx#L27)).**

```tsx
{selectedDeck ? ( màn hình chơi ) : ( màn hình chọn bộ bài )}
```

Đây chính là chỗ quyết định màn hình nào được hiển thị: đã có bộ bài thì hiện màn hình chơi, chưa có thì hiện màn hình chọn.

**`motion.div` ([dòng 18-24](../src/App.tsx#L18-L24)).** Đây là một thẻ `div` có thêm khả năng tạo hiệu ứng:

| Thuộc tính | Ý nghĩa | Trong code này |
|---|---|---|
| `initial` | Trạng thái lúc mới xuất hiện | Trong suốt |
| `animate` | Trạng thái cần chuyển tới | Hiện rõ |
| `exit` | Trạng thái lúc rời đi | Trong suốt |
| `transition` | Hiệu ứng diễn ra thế nào | Kéo dài 0,3 giây |
| `key` | Tên định danh của phần tử | Id của bộ bài, hoặc `"selector"` |

`key` rất quan trọng: nhờ `key` đổi, `AnimatePresence` mới biết màn hình cũ đã được thay bằng màn hình mới, và chạy hiệu ứng cho đúng. [Bài 05](05-tu-duy-react-qua-app.md#7-key-danh-tính-của-một-component) sẽ nói kỹ hơn về `key`.

Hai cặp ngoặc trong `initial={{ opacity: 0 }}` không có gì đặc biệt: cặp ngoài là "viết JavaScript trong JSX", cặp trong là một object.

**Màn hình chơi ([dòng 25](../src/App.tsx#L25)).**

```tsx
<GameScreen deck={selectedDeck} onBack={() => setSelectedDeckId(null)} />
```

`deck` và `onBack` là **props**, tức là dữ liệu mà cha truyền cho con, giống như tham số của một hàm:

- `deck`: bộ bài cần chơi.
- `onBack`: hàm mà `GameScreen` sẽ gọi khi người dùng bấm quay lại. Hàm này đặt state về `null`, nên `App` hiện lại màn hình chọn bộ bài.

**Màn hình chọn bộ bài ([dòng 35](../src/App.tsx#L35)).**

```tsx
<DeckSelector decks={decks} onSelect={setSelectedDeckId} />
```

`onSelect` nhận thẳng hàm `setSelectedDeckId`. Khi người dùng chọn một bộ, `DeckSelector` gọi `onSelect('ban-moi')`, và việc này cũng chính là gọi `setSelectedDeckId('ban-moi')`.

Hãy so sánh với `onBack`: nó phải bọc thêm `() => ...` vì cần truyền cố định giá trị `null`. Nếu viết `onBack={setSelectedDeckId(null)}`, hàm sẽ chạy ngay khi vẽ giao diện chứ không chờ tới lúc bấm nút.

### F. Export ([dòng 43](../src/App.tsx#L43))

```tsx
export default App
```

Dòng này cho phép file khác lấy `App` về dùng. Chính [main.tsx:4](../src/main.tsx#L4) import nó bằng dòng `import App from './App.tsx'`.

## 3. Các thẻ này có thật sự tạo ra thẻ HTML không?

**Có thẻ tạo ra, có thẻ không.** `motion.div` tạo ra một thẻ `<div>` thật, còn `AnimatePresence` thì không tạo ra thẻ nào.

Quy tắc chung: **trình duyệt không bao giờ biết tới component.** Trình duyệt chỉ nhận được các thẻ HTML cuối cùng mà component đó tạo ra.

| Trong code React | Trong HTML thật | Giải thích |
|---|---|---|
| `<>...</>` | Không có thẻ nào | Chỉ dùng để gom các phần tử trong code |
| `<AnimatePresence>` | Không có thẻ nào | Chỉ có logic, giữ phần tử lại cho đến khi hiệu ứng xong |
| `<motion.div>` | `<div>` | Một thẻ `div` bình thường |
| `<HalloweenDecor />` | `<div>` lớp trang trí | Là thẻ gốc mà component này trả về |
| `<DeckSelector />`, `<GameScreen />` | `<div>` khung màn hình | Tương tự, là thẻ gốc mà component trả về |

Tôi đã mở app bằng trình duyệt thật và xem HTML của nó. Khi đang ở màn hình chọn bộ bài, phần bên trong `#root` có dạng như sau (đã rút gọn):

```html
<div id="root">

  <!-- Do HalloweenDecor tạo ra -->
  <div class="pointer-events-none fixed inset-0 z-0 overflow-hidden ..." aria-hidden="true">...</div>

  <!-- Do motion.div tạo ra -->
  <div style="opacity: 1;">

    <!-- Do DeckSelector tạo ra -->
    <div class="relative flex min-h-dvh flex-col overflow-hidden ...">...</div>

  </div>
</div>
```

Từ kết quả này, bạn có thể rút ra ba điều:

- **Không có thẻ lạ:** bạn sẽ không tìm thấy `<animatepresence>` hay `<motion.div>` ở bất cứ đâu.
- **Các thuộc tính đã biến mất:** `initial`, `animate`, `exit`, `transition` và `key` không xuất hiện trong HTML. Chúng chỉ là thông tin dành cho React và Motion. Thẻ `<div>` chỉ còn lại đúng một thuộc tính là `style`.
- **Props cũng không xuất hiện:** `deck`, `onBack`, `onSelect` chỉ được truyền giữa các component.

### `motion.div` hoạt động thế nào?

`motion` là một object do thư viện cung cấp, chứa các component tương ứng với thẻ HTML: `motion.div` tạo ra `<div>`, `motion.button` tạo ra `<button>`, `motion.span` tạo ra `<span>`. Component này đọc các thuộc tính như `animate` rồi điều khiển thẻ HTML thật để tạo hiệu ứng.

Có một chi tiết thú vị: trong lúc màn hình đang mờ dần, tôi đo được độ mờ thực tế là `0,58`, nhưng thẻ vẫn ghi `style="opacity: 1;"`. Với hiệu ứng mờ này, Motion nhờ chính trình duyệt chạy animation (qua Web Animations API) chứ không ghi lại `style` ở từng khung hình. Vì vậy, nếu nhìn vào tab Elements, bạn sẽ không thấy con số trong `style` chạy dần. Muốn xem giá trị đang đổi, hãy dùng tab **Computed** hoặc tab **Animations** của DevTools.

### `AnimatePresence` hoạt động thế nào?

Nó không tạo ra thẻ nào, nhưng kiểm soát **thời điểm** một thẻ bị xóa khỏi trang. Đây là số đo thật khi bấm chọn một bộ bài, ở chế độ dev (số có thể lệch đôi chút giữa các lần chạy):

```text
Thời điểm   Trên trang có gì                Độ mờ
───────────────────────────────────────────────────
0ms         Màn hình chọn bộ bài            1,00
~90ms       Màn hình chọn bộ bài            0,58   ← Đang mờ dần
~190ms      Màn hình chọn bộ bài            0,20
~290ms      Màn hình chọn bộ bài            0,00   ← Đã mờ hết
~310ms      Thẻ cũ bị xóa khỏi trang
~330ms      Thẻ của màn hình chơi xuất hiện
~390ms      Màn hình chơi                   0,32   ← Đang hiện dần
~490ms      Màn hình chơi                   0,73
~690ms      Màn hình chơi                   1,00
```

State đã đổi ngay từ lúc bấm, nhưng thẻ cũ vẫn ở lại thêm khoảng 300ms nhờ `AnimatePresence`. Do có `mode="wait"`, hai màn hình không bao giờ cùng nằm trên trang: suốt quá trình đo, `#root` luôn chỉ có 2 phần tử con là lớp trang trí và một màn hình.

## 4. Ghép lại: chuyện gì xảy ra khi người dùng thao tác?

**Khi mở app:**

```text
selectedDeckId = null  →  selectedDeck = undefined  →  Hiện DeckSelector
```

**Khi chọn bộ "Bạn Mới":**

```text
DeckSelector gọi onSelect('ban-moi')
→ selectedDeckId = 'ban-moi'
→ React chạy lại hàm App()
→ selectedDeck = object bộ "Bạn Mới"
→ key đổi từ "selector" thành "ban-moi"
→ AnimatePresence cho màn hình cũ mờ dần, rồi hiện GameScreen
```

**Khi bấm nút quay lại:**

```text
GameScreen gọi onBack()
→ selectedDeckId = null
→ React chạy lại hàm App()
→ selectedDeck = undefined
→ key đổi từ "ban-moi" thành "selector"
→ AnimatePresence cho GameScreen mờ dần, rồi hiện DeckSelector
```

## Thử ngay

1. Chạy `npm run dev`, nhấn `F12`, mở tab **Elements** và tìm thẻ `<div id="root">`. Hãy đối chiếu với đoạn HTML ở trên.
2. Trong tab Elements, nhấn `Cmd + F` rồi tìm `animatepresence`. Bạn sẽ không thấy kết quả nào.
3. Đổi `duration: 0.3` của cả hai `motion.div` thành `duration: 3`, rồi chọn một bộ bài. Với hiệu ứng chậm như vậy, bạn sẽ thấy thẻ cũ ở lại trong tab Elements cho đến khi mờ hết, rồi mới bị xóa. Nhớ khôi phục code sau khi thử.

## Tự kiểm tra

<details>
<summary>1. Vì sao trong HTML không có thẻ <code>&lt;GameScreen&gt;</code>?</summary>

Vì `GameScreen` chỉ là một hàm JavaScript. Trình duyệt chỉ nhận các thẻ HTML mà hàm đó trả về, ở đây là một thẻ `<div>` với các thẻ con.
</details>

<details>
<summary>2. Nếu đổi <code>motion.div</code> thành <code>motion.section</code> thì HTML thay đổi thế nào?</summary>

Thẻ `<div style="opacity: 1;">` sẽ trở thành thẻ `<section>`. Hiệu ứng vẫn giữ nguyên.
</details>

<details>
<summary>3. Nếu bỏ <code>AnimatePresence</code> nhưng giữ <code>motion.div</code> thì sao?</summary>

Màn hình mới vẫn hiện dần nhờ `initial` và `animate`, nhưng màn hình cũ bị xóa ngay nên không còn hiệu ứng mờ dần, vì `exit` cần `AnimatePresence` mới chạy được.
</details>

<details>
<summary>4. Sau khi bấm chọn bộ bài, vì sao màn hình cũ vẫn còn trên trang thêm khoảng 300ms?</summary>

Vì `AnimatePresence` giữ thẻ đó lại để chạy hết hiệu ứng `exit` kéo dài 0,3 giây, rồi mới cho xóa khỏi trang.
</details>

---

**Bài tiếp theo:** [05. Tư duy React qua App](05-tu-duy-react-qua-app.md)
