// @ts-check
import { defineConfig } from 'astro/config';

// 배포 후 실제 도메인으로 바꿔주세요 (예: 'https://happybrain.kr')
export default defineConfig({
  site: 'https://example.com',
  build: {
    format: 'directory',
  },
});
