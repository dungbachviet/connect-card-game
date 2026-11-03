# 11. `HalloweenDecor`: SVG và animation lặp

**File trong bài:** [src/components/HalloweenDecor.tsx](../src/components/HalloweenDecor.tsx)

**Sau bài này, bạn sẽ hiểu:** cách vẽ hình bằng SVG, cách tạo hình bằng code, cách làm animation nhiều bước lặp vô hạn, và cách tôn trọng cài đặt giảm chuyển động của người dùng.

Component này không có logic trò chơi nào, và app vẫn chơi được bình thường nếu bỏ nó đi. Vì vậy đây là bài thư giãn. Lần đọc đầu bạn có thể đọc lướt phần toán.

## 1. Một lớp nền không cản trở gì

```tsx
<div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
```

Mỗi class giải quyết một yêu cầu của lớp trang trí:

| Class | Tác dụng |
|---|---|
| `fixed inset-0` | Phủ kín cửa sổ, không cuộn theo trang |
| `z-0` | Nằm dưới nội dung có `z-10` |
| `pointer-events-none` | Mọi cú click đi xuyên qua, tới các nút phía sau |
| `overflow-hidden` | Dơi bay ra ngoài không làm xuất hiện thanh cuộn |
| `aria-hidden` | Trình đọc màn hình bỏ qua toàn bộ |

`App` đặt nó **ngoài** `AnimatePresence`:

```tsx
{HALLOWEEN && <HalloweenDecor />}
<AnimatePresence mode="wait">...</AnimatePresence>
```

Vì nằm ngoài, nó không bị mount lại khi chuyển màn hình, nên dơi tiếp tục bay liền mạch thay vì bay lại từ đầu.

## 2. Vẽ mạng nhện bằng code

### SVG trong 60 giây

SVG mô tả hình bằng tọa độ, không phải bằng điểm ảnh, nên phóng to không bị vỡ. Trong JSX, bạn viết SVG giống các thẻ khác:

```tsx
<svg viewBox="0 0 130 130" className="..." fill="none">
  <path d="M0 0L130 0" stroke="currentColor" strokeWidth="0.9" />
</svg>
```

- **`viewBox="0 0 130 130"`**: hệ tọa độ bên trong rộng 130 đơn vị. Kích thước thật do CSS quyết định, ví dụ `h-32 w-32`. Hình tự co giãn theo.
- **`d`**: chuỗi lệnh vẽ. Trong file này chỉ dùng ba lệnh:

| Lệnh | Ý nghĩa |
|---|---|
| `M x y` | Nhấc bút, di chuyển tới điểm (x, y) |
| `L x y` | Kẻ đường thẳng tới (x, y) |
| `Q cx cy x y` | Kẻ đường cong tới (x, y), bị kéo về phía điểm điều khiển (cx, cy) |

- **`stroke="currentColor"`**: màu nét lấy theo màu chữ CSS hiện tại. Nhờ vậy, class `text-zinc-300/25` có thể tô màu cho hình vẽ. Đây là cách làm một icon đổi được màu.

### Hàm `webPath`

Mạng nhện được tính bằng lượng giác thay vì vẽ tay ([dòng 7-24](../src/components/HalloweenDecor.tsx#L7-L24)):

```text
Gốc (0,0) ở góc trên trái, là góc của cửa sổ
●──────────────── tia 1 (0°)
│╲  ⌒ ⌒ ⌒
│ ╲ ╲   vòng cong nối giữa các tia, võng vào trong
│  ╲  ╲
│   tia 2, 3, 4, 5
tia 6 (90°)
```

```ts
const angles = Array.from({ length: SPOKES }, (_, i) => (Math.PI / 2) * (i / (SPOKES - 1)))
const point = (r: number, a: number) => [r * Math.cos(a), r * Math.sin(a)] as const
```

- `angles`: 6 góc chia đều từ 0° đến 90°, tức 0°, 18°, 36°, 54°, 72°, 90°.
- `point`: đổi tọa độ cực (bán kính, góc) sang tọa độ thường (x, y).
- `as const`: báo cho TypeScript rằng đây là một bộ đúng hai phần tử, thay vì một mảng có độ dài bất kỳ.

Hàm có hai vòng lặp. Vòng đầu kẻ 6 tia từ gốc. Vòng sau, với mỗi trong 5 bán kính của `RINGS`, nối từng cặp tia kề nhau bằng một đường cong:

```ts
const [cx, cy] = point(r * 0.82, (angles[i] + angles[i + 1]) / 2)
```

Điểm điều khiển nằm ở góc giữa hai tia, và ở bán kính 82% so với vòng, nên đường cong **võng vào trong**. Chính độ võng này làm hình trông giống mạng nhện thật. Tổng cộng có 5 × 5 = 25 đường cong.

`.toFixed(1)` làm tròn tọa độ, giúp chuỗi `d` ngắn gọn hơn.

### Tính một lần, ngoài component

```ts
const WEB_D = webPath()
```

Dòng này nằm ở cấp module. Nó chạy **đúng một lần** khi file được nạp, và mọi `SpiderWeb` dùng chung kết quả. Nếu đặt trong component, phép tính sẽ lặp lại ở mỗi lần render. Hãy để ý mẫu này: **giá trị không phụ thuộc vào props hay state thì đặt ngoài component.** `SPOKES`, `RINGS`, `BATS` cũng theo mẫu đó.

### Component `SpiderWeb`

```tsx
export function SpiderWeb({ className, flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg
      viewBox={`0 0 ${WEB_SIZE} ${WEB_SIZE}`}
      className={className}
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
      ...
```

Có ba điểm đáng học:

- Kiểu props có thể viết ngay trong dòng khai báo, thay cho interface riêng, khi component đủ nhỏ.
- Nhận `className` từ cha cho phép cha quyết định vị trí, kích thước và màu, nên cùng một component dùng được ở cả 4 chỗ.
- `flip` lật ngang hình bằng CSS. Nhờ đó không cần tính lại tọa độ cho mạng nhện ở góc phải.

## 3. Các loại animation

### Mảng keyframes

Khi giá trị trong `animate` là mảng, Motion lần lượt đi qua từng giá trị:

```tsx
<motion.span
  animate={reduceMotion ? undefined : { rotate: [-4, 4, -4] }}
  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
>
  🎃
</motion.span>
```

Trái bí ngô lắc từ -4° sang 4° rồi về -4°, mất 4 giây, lặp vô hạn. Vì điểm đầu và điểm cuối giống nhau, vòng lặp liền mạch, không bị giật.

### Con nhện đung đưa

```tsx
<motion.div
  style={{ originY: 0 }}
  animate={reduceMotion ? undefined : { y: [0, 36, 0], rotate: [-3, 3, -3] }}
```

`originY: 0` đặt tâm xoay ở **đỉnh** của phần tử, nên con nhện đu đưa từ điểm treo như một quả lắc thật. Nếu tâm xoay nằm ở giữa theo mặc định, sợi tơ sẽ xoay quanh khúc giữa.

### Dơi bay: mỗi trục một nhịp

```ts
const BATS = [
  { top: '12%', size: 'w-10', duration: 18, delay: 0, drift: 40 },
  ...
]
```

Bốn con dơi được khai báo bằng dữ liệu, mỗi con có độ cao, kích cỡ, tốc độ, độ trễ, độ dao động khác nhau, để trông không máy móc. Đây là ý tưởng data-driven ở [bài 06](06-du-lieu-va-typescript.md#4-giao-diện-được-sinh-ra-từ-dữ-liệu), được áp dụng cho animation.

```tsx
initial={{ x: '-15vw' }}
animate={{ x: '115vw', y: [0, -bat.drift, bat.drift / 2, -bat.drift / 2, 0] }}
transition={{
  x: { duration: bat.duration, delay: bat.delay, repeat: Infinity, ease: 'linear' },
  y: { duration: bat.duration / 2, delay: bat.delay, repeat: Infinity, ease: 'easeInOut' },
}}
```

`transition` có thể cấu hình riêng cho từng thuộc tính:

- **Trục x**: bay đều (`linear`) từ ngoài cửa sổ bên trái sang ngoài cửa sổ bên phải. Giá trị `vw` là phần trăm chiều rộng cửa sổ, nên chạy đúng trên mọi màn hình.
- **Trục y**: nhấp nhô mềm mại, với chu kỳ bằng nửa trục x, nên mỗi lần bay ngang sẽ lượn sóng hai lần.

### Vỗ cánh: animation lồng nhau

```tsx
<motion.div ...bay...>
  <motion.div animate={{ scaleY: [1, 0.45, 1] }} transition={{ duration: 0.35, repeat: Infinity, ... }}>
    <Bat className="w-full text-zinc-950" />
  </motion.div>
</motion.div>
```

Hai `motion.div` lồng nhau tách hai chuyển động độc lập: lớp ngoài bay, lớp trong vỗ cánh rất nhanh. Bóp chiều dọc của SVG xuống 45% tạo cảm giác cánh đang đập, mà không cần vẽ nhiều khung hình. Đây là thủ thuật rẻ nhưng hiệu quả.

## 4. Tôn trọng người dùng: `useReducedMotion`

```tsx
const reduceMotion = useReducedMotion()
```

Một số người bị chóng mặt khi có nhiều chuyển động, và hệ điều hành có tùy chọn để giảm chuyển động. Hook của Motion đọc tùy chọn đó, và component phản ứng như sau:

```tsx
animate={reduceMotion ? undefined : { ... }}   // Con nhện, bí ngô: đứng yên
{!reduceMotion && BATS.map(...)}               // Dơi: không render
```

Đây là một lý do nữa cho thấy cách viết khai báo hữu ích: tắt animation chỉ cần đổi một giá trị.

Lưu ý rằng chỉ `HalloweenDecor` xử lý cài đặt này. Lá bài vẫn lật và các phần khác vẫn chuyển động.

## 5. Vì sao file này export hai component?

`HalloweenDecor` và `SpiderWeb` đều được export, còn `Bat` thì không. `SpiderWeb` được `PlayingCard` dùng lại, còn `Bat` chỉ dùng trong file này. Một quy tắc đơn giản: chỉ export những gì nơi khác cần.

Mối phụ thuộc này cũng có nghĩa là `PlayingCard` phụ thuộc vào một file có tên Halloween. Tôi đã thử build với `HALLOWEEN = false`: phần code của dơi và nhện được công cụ build loại khỏi file JS, nhưng hàm `webPath` vẫn ở lại, vì `WEB_D` được tính ở cấp module nên công cụ build không dám xóa.

## Thử ngay

1. Đổi `SPOKES = 6` thành `10`, và `r * 0.82` thành `r * 1.1`. Đường cong sẽ phồng ra ngoài thay vì võng vào trong.
2. Đổi `originY: 0` thành `originY: 0.5`. Con nhện sẽ không còn đu đưa từ điểm treo.
3. Mở DevTools, nhấn `Cmd+Shift+P`, gõ "reduced motion", chọn **Emulate CSS prefers-reduced-motion: reduce**, rồi tải lại trang. Dơi sẽ biến mất, nhện và bí ngô đứng yên.
4. Tìm thẻ `<path>` của mạng nhện trong tab Elements và đọc chuỗi `d`. Bạn sẽ thấy đúng các lệnh `M`, `L`, `Q` đã học.
5. Thêm một con dơi mới vào mảng `BATS`. Bạn không cần sửa JSX. Lưu ý là kích cỡ phải viết nguyên dạng như `'w-12'` để Tailwind nhận ra.

## Tự kiểm tra

<details>
<summary>1. Vì sao dơi vẫn bay liền mạch khi chuyển từ màn chọn bài sang màn chơi?</summary>

Vì `HalloweenDecor` nằm ngoài `AnimatePresence`, cùng vị trí và cùng loại qua các lần render của `App`, nên không bị unmount.
</details>

<details>
<summary>2. <code>WEB_D</code> được tính bao nhiêu lần trong suốt phiên chơi?</summary>

Một lần, khi module được nạp. Nó nằm ngoài component nên không chạy lại khi render.
</details>

<details>
<summary>3. Vì sao lớp vỗ cánh phải là một <code>motion.div</code> riêng?</summary>

Để tách hai chuyển động với hai nhịp khác nhau thành hai lớp, cho code đơn giản và dễ chỉnh. Lớp ngoài lo vị trí, lớp trong lo biến dạng.
</details>

<details>
<summary>4. Nếu bỏ <code>pointer-events-none</code> thì sao?</summary>

Hiện tại không có gì hỏng. Tôi đã thử bỏ nó và các nút vẫn bấm được, vì màn hình chính nằm phía trên lớp nền. Thuộc tính này là một lớp bảo hiểm: nó đảm bảo lớp trang trí không bao giờ chặn click, kể cả khi sau này ai đó đổi `z-index` của các lớp khác.
</details>

---

**Bài tiếp theo:** [12. useCardSound](12-use-card-sound.md)
