// @ts-check
import { defineConfig } from 'astro/config'

// 배포 시 실제 도메인으로 바꿔주세요
export default defineConfig({
  site: 'https://happybrain.ai.kr',
  build: {
    format: 'directory',
  },
})
