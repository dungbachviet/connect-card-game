# Tâm Giao — Bộ bài kết nối

Web app chơi bài "kết nối" (conversation cards) trên điện thoại hoặc máy tính. Chọn một bộ bài theo mục đích (Bạn Mới, Tình Bạn, Kết Nối Sâu, Tình Yêu), rút ngẫu nhiên một lá, và trả lời câu hỏi trước nhóm.

## Chạy thử

```bash
npm install
npm run dev
```

Mở địa chỉ `http://localhost:5173` trên máy tính.

### Mở trên điện thoại

Dev server đã bật `host: true`, nên khi chạy `npm run dev`, terminal sẽ in thêm một địa chỉ dạng:

```
Network: http://192.168.x.x:5173/
```

Đảm bảo điện thoại và máy tính cùng một mạng Wi-Fi, mở trình duyệt trên điện thoại và nhập địa chỉ đó.

## Build production

```bash
npm run build
npm run preview   # xem thử bản build
```

## Cấu trúc

- `src/data/decks.ts` — nội dung các bộ bài (thêm/sửa câu hỏi hoặc thêm bộ bài mới tại đây).
- `src/hooks/useDeckQueue.ts` — logic rút bài ngẫu nhiên không lặp lại, tự xáo khi hết bộ, lưu tiến trình vào `localStorage`.
- `src/components/DeckSelector.tsx` — màn hình chọn bộ bài.
- `src/components/GameScreen.tsx` — màn hình chơi (rút bài, hiệu ứng lật thẻ, tiến trình).
- `src/components/PlayingCard.tsx` — component thẻ bài với hiệu ứng lật 3D.

## Thêm bộ bài mới

Thêm một object vào mảng `decks` trong `src/data/decks.ts` với `id`, `title`, `tagline`, `description`, `emoji`, màu `from`/`to`/`glow`/`textOnAccent`, và mảng `questions`. Giao diện sẽ tự động hiển thị bộ bài mới ở màn hình chọn.

## Triển khai (deploy)

Đây là một static site (Vite build ra `dist/`), có thể deploy miễn phí lên Vercel, Netlify, hoặc GitHub Pages để cả nhóm truy cập qua một đường link chung thay vì cùng mạng Wi-Fi.
