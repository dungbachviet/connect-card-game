# Giải thích dự án Tâm Giao

**Tâm Giao** là web app chơi bài trò chuyện: cả nhóm chọn một bộ bài, rồi lần lượt rút thẻ và trả lời câu hỏi. Có 5 bộ với tổng 175 câu.

Dự án chỉ có frontend, không có backend hay database. Toàn bộ câu hỏi nằm sẵn trong code, còn tiến trình chơi lưu trong `localStorage` của trình duyệt.

## 1. Cách chạy

Máy bạn đã có Node và npm. Mở terminal tại thư mục dự án rồi chạy:

```bash
npm install    # tải thư viện vào node_modules (chỉ cần khi mới clone hoặc khi package.json đổi)
npm run dev    # chạy server phát triển
```

Sau đó mở `http://localhost:5173`. Khi bạn sửa code, trang sẽ tự cập nhật mà không cần tải lại.

| Lệnh | Tác dụng |
|---|---|
| `npm run dev` | Chạy để phát triển |
| `npm run build` | Kiểm tra kiểu TypeScript, rồi đóng gói thành web tĩnh trong `dist/` |
| `npm run preview` | Xem thử bản đã build |
| `npm run lint` | Quét lỗi code bằng oxlint |

Muốn mở trên điện thoại, hãy kết nối cùng Wi-Fi với máy tính rồi nhập địa chỉ `Network: http://192.168.x.x:5173` mà terminal in ra.

Tôi đã thử type-check, build và lint: cả ba đều không báo lỗi. Tôi chưa bật `npm run dev` và chưa chơi thử trên trình duyệt.

## 2. Công nghệ sử dụng

| Công cụ | Vai trò |
|---|---|
| **React** | Xây giao diện từ các component |
| **TypeScript** | JavaScript có kiểu, giúp bắt lỗi trước khi chạy |
| **Vite** | Chạy dev server và đóng gói code |
| **Tailwind CSS** | Viết CSS bằng class ngay trong JSX, ví dụ `flex rounded-full` |
| **Motion** | Làm animation như lật thẻ, mờ dần, dơi bay |
| **oxlint** | Kiểm tra lỗi và quy tắc viết code |

`clsx` có trong `package.json` nhưng code hiện không dùng đến.

## 3. Cấu trúc thư mục

```text
connect-card-game/
├── index.html            # Trang HTML duy nhất, chứa <div id="root">
├── package.json          # Danh sách thư viện và các lệnh npm
├── vite.config.ts        # Cấu hình Vite
├── tsconfig*.json        # Cấu hình TypeScript
├── .oxlintrc.json        # Cấu hình linter
├── public/favicon.svg    # File tĩnh, giữ nguyên khi build
├── node_modules/         # Thư viện đã tải (không commit)
├── dist/                 # Kết quả build (không commit)
└── src/                  # Code chính
    ├── main.tsx          # Điểm khởi động React
    ├── App.tsx           # Chọn màn hình cần hiển thị
    ├── index.css         # CSS toàn cục, nạp Tailwind
    ├── data/decks.ts     # Nội dung các bộ bài
    ├── theme/halloween.ts# Công tắc bật/tắt Halloween
    ├── hooks/
    │   ├── useDeckQueue.ts   # Logic rút bài
    │   └── useCardSound.ts   # Âm thanh lật thẻ
    └── components/
        ├── DeckSelector.tsx  # Màn hình chọn bộ bài
        ├── GameScreen.tsx    # Màn hình chơi
        ├── PlayingCard.tsx   # Lá bài lật 3D
        └── HalloweenDecor.tsx# Dơi, nhện, mạng nhện, bí ngô
```

Cách chia này tách riêng ba phần:
- **Dữ liệu:** `data/`
- **Logic:** `hooks/`
- **Giao diện:** `components/`

## 4. App khởi động thế nào

```text
index.html → main.tsx → App.tsx ─┬─ HalloweenDecor (nền trang trí)
                                 ├─ DeckSelector   (nếu chưa chọn bộ)
                                 └─ GameScreen     (nếu đã chọn bộ)
                                      ├─ useDeckQueue
                                      ├─ useCardSound
                                      └─ PlayingCard
```

1. [index.html:12-13](index.html#L12-L13) tạo một thẻ `div` rỗng và nạp `main.tsx`.
2. [main.tsx:6-10](src/main.tsx#L6-L10) cho React vẽ `<App />` vào thẻ `div` đó.
3. [App.tsx:10](src/App.tsx#L10) giữ state `selectedDeckId`, quyết định màn hình nào được hiển thị:
   - `null`: hiện màn hình chọn bộ bài.
   - Có id: hiện màn hình chơi.

Dự án không dùng React Router, nên URL không đổi khi chuyển màn hình.

**Props truyền dữ liệu từ cha xuống con, còn callback báo sự kiện từ con lên cha.** Ví dụ khi bạn chọn một bộ bài:

```text
App truyền onSelect={setSelectedDeckId} xuống DeckSelector
→ người dùng bấm vào bộ bài
→ DeckSelector gọi onSelect(deck.id)
→ state của App đổi, React vẽ lại và hiện GameScreen
```

## 5. Các file quan trọng

### `data/decks.ts`: dữ liệu
[Interface `Deck`](src/data/decks.ts#L3-L16) mô tả một bộ bài gồm tên, emoji, màu sắc và mảng `questions`. Giao diện tự vẽ theo mảng `decks`, nên thêm một object vào đó là có bộ bài mới mà không phải sửa component.

### `useDeckQueue.ts`: logic rút bài
Đây là file nên đọc kỹ nhất. Thay vì xóa câu đã rút, nó dùng một mảng thứ tự và một con trỏ:

```text
order:   [2, 0, 1]   // thứ tự rút, mỗi số là vị trí câu hỏi trong questions
pointer: 1           // đang ở phần tử thứ 2 của order, tức câu questions[0]
mode:    'shuffled'  // hoặc 'ordered'
```

| Hành động | Điều xảy ra |
|---|---|
| Rút thẻ ([`draw`](src/hooks/useDeckQueue.ts#L65-L73)) | Tăng `pointer`; hết bộ thì tạo thứ tự mới và quay về đầu |
| Xem lại ([`goBack`](src/hooks/useDeckQueue.ts#L79-L81)) | Giảm `pointer` |
| Chơi lại ([`reset`](src/hooks/useDeckQueue.ts#L75-L77)) | Tạo thứ tự mới, đặt `pointer = -1` (chưa rút lá nào) |
| Đổi chế độ ([`setMode`](src/hooks/useDeckQueue.ts#L84-L91)) | Giữ các lá đã rút, chỉ sắp xếp lại các lá còn lại |

Vì `order` và `pointer` được lưu lại, các lá đã rút không lặp lại và bạn tải lại trang vẫn chơi tiếp được. [Hàm `shuffled`](src/hooks/useDeckQueue.ts#L10-L17) dùng thuật toán xáo bài Fisher–Yates. State được [lưu vào `localStorage`](src/hooks/useDeckQueue.ts#L55-L61) mỗi khi thay đổi, với key dạng `tam-giao:ban-moi`.

### `GameScreen.tsx`: điều phối màn hình chơi
Component này nối logic với giao diện. Nó có 3 giá trị đáng chú ý:

- **`revealed`:** lá bài đang ngửa hay úp.
- **`displayed`:** câu hỏi đang in trên thẻ, tách riêng khỏi `queue.currentQuestion`.
- **`pending`:** một `useRef`, dùng để chặn bấm liên tục trong lúc thẻ đang lật. Đổi ref không làm React vẽ lại.

`displayed` cần tách riêng để người chơi không thấy câu mới trước khi thẻ úp xuống. Khi bạn bấm rút thẻ lúc thẻ đang ngửa ([handleDraw](src/components/GameScreen.tsx#L30-L43)):

```text
Bấm → pending = true, phát âm thanh
    → setRevealed(false): thẻ úp xuống
    → sau 340ms: phát âm thanh, queue.draw()
    → câu hỏi đổi, useEffect chạy
    → cập nhật displayed, setRevealed(true), pending = false
    → thẻ lật lên với câu mới
```

### `PlayingCard.tsx`: lật thẻ 3D
Lá bài gồm hai mặt xếp chồng lên nhau:

- [`perspective`](src/components/PlayingCard.tsx#L17) tạo chiều sâu.
- [`rotateY`](src/components/PlayingCard.tsx#L24) xoay thẻ 0° hoặc 180° theo `revealed`.
- `backfaceVisibility: hidden` ẩn mặt đang quay ra sau.
- Mặt câu hỏi [xoay sẵn 180°](src/components/PlayingCard.tsx#L67), nên nó hiện ra đúng chiều khi thẻ lật.

### `useCardSound.ts`: âm thanh
Dự án không có file nhạc nào. Âm thanh được tạo trực tiếp bằng Web Audio API: một tiếng "whoosh" từ nhiễu, cộng với tiếng chuông nốt C5 và G5 có vang. Phần đầu file xử lý riêng cho iOS. File này khá khó, nên bạn có thể đọc sau cùng.

### `HalloweenDecor.tsx` và `halloween.ts`
[`HALLOWEEN = true`](src/theme/halloween.ts#L2) bật toàn bộ trang trí Halloween. Đổi thành `false` là tắt hết. Đây là một công tắc tính năng đơn giản.

## 6. Thứ tự nên đọc code

1. `index.html`, `main.tsx`, `App.tsx`: hiểu luồng khởi động.
2. Phần đầu `data/decks.ts`: hiểu hình dạng dữ liệu.
3. `DeckSelector.tsx`: component dễ nhất, có props và `.map()`.
4. `PlayingCard.tsx`: component nhận props và animation.
5. `useDeckQueue.ts`: state, effect và custom hook.
6. `GameScreen.tsx`: cách mọi phần ghép lại với nhau.
7. `HalloweenDecor.tsx` và `useCardSound.ts`: đọc thêm khi đã vững.

## 7. Bài tập để học

**Dễ**
1. Đổi `HALLOWEEN` thành `false` và xem giao diện thay đổi ra sao.
2. Thêm một câu hỏi vào bộ "Bạn Mới". Số câu ở màn hình chọn bài sẽ tự tăng.
3. Mở DevTools, vào **Application → Local Storage**, rồi xem `order` và `pointer` đổi thế nào khi rút thẻ.

**Trung bình**

4. Tự tạo một bộ bài mới với màu riêng.
5. Hiện dòng "Đã hết bộ!" bằng giá trị `isExhausted`. Hook đã trả về giá trị này nhưng giao diện chưa dùng.

**Sửa lỗi thật**

Khi đọc code, tôi thấy hai lỗi cùng một nguyên nhân (chưa chạy thử để xác nhận). `pending` chỉ được trả về `false` trong [useEffect này](src/components/GameScreen.tsx#L22-L28), mà effect chỉ chạy khi câu hỏi đổi. Nếu câu hỏi không đổi, `pending` kẹt ở `true` và thẻ không bấm được nữa:

6. **Bấm "xáo lại" khi chưa rút lá nào:** câu hỏi vẫn là `null` trước và sau khi reset, nên thẻ bị kẹt. Thử bấm nút này ngay khi mới mở một bộ chưa rút lá nào.
7. **Hết bộ và xáo lại:** nếu ở chế độ xáo trộn, câu đầu tiên của lượt mới trùng câu cuối của lượt trước, thẻ sẽ kẹt ở trạng thái úp. Lỗi này hiếm gặp hơn vì phải trùng ngẫu nhiên.

Quay về màn hình chọn bộ bài rồi vào lại sẽ hết kẹt, vì `GameScreen` được tạo mới.

Bạn có muốn tôi hướng dẫn từng bước sửa lỗi số 6 không? Đây là bài tập tốt để hiểu `useEffect` và `useRef`.