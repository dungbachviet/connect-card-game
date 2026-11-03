# 08. `PlayingCard`: một component chỉ biết hiển thị

**File trong bài:** [src/components/PlayingCard.tsx](../src/components/PlayingCard.tsx)

**Sau bài này, bạn sẽ hiểu:** mô hình component trình bày, cách một giá trị boolean điều khiển animation, và kỹ thuật lật thẻ 3D.

## 1. Vai trò: nhận lệnh, không ra quyết định

```tsx
interface PlayingCardProps {
  deck: Deck                // Màu sắc, tên, emoji
  question: string | null   // Câu hỏi in trên mặt sau
  revealed: boolean         // Đang ngửa hay úp?
  onDraw: () => void        // Báo cho cha: "người dùng vừa bấm"
}
```

Lá bài không có `useState` và không biết gì về rút bài, bộ bài còn bao nhiêu lá, hay âm thanh. Nó chỉ làm hai việc:

- Hiển thị theo props: `revealed` là `true` thì ngửa, `false` thì úp.
- Báo sự kiện: bị bấm thì gọi `onDraw`.

Chính cha quyết định khi nào lật. Đây gọi là **component trình bày** (presentational component), và cách làm này có ích lợi lớn: để biết giao diện lá bài ra sao, bạn chỉ cần biết props của nó. Khi có lỗi logic, bạn biết chắc lỗi không nằm ở đây.

## 2. Cách lật 3D hoạt động

Lá bài có ba lớp lồng nhau. Mỗi lớp giữ một vai trò riêng:

```text
<div>  perspective: 1800px                 "Vị trí mắt nhìn": tạo cảm giác xa gần
 └─ <motion.button>  transform-style: preserve-3d    Thân lá bài: lớp này xoay
      ├─ <div>  Mặt trước (bìa)     rotateY = 0°      backface-visibility: hidden
      └─ <div>  Mặt sau (câu hỏi)   rotateY = 180°    backface-visibility: hidden
```

Mỗi thuộc tính CSS giải quyết một vấn đề cụ thể:

| Thuộc tính | Nếu thiếu thì sao |
|---|---|
| `perspective` trên phần tử cha ([dòng 17](../src/components/PlayingCard.tsx#L17)) | Vẫn xoay, nhưng trông như thẻ bị bóp hẹp lại, không có chiều sâu |
| `transformStyle: 'preserve-3d'` ([dòng 23](../src/components/PlayingCard.tsx#L23)) | Hai mặt bị ép phẳng vào thân, không còn hai mặt thật trong không gian 3D |
| `backfaceVisibility: 'hidden'` ([dòng 33](../src/components/PlayingCard.tsx#L33), [dòng 66](../src/components/PlayingCard.tsx#L66)) | Nhìn xuyên được mặt lưng: thấy cả chữ bị đảo ngược |
| `transform: 'rotateY(180deg)'` ở mặt sau ([dòng 67](../src/components/PlayingCard.tsx#L67)) | Mặt câu hỏi nằm cùng hướng với bìa, và khi lật lại sẽ quay lưng về phía bạn |
| `absolute inset-0` ở hai mặt | Hai mặt xếp dọc thay vì chồng lên nhau |

### Cộng góc: vì sao lá bài luôn đúng chiều

Hãy cộng góc của thân lá bài với góc của từng mặt. Mặt nào có tổng là 0° hoặc 360° sẽ quay về phía bạn:

| `revealed` | Góc thân | Mặt trước (+0°) | Mặt sau (+180°) | Bạn thấy |
|---|---|---|---|---|
| `false` | 0° | 0° (hướng về bạn) | 180° (quay lưng, bị ẩn) | Bìa |
| `true` | 180° | 180° (quay lưng, bị ẩn) | 360° (hướng về bạn) | Câu hỏi |

Câu hỏi không bị ngược vì nó đã được xoay sẵn 180°, và cú lật 180° nữa đưa nó về đúng 360°.

## 3. Boolean điều khiển animation

Toàn bộ chuyển động được khai báo ở một dòng ([dòng 24](../src/components/PlayingCard.tsx#L24)):

```tsx
animate={{ rotateY: revealed ? 180 : 0 }}
transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
```

Không có lệnh `flip()` nào cả. Khi `revealed` đổi, `animate` nhận giá trị mới và Motion tự chuyển từ góc hiện tại sang góc đích. Đúng với công thức `Giao diện = f(state)`, ngay cả chuyển động cũng được mô tả theo state.

Nếu `revealed` đổi trong lúc thẻ đang xoay, Motion chuyển tiếp từ góc hiện tại chứ không giật về đầu. Đây là điểm cộng lớn so với việc tự viết animation.

### Đường cong `[0.22, 1, 0.36, 1]`

Bốn số này định nghĩa đường cong tốc độ dạng `cubic-bezier`. Đường cong này rất nhanh ở đầu và chậm dần về cuối. Tôi đã tính thử với thời lượng 650ms của dự án:

| Thời điểm | Góc đã xoay | Bạn thấy gì |
|---|---|---|
| 50ms | 57,5° | Đang lật |
| **85ms** | **90°** | **Thẻ nằm ngang, hai mặt đổi chỗ** |
| 100ms | 101,6° | Mặt kia đã hiện ra |
| 200ms | 151,3° | Gần xong |
| 340ms | 174,2° | Chỉ còn lệch rất ít |
| 650ms | 180° | Dừng hẳn |

Điều này rất quan trọng cho bài sau: **chỉ sau 85ms, mặt câu hỏi đã bị che hoàn toàn**, dù cả animation kéo dài 650ms. Hằng số `FLIP_HALF_MS = 340` trong `GameScreen` tuy có chữ "half", nhưng tại thời điểm đó thẻ đã xoay được khoảng 97% quãng đường chứ không phải một nửa.

## 4. Đọc các phần còn lại

### Tổ hợp với `whileTap`

```tsx
whileTap={{ scale: 0.97 }}
```

`rotateY` và `scale` được Motion quản lý như các thành phần riêng trong `transform`, nên có thể xảy ra cùng lúc mà không ghi đè nhau.

### Tỉ lệ lá bài

`aspect-[3/4.3]` giữ tỉ lệ rộng trên cao cố định theo chiều rộng hiện có. Trong khi đó `w-full max-w-sm` làm cho lá bài rộng hết cỡ nhưng không vượt quá khoảng 384px. Vì vậy, trên điện thoại lẫn máy tính, lá bài đều giữ đúng dáng.

### Câu hỏi có thể là `null`

Khi chưa rút lá nào, `question` là `null`, và `{question}` không vẽ gì. Không sao cả, vì lúc đó mặt sau đang bị ẩn.

Lưu ý rằng **cả hai mặt luôn có mặt trên DOM**. Lá bài chỉ che mặt kia bằng CSS. Nếu bạn kiểm tra trong DevTools, bạn sẽ thấy câu hỏi nằm đó dù thẻ đang úp. Đây là một khác biệt quan trọng: `{cond && <X />}` thì không tạo phần tử, còn CSS thì chỉ che đi.

### Chia sẻ với `HalloweenDecor`

```tsx
{HALLOWEEN && (
  <>
    <SpiderWeb className="absolute right-4 top-4 h-20 w-20 rounded-tr-[20px] text-white/40" flip />
    <span className="absolute bottom-6 left-7 text-2xl opacity-90">🎃</span>
  </>
)}
```

Fragment được dùng ở đây vì `&&` chỉ trả về được một biểu thức. Thuộc tính `flip` không có giá trị là cách viết tắt của `flip={true}`.

`SpiderWeb` được định nghĩa trong [HalloweenDecor.tsx](../src/components/HalloweenDecor.tsx#L28) và dùng lại ở đây. Bạn sẽ đọc code của nó ở bài 11.

## 5. Một điểm yếu về khả năng tiếp cận

Nút có `aria-label`:

```tsx
aria-label={revealed ? 'Rút thẻ tiếp theo' : 'Chạm để rút thẻ'}
```

`aria-label` **thay thế** nội dung bên trong khi trình đọc màn hình đọc tên nút. Toàn bộ câu hỏi lại nằm trong nút này, nên người dùng trình đọc màn hình có thể chỉ nghe "Rút thẻ tiếp theo" mà không nghe câu hỏi. Đây là một điểm có thể cải thiện, và là một bài tập tốt ở [bài 13](13-tong-hop.md#4-bài-tập-lớn).

## Thử ngay

Hãy sửa từng thứ một, và nhớ khôi phục sau mỗi lần:

1. Xóa `backfaceVisibility: 'hidden'` ở mặt sau. Thẻ sẽ hiện chữ ngược xuyên qua bìa.
2. Xóa `transformStyle: 'preserve-3d'`. Hiệu ứng lật sẽ hỏng.
3. Đổi `perspective` từ `1800px` thành `400px`. Lật sẽ trở nên rất kịch tính vì mắt nhìn ở gần hơn.
4. Đổi `ease` thành `'linear'`. Bạn sẽ thấy thẻ quay đều và kém sống động hơn.
5. Mở DevTools, tìm phần tử `button` lớn của lá bài rồi quan sát thuộc tính `transform` thay đổi khi lật.

## Tự kiểm tra

<details>
<summary>1. Ai quyết định khi nào lá bài lật?</summary>

`GameScreen`, thông qua prop `revealed`. `PlayingCard` chỉ phản ánh giá trị đó.
</details>

<details>
<summary>2. Vì sao mặt sau cần sẵn <code>rotateY(180deg)</code>?</summary>

Vì sau khi thân xoay thêm 180°, tổng là 360°, mặt đó quay về phía người xem và chữ đúng chiều. Nếu không có sẵn góc đó, lúc thẻ ngửa mặt sau sẽ ở 180° và bị ẩn.
</details>

<details>
<summary>3. Vì sao không dùng <code>{revealed ? &lt;Front /&gt; : &lt;Back /&gt;}</code> để hiển thị hai mặt?</summary>

Vì hiệu ứng lật cần **cả hai mặt cùng tồn tại** trong lúc xoay. Nếu chỉ render một mặt, bạn sẽ không thấy mặt kia hiện ra ở nửa sau của cú lật.
</details>

<details>
<summary>4. Khi thẻ đang ngửa, sau bao lâu thì câu hỏi trên mặt sau bị che hoàn toàn?</summary>

Khoảng 85ms sau khi bắt đầu lật, vì đường cong ease đưa thẻ qua mốc 90° rất sớm.
</details>

---

**Bài tiếp theo:** [09. useDeckQueue](09-use-deck-queue.md)
