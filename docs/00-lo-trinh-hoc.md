# 00. Lộ trình học React qua dự án Tâm Giao

Bộ tài liệu này đưa bạn đi từ ngoài vào trong: từ công cụ bao quanh dự án, qua điểm khởi động, rồi tới từng component và hook. Mỗi tài liệu chỉ dùng những gì các tài liệu trước đã giải thích, nên hãy đọc theo đúng thứ tự.

Sau khi đọc xong, bạn sẽ có thể tự vẽ lại kiến trúc app, giải thích từng dòng code và lý do nó được viết như vậy, đồng thời biết điểm yếu của code nằm ở đâu.

## Thứ tự đọc

| # | Tài liệu | File được giải thích | Khái niệm chính |
|---|---|---|---|
| 01 | [Tổng quan](01-overview.md) | Cả dự án | App làm gì, giao diện, cách chạy |
| 02 | [Hỏi đáp: dev và build](02-Q&A.md) | `package.json` (phần scripts) | Hai chế độ chạy |
| 03 | [Lớp vỏ dự án](03-lop-vo-du-an.md) | `package.json`, `vite.config.ts`, `tsconfig*.json`, `.oxlintrc.json`, `.gitignore`, `public/` | npm, Vite, TypeScript, lint |
| 04 | [Khởi động app](04-khoi-dong-app.md) | `index.html`, `main.tsx`, `index.css` | SPA, ES module, `createRoot`, `StrictMode` |
| 05 | [Tư duy React qua App](05-tu-duy-react-qua-app.md) | `App.tsx` | JSX, render, `useState`, `key`, vòng đời |
| 06 | [Dữ liệu và TypeScript](06-du-lieu-va-typescript.md) | `decks.ts`, `halloween.ts` | Kiểu dữ liệu, data-driven UI |
| 07 | [DeckSelector](07-deck-selector.md) | `DeckSelector.tsx` | Props, `.map()`, callback, Tailwind, Motion |
| 08 | [PlayingCard](08-playing-card.md) | `PlayingCard.tsx` | Component trình bày, lật thẻ 3D |
| 09 | [useDeckQueue](09-use-deck-queue.md) | `useDeckQueue.ts` | State bất biến, `useEffect`, custom hook |
| 10 | [GameScreen](10-game-screen.md) | `GameScreen.tsx` | `useRef`, closure, điều phối bất đồng bộ |
| 11 | [HalloweenDecor](11-halloween-decor.md) | `HalloweenDecor.tsx` | SVG, keyframes, giảm chuyển động |
| 12 | [useCardSound](12-use-card-sound.md) | `useCardSound.ts` | Web Audio, code ngoài React |
| 13 | [Tổng hợp](13-tong-hop.md) | Cả dự án | Theo dấu một cú click, điểm yếu, bài thi cuối |

Tài liệu 09 và 10 là phần quan trọng nhất. Nếu hiểu rõ hai tài liệu này, bạn đã nắm được phần lớn những gì React đòi hỏi ở một người mới. Tài liệu 11 và 12 thiên về kỹ thuật trình duyệt hơn là React, nên có thể đọc lướt lần đầu.

## Bản đồ từ ngoài vào trong

```text
Lớp 1: Công cụ            package.json, vite, tsconfig, oxlint         → 03
Lớp 2: Khởi động          index.html → main.tsx → App.tsx              → 04, 05
Lớp 3: Dữ liệu            decks.ts, halloween.ts                       → 06
Lớp 4: Giao diện đơn giản DeckSelector, PlayingCard                    → 07, 08
Lớp 5: Logic              useDeckQueue                                 → 09
Lớp 6: Ghép nối           GameScreen                                   → 10
Lớp 7: Phần trang trí     HalloweenDecor, useCardSound                 → 11, 12
Tổng kết                  Một cú click đi qua mọi lớp                  → 13
```

## Cách đọc để hiểu thật sự

1. **Mở song song ba thứ:** tài liệu, file code đang bàn, và app đang chạy bằng `npm run dev`.
2. **Làm phần "Thử ngay".** Đây là cách nhanh nhất để hiểu vai trò của một dòng code: sửa hoặc xóa nó rồi xem app hỏng ra sao. Những chỗ ghi "tôi đã thử" hoặc "kiểm chứng" đã được chạy thật trên một bản sao của app, bằng Chromium. Các kết quả còn lại được suy ra từ code, nên hãy tự đối chiếu. Riêng phần âm thanh và iOS trong bài 12 chưa được nghe hay thử trên thiết bị thật.
3. **Tự trả lời "Tự kiểm tra" trước khi mở đáp án.** Nếu không trả lời được, hãy đọc lại phần tương ứng rồi mới đi tiếp.

Sau mỗi thí nghiệm, hãy khôi phục code bằng lệnh dưới đây. **Lệnh này xóa mọi thay đổi chưa commit trong `src/`**, nên nếu bạn đang có code muốn giữ, hãy commit trước:

```bash
git restore src
```

## Bạn cần biết gì trước khi bắt đầu

Bạn cần biết JavaScript cơ bản: biến, hàm, mảng, object và câu lệnh `if`. Những cú pháp mới hơn như destructuring, spread hay arrow function sẽ được giải thích ở nơi chúng xuất hiện lần đầu. Bạn không cần biết trước React hay TypeScript.

## Tìm nhanh theo khái niệm

| Khái niệm | Đọc ở đâu |
|---|---|
| JSX và cách nó biến thành JavaScript | [05](05-tu-duy-react-qua-app.md#3-jsx-thực-chất-là-gì) |
| `useState`, render, commit | [05](05-tu-duy-react-qua-app.md#4-usestate-và-chu-trình-render) |
| `key` và vòng đời component | [05](05-tu-duy-react-qua-app.md#7-key-danh-tính-của-một-component) |
| Props và callback | [07](07-deck-selector.md#1-props-hợp-đồng-giữa-cha-và-con) |
| `.map()` và `key` trong danh sách | [07](07-deck-selector.md#2-vẽ-danh-sách-bằng-map) |
| Tailwind CSS | [07](07-deck-selector.md#4-tailwind-css-đọc-class-như-đọc-câu) |
| Motion (animation) | [07](07-deck-selector.md#5-motion-animation-khai-báo) và [08](08-playing-card.md) |
| State bất biến, updater function | [09](09-use-deck-queue.md#5-các-hành-động-và-updater-function) |
| `useEffect` | [09](09-use-deck-queue.md#4-hai-useeffect) và [10](10-game-screen.md#3-useeffect-chốt-của-cả-quy-trình) |
| `useCallback` | [09](09-use-deck-queue.md#6-usecallback-để-làm-gì) |
| Custom hook | [09](09-use-deck-queue.md#8-hook-này-dạy-gì-về-custom-hook) |
| `useRef` | [10](10-game-screen.md#2-useref-vì-sao-pending-không-phải-state) |
| Stale closure | [10](10-game-screen.md#5-stale-closure-một-lỗi-nhỏ-có-thật-trong-code) |
