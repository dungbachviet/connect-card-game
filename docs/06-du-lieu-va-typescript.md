# 06. Dữ liệu và TypeScript

**File trong bài:** [src/data/decks.ts](../src/data/decks.ts), [src/theme/halloween.ts](../src/theme/halloween.ts)

**Sau bài này, bạn sẽ hiểu:** TypeScript mô tả hình dạng dữ liệu thế nào, vì sao giao diện được sinh ra từ dữ liệu, và những ràng buộc ngầm mà code khác đặt lên file dữ liệu này.

Đây là tài liệu nhẹ nhất, nhưng nó trả lời một câu hỏi quan trọng: **app xoay quanh dữ liệu gì?** Biết được điều này, code giao diện ở các bài sau sẽ dễ đọc hơn rất nhiều.

## 1. Vì sao đọc dữ liệu trước?

`decks.ts` có 272 dòng, nhưng phần cần đọc kỹ chỉ có 16 dòng đầu và dòng cuối. Phần còn lại là nội dung câu hỏi. File này không import gì về React, nên nó có thể tồn tại độc lập, và mọi component đều phụ thuộc vào nó chứ không phải ngược lại.

```text
decks.ts  (không phụ thuộc ai)
   ▲
   ├── App.tsx          lấy decks, getDeckById
   ├── DeckSelector     lấy kiểu Deck
   ├── GameScreen       lấy kiểu Deck, DeckOrder
   ├── PlayingCard      lấy kiểu Deck
   └── useDeckQueue     lấy kiểu DeckOrder
```

## 2. Đọc phần kiểu dữ liệu

```ts
export type DeckOrder = 'ordered' | 'shuffled'

export interface Deck {
  id: string
  title: string
  tagline: string
  description: string
  emoji: string
  from: string
  to: string
  glow: string
  textOnAccent: string
  /** Thứ tự rút bài mặc định khi mở bộ lần đầu. Mặc định: 'shuffled'. */
  defaultOrder?: DeckOrder
  questions: string[]
}
```

### `type` với union: giá trị nằm trong một tập cố định

`'ordered' | 'shuffled'` nghĩa là chỉ được dùng đúng một trong hai chuỗi này. Viết `mode = 'random'` sẽ bị báo lỗi ngay khi kiểm tra kiểu. Trình soạn thảo cũng gợi ý được hai giá trị đó khi bạn gõ.

Dự án không dùng `enum` vì `tsconfig.app.json` có `erasableSyntaxOnly`, như đã nói ở [bài 03](03-lop-vo-du-an.md#4-ba-file-tsconfig). Kiểu union chỉ tồn tại lúc kiểm tra và biến mất hoàn toàn khi chạy.

### `interface`: hình dạng của một object

`Deck` nói rằng mọi bộ bài phải có đủ các trường này với đúng kiểu. Nếu thêm một bộ bài mà quên `glow`, `tsc` sẽ báo lỗi. Hãy lưu ý rằng interface chỉ tồn tại lúc kiểm tra: khi chạy không còn gì ngoài object bình thường.

Trong dự án này, `interface` và `type` gần như dùng thay thế được cho nhau. Quy ước thường gặp là dùng `interface` cho hình dạng object và `type` cho union.

### `defaultOrder?`: trường không bắt buộc

Dấu `?` làm cho trường này có thể vắng mặt, nên kiểu thực sự của nó là `DeckOrder | undefined`. Chỉ một bộ bài có khai báo ([decks.ts:236](../src/data/decks.ts#L236)). Hãy theo dấu giá trị này đi xuyên qua các file:

```text
decks.ts          defaultOrder: 'ordered', hoặc không có (undefined)
    ▼
GameScreen.tsx:16 useDeckQueue(deck.id, deck.questions, deck.defaultOrder)
    ▼
useDeckQueue.ts:46 defaultMode: DeckOrder = 'shuffled'
```

Tham số mặc định `= 'shuffled'` có hiệu lực khi giá trị truyền vào là `undefined`, nên bốn bộ bài không khai báo sẽ được xáo trộn. Nhờ đó, hook luôn có một `DeckOrder` chắc chắn và không phải tự xử lý `undefined`.

### `/** ... */`: JSDoc

Comment dạng này sẽ hiện ra khi bạn di chuột lên `defaultOrder` ở bất cứ đâu trong trình soạn thảo. Đây là comment dành cho người dùng code, không phải chỉ cho người đọc file này.

## 3. Ý nghĩa của từng trường

| Trường | Dùng để làm gì | Nơi dùng |
|---|---|---|
| `id` | Danh tính cố định: `key` của React, khóa trong `localStorage` | Nhiều nơi |
| `title`, `tagline`, `description`, `emoji` | Hiển thị | `DeckSelector`, `PlayingCard`, `GameScreen` |
| `from`, `to` | Hai đầu của dải màu | Nền thẻ, thanh tiến trình, nút chính |
| `glow` | Màu phát sáng, có độ trong suốt | Bóng đổ, quầng sáng nền |
| `textOnAccent` | Màu chữ đặt trên nền dải màu | Mặt trước của thẻ, nút chế độ đang chọn |
| `defaultOrder` | Chế độ khi mở bộ lần đầu | `useDeckQueue` |
| `questions` | Nội dung câu hỏi | `useDeckQueue` |

`textOnAccent` tồn tại vì mỗi bộ có màu riêng, và chữ cần đủ tương phản với nền. Mỗi bộ dùng một tông rất tối của chính màu đó thay vì dùng chung màu đen.

## 4. Giao diện được sinh ra từ dữ liệu

Mảng `decks` gồm 5 bộ, tổng cộng 175 câu hỏi:

| `id` | Số câu | Chế độ mặc định |
|---|---|---|
| `ban-moi` | 60 | Xáo trộn |
| `tinh-ban` | 30 | Xáo trộn |
| `ket-noi-sau` | 30 | Xáo trộn |
| `tinh-yeu` | 30 | Xáo trộn |
| `tu-yeu-toi-roommate` | 25 | Theo thứ tự |

Không component nào viết cứng tên một bộ bài. Tất cả đều đọc từ dữ liệu, nên muốn có bộ bài thứ sáu, bạn chỉ thêm một object và không phải sửa giao diện. Khi gặp nhiều phần giao diện giống nhau chỉ khác nội dung, hãy tách nội dung thành dữ liệu.

Bộ "Bạn Mới" và "Từ Yêu Tới Roommate" có các comment phân cấp như `// Level 1 — Phá băng`. Những comment này chỉ dành cho người viết nội dung, vì mảng chỉ là một danh sách phẳng và code không biết gì về cấp độ. Đó cũng là lý do bộ "Từ Yêu Tới Roommate" đặt `defaultOrder: 'ordered'`: các câu hỏi được thiết kế để sâu dần.

## 5. Hàm `getDeckById`

```ts
export const getDeckById = (id: string) => decks.find((deck) => deck.id === id)
```

Đây là một arrow function: `(tham số) => giá trị trả về`. TypeScript tự suy ra kiểu trả về là `Deck | undefined`, vì `.find` có thể không tìm thấy gì.

Đây là lý do code trong `App` phải viết `selectedDeck ? ... : ...`. TypeScript biết `selectedDeck` có thể là `undefined`, và chỉ cho phép truyền vào `<GameScreen deck={...}>` sau khi đã kiểm tra. Kỹ thuật này gọi là **thu hẹp kiểu** (narrowing). Ngay cả khi `selectedDeckId` có giá trị, kiểu vẫn được xử lý an toàn.

## 6. Những ràng buộc ngầm

Đây là phần mà chỉ đọc file `decks.ts` không thể thấy được. Vì `useDeckQueue` lưu **vị trí** của câu hỏi chứ không lưu nội dung (bạn sẽ học ở [bài 09](09-use-deck-queue.md)), việc sửa dữ liệu có các hệ quả sau:

| Thay đổi | Hệ quả với người đang chơi dở | Lý do |
|---|---|---|
| Thêm hoặc xóa câu | **Mất tiến trình**, bộ bài bắt đầu lại | `loadState` thấy `order.length` khác `total` nên bỏ dữ liệu cũ |
| Sửa chữ của một câu | Giữ tiến trình, thấy nội dung mới | Vị trí không đổi |
| Xóa một câu và thêm một câu khác | **Câu hỏi bị lệch**, các lá đã rút có thể đổi nội dung | Độ dài không đổi nên dữ liệu cũ vẫn được dùng, nhưng vị trí trỏ sang câu khác |
| Đổi `id` | Mất tiến trình của bộ đó | Khóa `localStorage` đổi theo |
| Đổi `defaultOrder` | Người đã mở bộ này vẫn giữ chế độ cũ | Chế độ đã lưu được ưu tiên |

Tôi đã kiểm chứng trường hợp đầu tiên: rút 3 lá của bộ "Từ Yêu Tới Roommate", thêm một câu vào code, rồi mở lại. App hiện dòng "Chạm vào lá bài để rút câu hỏi đầu tiên", tức là tiến trình đã bị đặt lại.

Ngoài ra, `description` có chứa số viết tay: `'60 câu hỏi tăng dần độ sâu...'` ([decks.ts:23](../src/data/decks.ts#L23)) và `'25 câu hỏi giúp...'` ([decks.ts:230](../src/data/decks.ts#L230)). Khi thêm câu hỏi, huy hiệu số câu sẽ tự cập nhật vì nó đọc `questions.length`, nhưng dòng mô tả thì không. Đây chính là vấn đề của việc lưu cùng một thông tin ở hai nơi, đã nói ở [bài 05](05-tu-duy-react-qua-app.md#5-chỉ-lưu-những-gì-không-tính-được).

## 7. `halloween.ts`: công tắc tính năng

```ts
// Đặt thành false để tắt toàn bộ trang trí Halloween.
export const HALLOWEEN = true
```

File này chỉ có một hằng số, nhưng nó được import ở `App`, `DeckSelector` và `PlayingCard`. Đây là dạng đơn giản nhất của **feature flag**: một nơi duy nhất điều khiển một tính năng ở nhiều nơi.

Nó được tách thành file riêng chứ không đặt trong `App.tsx` vì nếu `PlayingCard` import từ `App`, còn `App` lại import `GameScreen` (và `GameScreen` import `PlayingCard`), ta sẽ có một vòng phụ thuộc. Hơn nữa, một file component nên chỉ export component, theo luật linter đã nói ở [bài 03](03-lop-vo-du-an.md#5-oxlintrcjson-linter).

Tuy nhiên đây là hằng số trong code, không phải state: muốn đổi phải sửa code rồi build lại, chứ người dùng không bật tắt được lúc đang chạy.

## Thử ngay

1. Trong `decks.ts`, đổi `from: '#fbbf24'` của bộ đầu tiên thành một màu khác. Hãy xem tất cả những nơi đổi màu theo: thẻ chọn bộ, mặt trước lá bài, thanh tiến trình, nút chính.
2. Thêm một câu hỏi vào bộ "Tình Bạn". Huy hiệu ở màn hình chọn sẽ thành "31 câu". Nếu bạn đang chơi dở bộ này, tiến trình sẽ bị đặt lại.
3. Xóa trường `glow` của một bộ rồi chạy `npx tsc -b`. Hãy đọc thông báo lỗi. TypeScript sẽ nói chính xác thiếu trường nào.
4. Viết `defaultOrder: 'random'`. Lỗi sẽ hiện ngay trong trình soạn thảo.

## Tự kiểm tra

<details>
<summary>1. Vì sao <code>defaultOrder</code> có dấu <code>?</code> mà hook vẫn nhận được một giá trị chắc chắn?</summary>

Vì tham số `defaultMode: DeckOrder = 'shuffled'` trong `useDeckQueue` có giá trị mặc định. Khi `deck.defaultOrder` là `undefined`, tham số nhận `'shuffled'`.
</details>

<details>
<summary>2. Interface <code>Deck</code> có kiểm tra được dữ liệu lúc chạy không, ví dụ dữ liệu đọc từ <code>localStorage</code>?</summary>

Không. Kiểu bị xóa khi dịch. Dữ liệu từ bên ngoài phải được kiểm tra bằng code thật. Đó là lý do `loadState` phải tự kiểm tra `Array.isArray(parsed.order)`, như bạn sẽ thấy ở [bài 09](09-use-deck-queue.md#loadstate-đọc-dữ-liệu-như-đọc-từ-người-lạ).
</details>

<details>
<summary>3. Nếu có API trả về câu hỏi từ server, phần nào của kiến trúc hiện tại sẽ thay đổi và phần nào giữ nguyên?</summary>

Phần đổi: nơi lấy dữ liệu, kèm theo trạng thái đang tải và lỗi. Phần giữ nguyên: kiểu `Deck`, `DeckSelector`, `PlayingCard`, vì chúng chỉ nhận `Deck` qua props và không quan tâm dữ liệu đến từ đâu.
</details>

---

**Bài tiếp theo:** [07. DeckSelector](07-deck-selector.md)
