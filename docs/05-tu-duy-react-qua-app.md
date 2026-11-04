# 05. Tư duy React qua `App.tsx`

**File trong bài:** [src/App.tsx](../src/App.tsx)

**Nên đọc trước:** [05-00. Đọc hiểu code App](05-00-doc-hieu-code-app.md)

**Sau bài này, bạn sẽ hiểu:** cách React nghĩ về giao diện, JSX thực chất là gì, state hoạt động thế nào, và `key` quyết định vòng đời component ra sao. Đây là bài nền tảng nhất của cả bộ tài liệu.

## 1. Ý tưởng cốt lõi: giao diện là kết quả của dữ liệu

Nếu không có React, để chuyển từ màn hình chọn bài sang màn hình chơi, bạn phải tự ra lệnh từng bước:

```js
// JavaScript thuần: bạn nói CÁCH thay đổi
selectorDiv.remove()
const game = document.createElement('div')
game.className = '...'
root.appendChild(game)
// ... và nhớ dọn dẹp, gắn sự kiện, xử lý khi quay lại...
```

Với React, bạn chỉ mô tả **giao diện nên trông thế nào ứng với dữ liệu hiện tại**:

```tsx
// React: bạn nói KẾT QUẢ mong muốn
{selectedDeck ? <GameScreen ... /> : <DeckSelector ... />}
```

Hãy ghi nhớ công thức sau, vì mọi thứ khác trong React đều xoay quanh nó:

```text
Giao diện = f(state)
```

Component là một hàm. Đưa dữ liệu vào, nó trả ra mô tả giao diện. Khi dữ liệu đổi, React gọi lại hàm, so sánh kết quả mới với kết quả cũ, rồi chỉ sửa những phần khác nhau trên DOM. Bạn không bao giờ phải tự thao tác DOM.

## 2. Toàn cảnh `App.tsx`

```tsx
function App() {
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null)
  const selectedDeck = selectedDeckId ? getDeckById(selectedDeckId) : undefined

  return (
    <>
      {HALLOWEEN && <HalloweenDecor />}
      <AnimatePresence mode="wait">
        {selectedDeck ? (
          <motion.div key={selectedDeck.id} ...>
            <GameScreen deck={selectedDeck} onBack={() => setSelectedDeckId(null)} />
          </motion.div>
        ) : (
          <motion.div key="selector" ...>
            <DeckSelector decks={decks} onSelect={setSelectedDeckId} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
```

`App` là một hàm JavaScript bình thường với ba đặc điểm: tên viết hoa, trả về JSX, và được React gọi chứ không phải do bạn gọi. App có đúng một state, và state đó chỉ trả lời một câu hỏi: **đang chọn bộ bài nào?**

Cái tên phải viết hoa vì JSX dựa vào đó để phân biệt: `<div>` là thẻ HTML, còn `<App>` là component bạn tự viết.

## 3. JSX thực chất là gì

JSX trông giống HTML nhưng thực ra là JavaScript. Trình dịch biến nó thành lời gọi hàm:

```tsx
<GameScreen deck={selectedDeck} onBack={handleBack} />

// được dịch thành (đơn giản hóa)
jsx(GameScreen, { deck: selectedDeck, onBack: handleBack })
```

Kết quả của lời gọi đó chỉ là **một object mô tả**, chưa phải DOM thật:

```js
{ type: GameScreen, props: { deck: ..., onBack: ... } }
```

Việc hiểu JSX là một biểu thức JavaScript sẽ giải thích được mọi quy tắc của nó:

| Quy tắc | Lý do | Ví dụ trong dự án |
|---|---|---|
| Dùng `{ }` để nhúng JavaScript | Phân biệt code với văn bản | `{deck.emoji}` |
| Chỉ nhúng được biểu thức, không nhúng được câu lệnh | `if` hay `for` không trả về giá trị | Dùng `? :`, `&&`, `.map()` thay thế |
| Mỗi lần trả về một gốc duy nhất | Một hàm chỉ trả về một giá trị | Vì thế có `<>...</>` |
| `className` thay cho `class` | `class` là từ khóa của JavaScript | `className="flex"` |
| `style` nhận object | Đây là giá trị JavaScript, không phải chuỗi CSS | `style={{ background: deck.glow }}` |
| Thuộc tính viết kiểu camelCase | Quy ước của JavaScript | `strokeWidth`, `onClick` |

`style={{ ... }}` có hai cặp ngoặc vì cặp ngoài là "nhúng JavaScript", còn cặp trong là "một object".

### Fragment: `<>...</>`

`App` cần trả về hai thứ ngang hàng: phần trang trí và màn hình hiện tại. Fragment gom chúng lại mà không tạo thêm thẻ nào trên DOM. Đó là lý do `#root` có đúng 2 phần tử con, như đã kiểm chứng ở [bài 04](04-khoi-dong-app.md#1-indexhtml-một-trang-gần-như-trống).

### Hai cách render có điều kiện

```tsx
{HALLOWEEN && <HalloweenDecor />}           // Có hoặc không
{selectedDeck ? <GameScreen /> : <DeckSelector />}   // Chọn một trong hai
```

Cách đầu dựa trên toán tử `&&` của JavaScript: nếu vế trái là `false`, cả biểu thức là `false`, và React không vẽ gì khi gặp `false`, `null` hay `undefined`.

**Bẫy thường gặp:** số `0` thì khác. `{list.length && <List />}` sẽ in ra chữ `0` lên màn hình khi danh sách rỗng, vì React có vẽ số. Dự án này không dính bẫy đó vì `HALLOWEEN` là boolean.

## 4. `useState` và chu trình render

```tsx
const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null)
```

Tách từng phần của dòng này:

- **`useState(null)`** khai báo một giá trị mà React sẽ ghi nhớ giữa các lần gọi hàm, với giá trị đầu là `null`.
- **`<string | null>`** là kiểu TypeScript: giá trị này hoặc là chuỗi, hoặc là `null`.
- **`[a, b] = ...`** là array destructuring: `useState` trả về mảng hai phần tử, và cú pháp này đặt tên cho từng phần tử. Phần tử đầu là giá trị hiện tại, phần tử sau là hàm để đổi giá trị.

**Tại sao không dùng biến bình thường?** Vì có hai lý do:

```tsx
function App() {
  let selectedDeckId = null   // ❌
  // Lý do 1: mỗi lần React gọi App(), dòng này chạy lại và giá trị về null
  // Lý do 2: gán selectedDeckId = 'x' không báo cho React biết cần vẽ lại
}
```

`useState` giải quyết cả hai: giá trị được React lưu giữ bên ngoài hàm, và hàm `set` báo cho React biết cần vẽ lại.

### Chu trình khi người dùng chọn một bộ bài

```text
1. Bấm "Bạn Mới"
2. Gọi setSelectedDeckId('ban-moi')
3. React xếp lịch render lại
────────── RENDER ──────────
4. React gọi lại App()
5. useState lúc này trả về 'ban-moi'
6. selectedDeck được tính lại: tìm ra object của bộ "Bạn Mới"
7. App trả về JSX mới, trong đó có GameScreen
────────── COMMIT ──────────
8. React so sánh với lần trước, rồi sửa DOM cho khớp
9. Trình duyệt vẽ lên màn hình
```

Có hai điều người mới hay nhầm:

**Render không có nghĩa là sửa DOM.** Render chỉ là React gọi hàm component để lấy mô tả. Việc sửa DOM diễn ra ở bước commit, và chỉ với những chỗ thật sự thay đổi.

**`set` không đổi giá trị ngay.** Trong cùng một lần render, biến state giữ nguyên giá trị:

```tsx
setSelectedDeckId('ban-moi')
console.log(selectedDeckId)   // vẫn là null! Giá trị mới chỉ có ở lần render sau
```

Hãy xem mỗi lần render như một bức ảnh chụp: state, props và các hàm trong lần đó đều cố định theo bức ảnh ấy. Khái niệm này sẽ trở nên rất quan trọng ở [bài 10](10-game-screen.md#5-stale-closure-một-lỗi-nhỏ-có-thật-trong-code).

## 5. Chỉ lưu những gì không tính được

```tsx
const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null)
const selectedDeck = selectedDeckId ? getDeckById(selectedDeckId) : undefined
```

`selectedDeck` **không phải state**. Đó là một biến bình thường, được tính lại mỗi lần render từ `selectedDeckId`. Đây là một nguyên tắc rất quan trọng:

> Nếu một giá trị có thể tính được từ state hoặc props đang có, đừng lưu nó thành state riêng.

Lý do là nếu lưu cả hai, bạn phải luôn giữ chúng khớp nhau, và sớm muộn sẽ có lúc quên. Khi chỉ có một nguồn sự thật, lỗi lệch dữ liệu không thể xảy ra.

Bạn sẽ gặp lại nguyên tắc này trong `isOrdered` và `progress` ở `GameScreen`, cũng như `currentQuestion` và `drawnCount` ở `useDeckQueue`.

## 6. Hai quy tắc của hook

Hook là các hàm bắt đầu bằng `use`, cho phép component "móc" vào các khả năng của React. Chúng có hai quy tắc:

1. **Chỉ gọi hook ở cấp trên cùng của component**, không gọi trong `if`, vòng lặp hay hàm lồng.
2. **Chỉ gọi hook trong component hoặc trong custom hook.**

Lý do của quy tắc 1 nằm ở cách React nhớ state. React không biết tên biến của bạn. Nó chỉ dựa vào **thứ tự gọi**:

```tsx
const [revealed, setRevealed] = useState(...)   // React: "hook số 1"
const [displayed, setDisplayed] = useState(...) // React: "hook số 2"
```

Nếu một hook nằm trong `if`, có lần nó được gọi, có lần không, thì "hook số 2" ở lần này sẽ nhận nhầm state của lần khác. Vì vậy thứ tự phải giống hệt nhau ở mọi lần render, và linter `react/rules-of-hooks` đã kiểm tra quy tắc này cho bạn.

## 7. `key`: danh tính của một component

Hãy xem kỹ hai `motion.div` trong `App`:

```tsx
<AnimatePresence mode="wait">
  {selectedDeck ? (
    <motion.div key={selectedDeck.id} ...>
  ) : (
    <motion.div key="selector" ...>
  )}
</AnimatePresence>
```

Khi so sánh hai lần render, React dựa vào **vị trí, loại và `key`** để quyết định:

| So với lần trước | React làm gì | Hệ quả với state bên trong |
|---|---|---|
| Cùng vị trí, cùng loại, cùng `key` | Coi là cùng một component, chỉ cập nhật | **Giữ nguyên** |
| Khác loại hoặc khác `key` | Hủy cái cũ (unmount), tạo cái mới (mount) | **Mất hết, khởi tạo lại** |

Từ đó ta suy ra vòng đời của `GameScreen` trong dự án:

```text
Chọn "Bạn Mới"  → mount GameScreen → useState chạy, nạp tiến trình từ localStorage
Rút vài lá      → chỉ cập nhật, state được giữ
Bấm quay lại    → unmount GameScreen → state trong React mất, nhưng localStorage vẫn còn
Chọn "Tình Bạn" → mount một GameScreen HOÀN TOÀN MỚI
```

Đây là lý do `GameScreen` có thể viết `useState(queue.currentQuestion !== null)` mà không lo giá trị của bộ bài trước còn sót lại.

### `AnimatePresence`: giữ lại thứ sắp biến mất

Khi một phần tử bị bỏ khỏi JSX, React xóa nó ngay lập tức, nên không có cơ hội chạy hiệu ứng mờ dần. `AnimatePresence` của thư viện Motion giải quyết việc này: nó giữ phần tử lại cho đến khi animation `exit` chạy xong.

- `initial`, `animate`, `exit` lần lượt là trạng thái lúc xuất hiện, trạng thái ổn định, và trạng thái lúc rời đi.
- `mode="wait"` nghĩa là chờ màn cũ mờ hết rồi mới hiện màn mới.
- `AnimatePresence` nhận biết một phần tử đã bị thay thế **nhờ `key` đổi**.

Thời gian chuyển màn vì thế là khoảng 0,6 giây: 0,3 giây màn cũ mờ đi và 0,3 giây màn mới hiện lên.

### Đường đi của dữ liệu trong `App`

```text
              App (giữ selectedDeckId)
               │               │
   props xuống │               │ props xuống
 decks,onSelect│               │ deck, onBack
               ▼               ▼
        DeckSelector       GameScreen
               │               │
   sự kiện lên │               │ sự kiện lên
  onSelect(id) │               │ onBack()
               └──► setSelectedDeckId ◄──┘
```

`DeckSelector` và `GameScreen` không biết tới nhau, và cũng không biết state nằm ở đâu. Chúng chỉ nhận dữ liệu và báo sự kiện. `App` giữ state vì đây là tổ tiên chung gần nhất của cả hai. Kỹ thuật này gọi là **lifting state up**: khi nhiều component cần cùng một dữ liệu, hãy đưa nó lên component cha chung.

Hãy so sánh hai cách truyền callback:

```tsx
onSelect={setSelectedDeckId}              // setter nhận sẵn deckId, nên truyền thẳng được
onBack={() => setSelectedDeckId(null)}    // cần tham số cố định null, nên phải bọc một hàm
```

Nếu viết `onBack={setSelectedDeckId(null)}`, hàm sẽ chạy **ngay lúc render** chứ không phải lúc bấm. Đây là lỗi kinh điển của người mới. Cần truyền một hàm, không phải kết quả của việc gọi hàm.

## Thử ngay

1. Thêm `console.log('render App', selectedDeckId)` vào đầu `App`. Mở Console, chọn một bộ bài rồi rút thẻ. Bạn sẽ thấy `App` **không** render lại khi rút thẻ, vì state rút bài nằm ở `GameScreen`, thấp hơn `App`. React chỉ render lại component có state đổi và các con của nó.
2. Đổi `mode="wait"` thành `mode="sync"` và chọn một bộ bài. Hai màn hình sẽ cùng tồn tại trong lúc chuyển.
3. Xóa cả hai thuộc tính `key` trong `App`. Tôi đã thử và đo: app vẫn chuyển màn hình, không có lỗi nào trong Console, nhưng màn cũ không còn mờ hết nữa. Khi có `key`, độ mờ giảm về 0. Khi không có `key`, nó chỉ giảm xuống khoảng 0,6.

## Tự kiểm tra

<details>
<summary>1. Vì sao lưu <code>selectedDeckId</code> trong state mà không lưu cả object <code>selectedDeck</code>?</summary>

Vì object có thể tìm được từ id. Lưu id giữ state ở mức tối thiểu, và tránh việc giữ một bản sao có thể lệch so với dữ liệu trong `decks`.
</details>

<details>
<summary>2. Có gì sai trong đoạn <code>onClick={onSelect(deck.id)}</code>?</summary>

`onSelect(deck.id)` được gọi ngay trong lúc render, và `onClick` nhận về kết quả của nó thay vì một hàm. Việc gọi đó đổi state, gây render lại, rồi lại gọi lại, tạo thành vòng lặp. Cách đúng là `onClick={() => onSelect(deck.id)}`.
</details>

<details>
<summary>3. Quay lại rồi chọn đúng bộ bài cũ, tiến trình có mất không? Vì sao?</summary>

Không mất. State trong React đã mất khi `GameScreen` unmount, nhưng `useDeckQueue` đã lưu tiến trình vào `localStorage`, và nạp lại khi component mount lần mới.
</details>

<details>
<summary>4. "Render" và "cập nhật DOM" có phải là một không?</summary>

Không. Render là React gọi hàm component để lấy mô tả giao diện. Commit mới là lúc DOM thật được sửa, và chỉ với những chỗ khác biệt. Một component có thể render mà DOM không đổi gì.
</details>

---

**Bài tiếp theo:** [06. Dữ liệu và TypeScript](06-du-lieu-va-typescript.md)
