# 04. Khởi động app: từ trang trắng đến giao diện

**File trong bài:** [index.html](../index.html), [src/main.tsx](../src/main.tsx), [src/index.css](../src/index.css)

**Sau bài này, bạn sẽ hiểu:** chuyện gì xảy ra từ lúc trình duyệt nhận được một file HTML gần như rỗng cho đến khi màn hình chọn bộ bài xuất hiện.

## 1. `index.html`: một trang gần như trống

Toàn bộ phần thân của trang chỉ có hai dòng ([index.html:12-13](../index.html#L12-L13)):

```html
<div id="root"></div>
<script type="module" src="/src/main.tsx"></script>
```

Điều này cho thấy bản chất của app: **HTML từ server không chứa nội dung nào.** Tên bộ bài, nút bấm, câu hỏi đều do JavaScript vẽ ra sau khi trang đã tải. Mô hình này được gọi là **SPA** (Single Page Application) với cách render ở phía trình duyệt.

Tôi đã kiểm chứng: HTML server trả về đúng là `<div id="root"></div>` rỗng, và sau khi JavaScript chạy, `#root` có hai phần tử con.

Bạn có thể tự thấy điều này bằng cách so sánh hai góc nhìn trong trình duyệt:

- **View Page Source** cho thấy thẻ `div` rỗng, là thứ server đã gửi.
- **DevTools → Elements** cho thấy cây giao diện đầy đủ, là trạng thái hiện tại của trang sau khi JavaScript chạy.

| Ưu điểm của SPA | Nhược điểm của SPA |
|---|---|
| Chỉ cần host file tĩnh, không cần server riêng | Trang trắng cho đến khi JavaScript tải xong |
| Chuyển màn hình tức thì, không tải lại trang | Nội dung không có sẵn trong HTML, bất lợi cho SEO |

### Phần `<head>`

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=1" />
```

Dòng này rất quan trọng với một app dùng trên điện thoại:

- `width=device-width`: trang rộng bằng màn hình thật, thay vì giả lập màn hình máy tính rồi thu nhỏ.
- `viewport-fit=cover`: cho nội dung tràn ra vùng tai thỏ của iPhone. Vì thế các màn hình phải tự chừa khoảng trống bằng `env(safe-area-inset-top)`, như bạn sẽ thấy ở [DeckSelector.tsx:12](../src/components/DeckSelector.tsx#L12).
- `maximum-scale=1`: hạn chế zoom, tránh việc trang tự phóng to ngoài ý muốn. Cái giá là người khiếm thị khó phóng to hơn trên những trình duyệt tuân theo tùy chọn này.

`theme-color` đặt màu thanh trình duyệt trên điện thoại, trùng với màu nền `#0b0a12` của app.

### `<script type="module">`

`type="module"` báo cho trình duyệt rằng đây là ES module, tức là file được phép dùng `import` và `export`. Điều đáng chú ý là script này trỏ tới một file `.tsx`, thứ trình duyệt không hiểu. Xử lý nó thế nào là việc của Vite, và cách xử lý khác nhau theo từng lệnh.

**Với `npm run dev`:** Vite dịch `main.tsx` sang JavaScript ngay khi trình duyệt xin file đó.

**Với `npm run build`:** Vite viết lại chính file HTML. Đây là phần tương ứng trong `dist/index.html` thật của dự án:

```html
<script type="module" crossorigin src="/assets/index-B-_MvnLT.js"></script>
<link rel="stylesheet" crossorigin href="/assets/index-BAIetgiC.css">
...
<body>
  <div id="root"></div>
</body>
```

Một file `.tsx` đã trở thành một file `.js` chứa toàn bộ code, kèm một file `.css` tách riêng.

## 2. `main.tsx`: nơi React bắt đầu

File này chỉ có 10 dòng, nhưng đây là cầu nối giữa thế giới HTML và thế giới React:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

### Các dòng import

Có ba kiểu import khác nhau:

| Dòng | Kiểu | Ý nghĩa |
|---|---|---|
| `import { StrictMode } from 'react'` | Named import | Lấy đúng phần được `export` với tên `StrictMode` |
| `import App from './App.tsx'` | Default import | Lấy phần `export default` của file, và bạn tự đặt tên khi nhận |
| `import './index.css'` | Side-effect import | Không lấy giá trị nào, chỉ cần file đó được nạp |

Dòng thứ ba không phải JavaScript chuẩn: đây là tính năng của Vite. Khi gặp import một file CSS, Vite đưa CSS đó vào trang.

Đường dẫn có hai loại. `'react'` không có `./` phía trước nên là thư viện trong `node_modules`, còn `'./App.tsx'` là file của dự án, tính từ vị trí file hiện tại.

### Dấu `!` ở cuối `getElementById('root')`

`document.getElementById` có thể không tìm thấy gì, nên kiểu trả về của nó là `HTMLElement | null`. Trong khi đó `createRoot` không chấp nhận `null`. Dấu `!` là cách bạn nói với TypeScript: "tôi chắc chắn giá trị này không phải `null`".

Dấu này chỉ tác động lúc kiểm tra kiểu và biến mất sau khi dịch. Nếu bạn đổi `id` trong HTML, TypeScript vẫn im lặng, còn app sẽ báo lỗi lúc chạy. Dùng `!` ở đây là hợp lý vì thẻ `div` đó nằm ngay trong `index.html` của dự án, nhưng đừng dùng nó để bịt miệng trình biên dịch khi chưa chắc chắn.

### `createRoot(...).render(...)`

Hai lời gọi này làm hai việc khác nhau:

1. **`createRoot(element)`** biến thẻ `div` thành nơi React được toàn quyền quản lý.
2. **`.render(<App />)`** bảo React vẽ `App` vào đó.

Đây là lần duy nhất code của dự án "ra lệnh" cho DOM. Từ giờ trở đi, các component không gọi `document.createElement` hay `appendChild`. Chúng chỉ mô tả giao diện mong muốn, và React tự cập nhật DOM cho khớp. Đây là ý tưởng trung tâm của [bài tiếp theo](05-tu-duy-react-qua-app.md).

### `<StrictMode>`

`StrictMode` không vẽ gì lên màn hình. Nó là công cụ phát hiện lỗi, và **chỉ hoạt động trong chế độ dev**. Trong chế độ này, React cố ý làm vài việc hai lần:

- Render mỗi component hai lần.
- Chạy mỗi effect, dọn dẹp nó, rồi chạy lại ngay khi component vừa xuất hiện.
- Gọi hàm khởi tạo trong `useState` và các updater function hai lần.

Mục đích là để lộ code có tác dụng phụ không mong muốn: nếu chạy hai lần mà kết quả sai, tức là code có vấn đề.

Hệ quả là khi thêm `console.log` vào một component, bạn sẽ thấy log xuất hiện hai lần. Đó không phải lỗi. Tôi đã thử thêm `console.log('render App')` vào `App`, và khi mở trang ở chế độ dev, log xuất hiện đúng 2 lần.

## 3. `index.css`: phần CSS toàn cục

```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:...');
@import 'tailwindcss';
```

Dòng 1 nạp font từ Google. Dòng 2 kích hoạt Tailwind, và đây là toàn bộ "cấu hình" Tailwind của dự án vì Tailwind v4 không cần file config riêng. Khi build, dòng này được thay bằng CSS của những class thật sự được dùng, nên file CSS chỉ khoảng 33 kB.

Những quy tắc còn lại trong file đáng chú ý ở lý do tồn tại của chúng:

| Quy tắc | Lý do |
|---|---|
| `color-scheme: dark` | Báo trình duyệt rằng app có nền tối, để thanh cuộn và các thành phần mặc định có màu phù hợp |
| `html, body, #root { height: 100% }` | Cho `#root` cao hết màn hình |
| `-webkit-tap-highlight-color: transparent` | Bỏ khung xám mà điện thoại vẽ khi chạm vào nút |
| `overscroll-behavior-y: none` | Chặn hiệu ứng kéo giật ở mép trang, giúp app giống app thật hơn |
| `button { font-family: inherit }` | Nút bấm mặc định không dùng font của trang, nên phải ép cho kế thừa |
| `.text-balance` | Chia đều độ dài các dòng chữ. Tailwind v4 cũng có sẵn class này, nên quy tắc ở đây thực ra là thừa |

## 4. Toàn bộ quá trình khởi động

```text
1. Trình duyệt xin "/"                → nhận index.html
2. Đọc <head>                         → biết title, viewport, favicon
3. Đọc <body>                         → tạo <div id="root"> rỗng. Lúc này màn hình trống
4. Gặp <script type="module">         → tải main.tsx (Vite đã dịch)
5. main.tsx import các file khác      → tải App, các component, React, Motion...
6. index.css được nạp                 → nền tối, font, class Tailwind
7. createRoot().render(<App />)       → React gọi hàm App()
8. App trả về mô tả giao diện         → React tạo DOM thật trong #root
9. Màn hình chọn bộ bài xuất hiện
```

Bước 5 hình thành một cây phụ thuộc. Mỗi file `import` những file nó cần, bắt đầu từ `main.tsx`:

```text
main.tsx
├── react, react-dom
├── index.css
└── App.tsx
    ├── motion/react
    ├── data/decks.ts
    ├── theme/halloween.ts
    ├── components/HalloweenDecor.tsx
    ├── components/DeckSelector.tsx
    └── components/GameScreen.tsx
        ├── hooks/useDeckQueue.ts
        ├── hooks/useCardSound.ts
        └── components/PlayingCard.tsx
            └── components/HalloweenDecor.tsx (lấy SpiderWeb)
```

Vite cũng đi theo đúng cây này khi build, nên 430 module cuối cùng được gom thành một file JS. Một file không nằm trên cây nào sẽ không có mặt trong kết quả.

## Thử ngay

1. Mở **Network** trong DevTools, tải lại trang khi đang chạy `npm run dev`. Hãy quan sát thứ tự các file được xin và đối chiếu với cây ở trên.
2. Trong [index.html](../index.html), thêm chữ vào giữa `<div id="root">Đang tải...</div>`. Dòng chữ chỉ xuất hiện chốc lát rồi biến mất, vì `render` thay toàn bộ nội dung của thẻ này. Bạn có thể dùng kỹ thuật này làm màn hình chờ đơn giản.
3. Đổi `id="root"` thành `id="app"` rồi xem Console báo gì. Dấu `!` không cứu được lỗi lúc chạy. Nhớ đổi lại sau khi thử.

## Tự kiểm tra

<details>
<summary>1. Vì sao View Page Source không thấy tên bộ bài nào, còn tab Elements thì có?</summary>

View Page Source cho thấy HTML gốc mà server gửi. Tab Elements cho thấy cây DOM hiện tại, sau khi React đã tạo nội dung bằng JavaScript.
</details>

<details>
<summary>2. <code>StrictMode</code> làm code chạy hai lần. Vậy người dùng thật có bị chậm đi không?</summary>

Không. Hành vi chạy hai lần chỉ có trong chế độ dev. Bản build production vẫn giữ thẻ `StrictMode` nhưng không gọi lặp lại.
</details>

<details>
<summary>3. Dấu <code>!</code> trong <code>getElementById('root')!</code> có kiểm tra gì lúc chạy không?</summary>

Không. Nó chỉ nói với TypeScript rằng giá trị không phải `null`, và bị xóa khi dịch sang JavaScript.
</details>

<details>
<summary>4. Nếu tạo file <code>src/components/Test.tsx</code> mà không file nào import nó, file đó có được đưa vào bản build không?</summary>

Không. Vite đóng gói theo cây import bắt đầu từ `main.tsx`. Tuy nhiên `tsc` vẫn kiểm tra kiểu của file đó, vì `tsconfig.app.json` có `"include": ["src"]`.
</details>

---

**Bài tiếp theo:** [05. Tư duy React qua App](05-tu-duy-react-qua-app.md)
