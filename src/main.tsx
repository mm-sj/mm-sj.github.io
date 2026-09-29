import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

// 휴대폰은 index.html에서 번들을 받기 전에 정적 버전으로 보낸다(window.__PHONE__)
if (!(window as unknown as { __PHONE__?: boolean }).__PHONE__)
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
