import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' — GitHub Pages 하위 경로에서도 에셋 경로가 깨지지 않게 상대 경로로 빌드
export default defineConfig({
  plugins: [react()],
  base: './',
})
