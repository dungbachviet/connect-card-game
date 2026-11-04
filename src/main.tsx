// Điểm khởi động của app: gắn component <App /> vào thẻ <div id="root"> trong index.html.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Dấu `!` báo với TypeScript rằng chắc chắn tìm thấy #root (không phải null).
createRoot(document.getElementById('root')!).render(
  // StrictMode chỉ có tác dụng khi dev: chạy lặp một số hàm và effect để sớm phát hiện lỗi.
  <StrictMode>
    <App />
  </StrictMode>,
)
