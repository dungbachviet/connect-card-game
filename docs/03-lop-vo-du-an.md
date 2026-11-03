# 03. Lớp vỏ dự án: những file không phải React

**File trong bài:** [package.json](../package.json), [vite.config.ts](../vite.config.ts), [tsconfig.json](../tsconfig.json), [tsconfig.app.json](../tsconfig.app.json), [tsconfig.node.json](../tsconfig.node.json), [.oxlintrc.json](../.oxlintrc.json), [.gitignore](../.gitignore), [public/favicon.svg](../public/favicon.svg)

**Sau bài này, bạn sẽ hiểu:** vì sao trình duyệt không thể chạy thẳng thư mục `src/`, và mỗi công cụ làm gì để lấp khoảng cách đó.

## 1. Vấn đề mà các công cụ này giải quyết

Trình duyệt chỉ hiểu HTML, CSS và JavaScript. Trong khi đó, code của dự án lại viết như sau:

```tsx
<GameScreen deck={selectedDeck} onBack={() => setSelectedDeckId(null)} />
```

Dòng này dùng JSX, còn cả file dùng TypeScript. Trình duyệt không chạy được cả hai. Vì thế cần một chuỗi công cụ để biến code bạn viết thành code trình duyệt hiểu:

```text
Bạn viết                 Công cụ xử lý                  Trình duyệt nhận
────────────             ─────────────                  ────────────────
*.tsx, *.ts      ──────► Vite + plugin React   ───────► JavaScript
class Tailwind   ──────► Plugin Tailwind       ───────► CSS
import 'react'   ──────► Vite (lấy từ npm)     ───────► JavaScript của React

Song song, không tạo ra file nào:
*.ts, *.tsx      ──────► tsc (TypeScript)      ───────► báo lỗi kiểu
*.ts, *.tsx      ──────► oxlint                ───────► báo lỗi quy tắc
```

Hãy nhớ phần cuối của sơ đồ: **`tsc` và `oxlint` chỉ kiểm tra chứ không tạo ra code chạy.** Việc biến đổi code là của Vite.

## 2. `package.json`: bản khai của dự án

Mở [package.json](../package.json) và đọc theo từng khối.

### Thông tin chung

```json
"name": "connect-card-game",
"private": true,
"version": "0.0.0",
"type": "module",
```

- `private: true`: npm sẽ từ chối publish dự án này lên kho công khai. Đây là một app chứ không phải thư viện.
- `type: module`: các file `.js` được hiểu theo chuẩn ES module, tức là dùng `import` và `export`.

### Scripts: các lệnh tắt

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "oxlint",
  "preview": "vite preview"
}
```

`npm run dev` chỉ đơn giản là chạy lệnh `vite`. Lệnh này chạy được vì `npm run` tự thêm `node_modules/.bin` vào đường dẫn tìm lệnh, và `vite` nằm sẵn ở đó. [Tài liệu 02](02-Q&A.md) đã giải thích chi tiết sự khác nhau giữa `dev` và `build`.

### Dependencies: các thư viện

| Thư viện | Vai trò | Dùng ở đâu |
|---|---|---|
| `react` | Lõi: component, state, hook | Mọi component |
| `react-dom` | Đưa kết quả của React lên trang web | [main.tsx:2](../src/main.tsx#L2) |
| `motion` | Animation | `import ... from 'motion/react'` |
| `tailwindcss` và `@tailwindcss/vite` | Sinh CSS từ class | [index.css:2](../src/index.css#L2), [vite.config.ts:1](../vite.config.ts#L1) |
| `clsx` | Ghép class có điều kiện | Không dùng ở đâu, có thể gỡ |

`react` và `react-dom` tách riêng vì lõi React không gắn với trình duyệt. React Native dùng cùng lõi đó nhưng vẽ ra giao diện điện thoại, còn `react-dom` là phần chuyên vẽ ra DOM.

**`dependencies` và `devDependencies` khác nhau thế nào?** Về nguyên tắc, `devDependencies` chứa công cụ chỉ cần lúc phát triển, như `typescript` hay `oxlint`. Với app frontend, ranh giới này chỉ mang tính quy ước, vì Vite đóng gói vào `dist/` những gì code thực sự `import`, bất kể thư viện nằm ở khối nào. Chẳng hạn `tailwindcss` nằm trong `dependencies` nhưng thực chất chỉ chạy lúc build.

### Ký hiệu phiên bản

```json
"react": "^19.2.8",
"typescript": "~6.0.2",
```

| Ký hiệu | Nghĩa | Ví dụ |
|---|---|---|
| `^19.2.8` | Từ 19.2.8 đến trước 20.0.0 | Máy này đang cài `19.3.0` |
| `~6.0.2` | Từ 6.0.2 đến trước 6.1.0 | Máy này đang cài `6.0.3` |

### `package-lock.json`: sổ ghi chính xác

`package.json` chỉ nêu khoảng phiên bản chấp nhận được. Còn `package-lock.json` ghi lại **chính xác** phiên bản của mọi thư viện đã cài, kể cả thư viện gián tiếp. Nhờ vậy, ai clone dự án cũng cài ra đúng cùng một bộ. Bạn không sửa file này bằng tay, nhưng phải commit nó.

### `node_modules/`

Đây là nơi `npm install` tải thư viện về. Thư mục này có thể tạo lại bất cứ lúc nào từ hai file trên, nên nó bị loại khỏi git.

## 3. `vite.config.ts`: cấu hình Vite

```ts
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
  },
})
```

Tuy ngắn, file này quyết định khá nhiều thứ:

- **`react()`** dạy Vite dịch JSX sang JavaScript và bật Fast Refresh, tức là sửa component thì trang cập nhật mà thường vẫn giữ được state.
- **`tailwindcss()`** quét code để tìm các class đang dùng, rồi chỉ sinh CSS cho những class đó.
- **`host: true`** cho dev server lắng nghe trên mọi địa chỉ mạng của máy, không chỉ `localhost`. Nhờ vậy điện thoại cùng Wi-Fi mới mở được app.

`defineConfig` không làm gì ở lúc chạy. Hàm này chỉ giúp trình soạn thảo gợi ý đúng các tùy chọn.

## 4. Ba file `tsconfig`

Dự án có hai môi trường chạy khác nhau, nên cần hai bộ luật:

```text
tsconfig.json            File gốc, không tự kiểm tra gì. Chỉ trỏ tới hai file dưới
├── tsconfig.app.json    Code trong src/, chạy trên TRÌNH DUYỆT (có window, document)
└── tsconfig.node.json   vite.config.ts, chạy trên NODE (không có window)
```

Đó là lý do [tsconfig.app.json:5](../tsconfig.app.json#L5) có `"lib": ["ES2023", "DOM"]`, còn [tsconfig.node.json:5](../tsconfig.node.json#L5) không có `DOM`. Nếu bạn viết `document.title` trong `vite.config.ts`, TypeScript sẽ báo lỗi, và lỗi đó đúng vì Node không có `document`.

Vì sao phải tách thành hai bộ luật thay vì dùng chung một file cấu hình? Có thể hiểu qua ba điểm sau:

1. **Hai môi trường chạy hoàn toàn khác nhau.** Trong dự án dùng Vite, code được chia làm hai nhóm:
   - **Code trong `src/`** chạy trên trình duyệt của người dùng, nơi có `window`, `document` và các thẻ HTML.
   - **File cấu hình như `vite.config.ts`** chạy trên **Node.js**, tức môi trường máy chủ (máy đang chạy lệnh `dev` hoặc `build`), nơi không có `window` hay `document`.
2. **Bộ luật phải khớp với môi trường.** TypeScript cần biết code chạy ở đâu để quyết định API nào được phép dùng:
   - `tsconfig.app.json` có thêm `DOM` trong `"lib"`, nên bạn gọi được các API của trình duyệt như `document.getElementById` hay `window.localStorage`.
   - `tsconfig.node.json` không có `DOM`, vì Node.js không có các API đó.
3. **Ví dụ thực tế: `document.title`.** Nếu bạn vô tình gõ `document.title = "Trang chủ"` trong `vite.config.ts`, TypeScript sẽ báo lỗi ngay. Lỗi này hoàn toàn đúng, vì Node.js không có trang web nào để đổi tiêu đề.

Nhờ tách hai file cấu hình, những lỗi như vậy được phát hiện ngay lúc gõ code, thay vì đến lúc chạy thật mới bị crash.

`tsc -b` trong lệnh `build` có nghĩa là "build theo các tham chiếu", tức là kiểm tra cả hai bộ. Dưới đây là những tùy chọn sẽ ảnh hưởng trực tiếp tới code bạn đọc trong các bài sau:

| Tùy chọn | Hệ quả bạn sẽ thấy trong code |
|---|---|
| `"jsx": "react-jsx"` | Không cần viết `import React from 'react'` ở đầu mỗi file có JSX |
| `"noEmit": true` | `tsc` chỉ kiểm tra, không sinh file. Vite lo việc dịch |
| `"verbatimModuleSyntax": true` | Import chỉ dùng cho kiểu phải viết `import type`, ví dụ [DeckSelector.tsx:2](../src/components/DeckSelector.tsx#L2) |
| `"erasableSyntaxOnly": true` | Cấm cú pháp TS sinh ra code chạy, như `enum`. Vì thế dự án dùng union `'ordered' \| 'shuffled'` |
| `"allowImportingTsExtensions": true` | Cho phép ghi đuôi file khi import, như `'./App.tsx'` ở [main.tsx:4](../src/main.tsx#L4) |
| `"noUnusedLocals"`, `"noUnusedParameters"` | Biến hoặc tham số không dùng tới sẽ làm `npm run build` thất bại |
| `"types": ["vite/client"]` | TypeScript hiểu các import đặc thù của Vite như `import './index.css'` |

Đáng chú ý là `tsconfig.app.json` **không bật `"strict": true`** nhưng code vẫn được kiểm tra ở chế độ nghiêm ngặt. Lý do là TypeScript 6 đã bật `strict` theo mặc định. Đó là lý do [main.tsx:6](../src/main.tsx#L6) phải viết dấu `!`. Bạn sẽ gặp lại nó ở bài sau.

## 5. `.oxlintrc.json`: linter

TypeScript kiểm tra kiểu, còn linter kiểm tra những cách viết dễ gây lỗi. Hai luật được khai báo tường minh đều liên quan tới React:

- **`react/rules-of-hooks`** (mức error): hook phải được gọi ở cấp trên cùng của component, không nằm trong `if` hay vòng lặp. [Tài liệu 05](05-tu-duy-react-qua-app.md#6-hai-quy-tắc-của-hook) giải thích lý do.
- **`react/only-export-components`** (mức warning): file component nên chỉ export component, để Fast Refresh hoạt động ổn định.

Bạn sẽ thấy dòng này trong [GameScreen.tsx:27](../src/components/GameScreen.tsx#L27) và [useDeckQueue.ts:54](../src/hooks/useDeckQueue.ts#L54):

```ts
// eslint-disable-next-line react-hooks/exhaustive-deps
```

Dòng này dành cho ESLint, một linter mà dự án không dùng. Tôi đã xóa cả hai dòng rồi chạy `oxlint src` và nó không báo gì, nghĩa là với cấu hình hiện tại, luật `exhaustive-deps` không được thực thi. Các comment này giờ chỉ có tác dụng ghi chú cho người đọc rằng mảng dependency được cố ý viết thiếu.

## 6. Hai thứ còn lại

**`.gitignore`** liệt kê những gì git bỏ qua, quan trọng nhất là `node_modules` và `dist`. Cả hai đều được sinh ra từ code nguồn, nên không cần lưu.

**`public/`** chứa file được chép nguyên trạng vào `dist/`, không qua xử lý. Vì vậy `/favicon.svg` trong `index.html` trỏ thẳng tới [public/favicon.svg](../public/favicon.svg). Nếu cần một ảnh mà code import trực tiếp, bạn nên đặt nó trong `src/`, vì khi đó Vite sẽ xử lý và thêm mã băm vào tên file.

## Thử ngay

1. Chạy `npm ls --depth=0` để xem các thư viện trực tiếp cùng phiên bản đang cài, rồi đối chiếu với `package.json`.
2. Mở [vite.config.ts](../vite.config.ts), đổi `host: true` thành `host: false`, khởi động lại `npm run dev`. Dòng `Network:` trong terminal sẽ biến mất. Nhớ đổi lại sau khi thử.
3. Thêm dòng `const x: number = 'abc'` vào `App.tsx`. `npm run dev` vẫn chạy, nhưng `npx tsc -b` báo lỗi. Đây là minh chứng cho việc Vite không kiểm tra kiểu.

## Tự kiểm tra

<details>
<summary>1. Nếu xóa <code>node_modules</code> thì mất gì? Làm sao khôi phục?</summary>

Không mất gì quan trọng. Chạy `npm install` là có lại đúng các phiên bản đã ghi trong `package-lock.json`.
</details>

<details>
<summary>2. Vì sao cần ba file <code>tsconfig</code> thay vì một?</summary>

Vì code trong `src/` chạy trên trình duyệt, còn `vite.config.ts` chạy trên Node. Hai môi trường có API khác nhau, nên cần hai bộ luật. `tsconfig.json` chỉ là file gom hai bộ đó lại.
</details>

<details>
<summary>3. Vì sao code sai kiểu vẫn chạy được ở <code>npm run dev</code>?</summary>

Khi dev, Vite chỉ gỡ bỏ phần kiểu rồi chạy phần JavaScript còn lại, chứ không kiểm tra kiểu. Lỗi chỉ lộ ra khi `tsc` chạy, tức là trong `npm run build` hoặc khi bạn gọi `tsc` trực tiếp.
</details>

---

**Bài tiếp theo:** [04. Khởi động app](04-khoi-dong-app.md)
