# 12. `useCardSound`: tạo âm thanh bằng code

**File trong bài:** [src/hooks/useCardSound.ts](../src/hooks/useCardSound.ts)

**Sau bài này, bạn sẽ hiểu:** khi nào code nên nằm ngoài React, cách tổng hợp âm thanh bằng Web Audio API, và những xử lý đặc thù cho iOS.

Dự án không có file nhạc nào. Toàn bộ tiếng lật thẻ được tính bằng toán khi chạy. Phần lớn file này không liên quan đến React, nên lần đọc đầu bạn chỉ cần nắm phần 1 và phần 5.

## 1. Cấu trúc file: nhiều ngoài React, ít trong React

```text
Ngoài React (dòng 1-133)           Trong React (dòng 135-162)
─────────────────────              ──────────────────────────
audioCtx (biến cấp module)         useCardSound()
cachedImpulse (biến cấp module)    ├── muted (state)
setPlaybackAudioSession()          ├── play()
unlock()                           └── toggleMuted()
getAudioContext()
loadMuted()
getReverbImpulse()
playFlipTone()
```

Hãy để ý hai biến ở cấp module:

```ts
let audioCtx: AudioContext | null = null
let cachedImpulse: { ctx: AudioContext; buffer: AudioBuffer } | null = null
```

Vì sao không dùng `useRef` hay `useState`? Vì bản chất của từng loại dữ liệu khác nhau:

| Dữ liệu | Thuộc về | Đặt ở đâu | Lý do |
|---|---|---|---|
| `muted` | Giao diện cần hiển thị theo nó | `useState` | Icon loa phải đổi theo |
| `audioCtx`, `cachedImpulse` | Toàn bộ trang | Biến module | Sống lâu hơn component, không ảnh hưởng hiển thị |

`GameScreen` bị unmount mỗi khi quay lại. Nếu `AudioContext` nằm trong `useRef`, mỗi lần vào chơi sẽ tạo một bản mới, trong khi trình duyệt khuyến nghị dùng chung một context và tạo context là việc tốn kém. Biến module chỉ khởi tạo một lần và được dùng lại mãi mãi.

**Quy tắc:** không phải thứ gì cũng phải đưa vào React. Thứ không ảnh hưởng tới giao diện và phải tồn tại lâu dài có thể nằm ngoài.

## 2. Mô hình của Web Audio: một đồ thị

Web Audio hoạt động như một hệ thống dây nối: các nút (node) phát hoặc biến đổi tín hiệu, nối với nhau bằng `.connect()`, và kết thúc ở loa (`ctx.destination`).

Đây là đồ thị đầy đủ cho một lần phát:

```text
PHẦN "WHOOSH" (tiếng xé gió)
Tiếng ồn ─► Lọc thông dải ─► Âm lượng giảm dần ─────────────────► Loa
BufferSource  Biquad          Gain

PHẦN "CHIME" (tiếng chuông, gồm 2 nốt)
Sóng sin C5 ─► Âm lượng C5 ─┬─► Âm khô (0.55) ────────────────► Loa
Sóng sin G5 ─► Âm lượng G5 ─┤
                            └─► Vang (Convolver) ─► Âm ướt (0.5) ► Loa
```

Về thời gian:

```text
0ms       84ms      140ms                   ~984ms  ~1084ms
├─ whoosh ─────────┤
          ├─ chime giảm dần ────────────────┤
                                                    ├ dao động dừng
                                 vang tiếp tục kéo dài thêm...
```

## 3. Phần "whoosh": tiếng ồn được nắn lại

### Bước 1: tạo tiếng ồn trắng

```ts
const bufferSize = Math.floor(ctx.sampleRate * whooshDuration)
const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
const data = buffer.getChannelData(0)
for (let i = 0; i < bufferSize; i++) {
  const decay = 1 - i / bufferSize
  data[i] = (Math.random() * 2 - 1) * decay
}
```

Âm thanh số là một dãy số biểu diễn vị trí màng loa theo thời gian, từ -1 đến 1. `sampleRate` là số mẫu mỗi giây, thường là 44.100 hoặc 48.000. Với 48.000 mẫu mỗi giây, 0,14 giây tương ứng 6.720 số.

- `Math.random() * 2 - 1` cho số ngẫu nhiên từ -1 đến 1. Dãy số ngẫu nhiên chính là **tiếng ồn trắng**, giống tiếng rè của tivi.
- `decay` giảm từ 1 về 0, làm tiếng ồn nhỏ dần.

### Bước 2: lọc tần số

```ts
bandpass.type = 'bandpass'
bandpass.frequency.setValueAtTime(2200, now)
bandpass.frequency.exponentialRampToValueAtTime(500, now + whooshDuration)
```

Bộ lọc thông dải chỉ cho một vùng tần số đi qua. Vùng này trượt từ 2200Hz xuống 500Hz, tức từ cao xuống trầm, và đó chính là cảm giác "vút" của một vật lướt qua.

### Bước 3: nối dây

```ts
noise.connect(bandpass).connect(noiseGain).connect(ctx.destination)
```

`.connect()` trả về node đích, nên có thể viết nối tiếp như vậy.

## 4. Phần "chime": sóng sin và tiếng vang

### Hai nốt nhạc

```ts
const notes: Array<[frequency: number, peakGain: number]> = [
  [523.25, 0.28], // C5
  [784.0, 0.16], // G5
]
```

Đây là một tuple có đặt tên: một mảng đúng hai phần tử, mỗi phần tử có tên để dễ đọc. C5 và G5 cách nhau một quãng năm đúng, là quãng nghe rất hòa hợp. Nốt G5 nhỏ hơn nên đóng vai trò làm giàu âm sắc cho nốt C5.

### Đường bao âm lượng

```ts
envelope.gain.setValueAtTime(0.0001, now)
envelope.gain.setValueAtTime(peakGain, chimeStart)
envelope.gain.exponentialRampToValueAtTime(0.0001, chimeStart + 0.9)
```

Tiếng chuông thật vang to ngay khi gõ rồi tắt dần, không có đoạn to dần. Ba dòng này mô phỏng đúng điều đó.

Chú ý giá trị `0.0001` thay vì `0`: đường giảm mũ không thể chạm tới 0, vì về mặt toán học, giá trị mũ không bao giờ bằng 0. Web Audio cũng không cho phép giá trị đích của đường này bằng 0.

### Tiếng vang: Convolution Reverb

Trong một căn phòng thật, tiếng vang là âm thanh gốc dội lại nhiều lần từ các bức tường. Có một tính chất đẹp: nếu bạn ghi được "dấu vân tay" của căn phòng bằng cách tạo một tiếng nổ cực ngắn rồi thu lại phần dư âm (gọi là **impulse response**), thì node `Convolver` có thể áp đặc tính của căn phòng đó lên bất kỳ âm thanh nào.

Thông thường, người ta nạp dấu vân tay từ file ghi âm. Dự án tự tạo ra nó ([dòng 53-67](../src/hooks/useCardSound.ts#L53-L67)):

```ts
data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decayPower)
```

Đây là tiếng ồn trắng giảm dần trong 1,8 giây, với 2 kênh được tạo ngẫu nhiên riêng, nhờ đó tiếng vang có cảm giác rộng. Điều này mô phỏng khá tốt một căn phòng lớn, vì dư âm thật gồm rất nhiều tiếng dội lộn xộn và nhỏ dần.

Kết quả được giữ lại trong `cachedImpulse`, vì đây là bước tốn công nhất: ở 48.000 mẫu mỗi giây, 1,8 giây trên 2 kênh là hơn 170.000 phép tính. Điều kiện `cachedImpulse.ctx === ctx` đảm bảo buffer khớp với context hiện tại.

### Khô và ướt

```text
dryGain 0.55: âm gốc
wetGain 0.5:  âm đã qua vang
```

Trộn cả hai tạo ra tiếng chuông rõ, có dư âm. Đây là kỹ thuật trộn âm tiêu chuẩn, và tên gọi "dry" và "wet" cũng được dùng ngoài phòng thu.

### Vì sao mỗi lần phát phải tạo node mới?

Nguồn âm như `OscillatorNode` hay `AudioBufferSourceNode` **chỉ gọi `start()` được một lần**, nên mỗi lần phát phải tạo mới. Đây là cách Web Audio được thiết kế: các node nguồn rất nhẹ và dùng xong là bỏ.

## 5. Phần React: hook rất ngắn

```ts
export function useCardSound() {
  const [muted, setMuted] = useState(loadMuted)

  const play = useCallback(() => {
    if (muted) return
    const ctx = getAudioContext()
    if (!ctx) return
    try {
      playFlipTone(ctx)
    } catch {
      // ignore: autoplay restrictions or unsupported browser
    }
  }, [muted])
```

### `useState(loadMuted)`

Đây là khởi tạo lười, viết gọn hơn so với `useDeckQueue` vì `loadMuted` không cần tham số, nên có thể truyền thẳng hàm mà không bọc `() => ...`:

```ts
useState(loadMuted)                                 // Truyền hàm, không có tham số
useState(() => loadState(deckId, total, mode))      // Cần tham số nên phải bọc
useState(loadMuted())                               // ❌ Gọi ở mọi lần render
```

### `useCallback` với `[muted]`

`play` đọc `muted` nên phải khai báo nó trong dependency. Khi `muted` đổi, một hàm `play` mới được tạo. Đây chính là thứ gây ra stale closure ở [bài 10](10-game-screen.md#5-stale-closure-một-lỗi-nhỏ-có-thật-trong-code): `setTimeout` vẫn giữ hàm `play` cũ.

### `toggleMuted`

```ts
const toggleMuted = useCallback(() => {
  setMuted((prev) => {
    const next = !prev
    try {
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
    } catch {
      // ignore storage errors
    }
    return next
  })
}, [])
```

Hãy so sánh với `useDeckQueue`, nơi việc lưu được đặt trong `useEffect`. Ở đây, việc ghi `localStorage` nằm **bên trong updater function**. Theo nguyên tắc, updater phải thuần túy, còn đoạn này có tác dụng phụ. `StrictMode` sẽ gọi nó hai lần ở chế độ dev. Không có lỗi nào xảy ra vì cả hai lần đều ghi cùng một giá trị, nhưng đây không phải mẫu nên bắt chước.

Hai cách đúng nguyên tắc hơn là dùng effect như `useDeckQueue`, hoặc tính giá trị mới trong event handler rồi vừa `setMuted` vừa ghi.

## 6. Xử lý riêng cho iOS

Git log có commit `98cf368 fix sound for ios`, cho thấy đây là những vấn đề đã gặp thật. Các comment trong code cũng giải thích từng trường hợp.

### Vấn đề 1: phải có thao tác của người dùng

Trình duyệt chặn âm thanh tự phát để tránh trang web tự kêu. `AudioContext` mới tạo có thể ở trạng thái `suspended`. Đó là lý do context được tạo **bên trong `play`**, chính là khi người dùng bấm, thay vì lúc tải trang.

```ts
function unlock(ctx: AudioContext) {
  const source = ctx.createBufferSource()
  source.buffer = ctx.createBuffer(1, 1, ctx.sampleRate)
  source.connect(ctx.destination)
  source.start(0)
}
```

Hàm này phát một đoạn âm dài đúng 1 mẫu, không ai nghe thấy. Theo comment trong code, iOS đời cũ chỉ mở khóa âm thanh sau khi có một nguồn được bắt đầu trong lúc người dùng thao tác.

### Vấn đề 2: công tắc im lặng của iPhone

```ts
function setPlaybackAudioSession() {
  const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession
  if (!session) return
  try {
    session.type = 'playback'
  } catch {
    // ignore: unsupported session type
  }
}
```

Theo comment trong code, iOS mặc định xếp Web Audio vào kênh chuông, nên bật công tắc im lặng sẽ tắt luôn tiếng. Đặt kiểu là `playback` làm cho nó phát như một trình phát nhạc.

Cú pháp `navigator as Navigator & { audioSession?: ... }` là ép kiểu, cần thiết vì API này còn mới và chưa có trong định nghĩa kiểu của TypeScript. `&` nghĩa là "có cả hai bộ trường". Tương tự, `webkitAudioContext` là tên cũ của API trên Safari đời trước.

### Vấn đề 3: sau khi khóa màn hình

```ts
if (audioCtx.state !== 'running') audioCtx.resume().catch(() => {})
```

Comment cho biết iOS báo trạng thái `interrupted` sau khi ứng dụng xuống nền hoặc khóa màn hình, chứ không phải `suspended`. Viết `!== 'running'` xử lý được tất cả các trường hợp, trong khi `=== 'suspended'` sẽ bỏ sót. `.catch(() => {})` bỏ qua lỗi, vì âm thanh không phải tính năng bắt buộc: thà im lặng còn hơn làm hỏng app.

Cả file này thể hiện một triết lý nhất quán: **âm thanh chỉ là phần trang trí**, nên mọi lỗi đều được bỏ qua để người dùng vẫn chơi được.

## Thử ngay

1. Đổi `[523.25, 0.28]` thành `[261.63, 0.28]` (C4). Tiếng chuông sẽ trầm xuống một quãng tám, vì tần số giảm đúng một nửa.
2. Đặt `wetGain.gain.value = 0` để bỏ hoàn toàn tiếng vang. Bạn sẽ thấy tiếng chuông trở nên khô và ngắn.
3. Đổi `osc.type = 'sine'` thành `'square'`, âm thanh sẽ giống trò chơi 8-bit. Có thể cần giảm `peakGain` vì tiếng này to hơn.
4. Đổi `duration = 1.8` thành `5` trong `getReverbImpulse`, rồi tải lại trang: căn phòng ảo sẽ rộng như nhà thờ.
5. Tắt tiếng rồi tải lại trang. Trạng thái tắt tiếng vẫn được giữ, vì `loadMuted` đọc từ khóa `tam-giao:sound-muted`.

## Tự kiểm tra

<details>
<summary>1. Vì sao <code>muted</code> là state, còn <code>audioCtx</code> là biến module?</summary>

`muted` quyết định icon hiển thị nên phải là state. `audioCtx` không ảnh hưởng tới giao diện và phải sống lâu hơn `GameScreen`.
</details>

<details>
<summary>2. Tại sao không tạo <code>AudioContext</code> ngay khi tải trang?</summary>

Vì trình duyệt yêu cầu có thao tác của người dùng mới cho phát âm thanh. Tạo context bên trong `play`, được gọi từ cú click, đảm bảo điều kiện đó.
</details>

<details>
<summary>3. Có thể gọi lại <code>osc.start()</code> trên cùng một oscillator lần sau không?</summary>

Không. Node nguồn chỉ `start` được một lần, nên mỗi lần phát phải tạo node mới.
</details>

<details>
<summary>4. Vì sao phải dùng <code>0.0001</code> thay vì <code>0</code>?</summary>

`exponentialRampToValueAtTime` là đường giảm theo hàm mũ, không thể đi tới 0, và Web Audio không chấp nhận 0 làm giá trị đích.
</details>

<details>
<summary>5. Ghi <code>localStorage</code> trong updater function của <code>toggleMuted</code> có vấn đề gì?</summary>

Updater nên thuần túy, trong khi đây là tác dụng phụ. Trong `StrictMode` nó bị gọi hai lần. Ở đây vô hại vì cùng ghi một giá trị, nhưng về nguyên tắc nên đặt ở effect hoặc event handler.
</details>

---

**Bài tiếp theo:** [13. Tổng hợp](13-tong-hop.md)
