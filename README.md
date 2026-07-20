# 해피브레인 — 개인 사이트 겸 콘텐츠 허브

박상득(해피브레인)의 글·책·영상 아카이브. AI 행정혁신에 대한 기록을 쌓고, 지자체 담당자에게 하는 일을 보여주는 사이트입니다.

- **사이트:** Astro (정적 사이트, 빠르고 무료로 호스팅)
- **글쓰기:** Sveltia CMS — 브라우저 `/admin`에서 Brunch처럼 작성
- **호스팅:** Cloudflare Pages (무료)

## 시작하기
설치·배포·운영 방법은 **[SETUP.md](./SETUP.md)** 를 보세요.

## 로컬 실행
```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # dist/ 에 정적 파일 생성
```

## 구조
```
src/
  pages/        홈 · 글 · 책 · 영상 · 소개 · 강의·문의
  content/      글·책·영상 콘텐츠 (마크다운)
  components/   헤더 · 푸터
  layouts/      공통 레이아웃
  styles/       디자인 시스템 (색·타이포)
public/
  admin/        Sveltia CMS (브라우저 글쓰기 화면)
  uploads/      업로드 이미지
```
