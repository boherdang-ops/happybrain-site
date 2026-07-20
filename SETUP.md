# 해피브레인 사이트 — 설치·운영 안내

이 사이트는 **Astro(사이트) + Sveltia CMS(브라우저 글쓰기) + Cloudflare Pages(호스팅)** 구조입니다.
아래 순서대로 하면 됩니다. **1부까지만 해도 사이트는 인터넷에 뜹니다.** 디자인을 먼저 눈으로 확인한 뒤,
마음에 들면 2부(브라우저 글쓰기 연결)로 넘어가세요.

한 번만 하면 되는 세팅이고, 그 뒤로는 코드를 다시 건드릴 일이 없습니다.

---

## 미리 준비할 것
- **GitHub 계정** (무료) — 코드가 사는 곳
- **Cloudflare 계정** (무료) — 사이트가 사는 곳 + 로그인 처리
- 로컬에서 미리 보고 싶다면 Node.js 18+ (선택)

> 로컬에서 먼저 보기(선택): 이 폴더에서 `npm install` → `npm run dev` → 브라우저에서 `http://localhost:4321`

---

## 1부. 사이트 띄우기 (여기까지만 해도 공개됩니다)

### 1-1. GitHub에 올리기
1. GitHub에서 새 저장소(repository)를 만듭니다. 예: `happybrain-site` (Private/Public 아무거나).
2. 이 폴더를 그 저장소에 올립니다. 터미널이 편하면:
   ```bash
   git init
   git add .
   git commit -m "첫 배포"
   git branch -M main
   git remote add origin https://github.com/<본인아이디>/happybrain-site.git
   git push -u origin main
   ```
   (GitHub Desktop 앱으로 드래그해서 올려도 됩니다.)

### 1-2. Cloudflare Pages에 연결
1. Cloudflare 대시보드 → **Workers & Pages → Create → Pages → Connect to Git**
2. 방금 만든 저장소를 선택합니다.
3. 빌드 설정을 이렇게 입력:
   - **Framework preset:** `Astro`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. **Save and Deploy**. 1~2분 뒤 `https://happybrain-site.pages.dev` 같은 주소로 사이트가 뜹니다.

✅ **여기서 디자인을 확인하세요.** 색·구성·문구가 마음에 드는지 보고, 고칠 게 있으면 알려주세요.

> 나만의 도메인(예: happybrain.kr)을 붙이려면 Cloudflare Pages의 **Custom domains**에서 연결하면 됩니다.
> 도메인을 정했다면 `astro.config.mjs`의 `site` 값도 그 주소로 바꿔주세요.

---

## 2부. 브라우저에서 글쓰기 연결 (Sveltia CMS)

사이트가 뜬 걸 확인했으면, 이제 Brunch처럼 브라우저에서 글을 쓰는 화면(`/admin`)을 켭니다.
로그인 처리를 위해 **작은 Cloudflare Worker 하나**와 **GitHub 로그인 앱 하나**를 만듭니다. (한 번뿐)

### 2-1. 로그인 처리기(Worker) 배포
1. 이 저장소를 엽니다 → https://github.com/sveltia/sveltia-cms-auth
2. README의 **Deploy to Cloudflare** 버튼으로 배포합니다. (또는 clone 후 `wrangler deploy`)
3. 배포되면 Worker 주소가 나옵니다. 예: `https://sveltia-cms-auth.<본인>.workers.dev` — **이 주소를 복사해 둡니다.**

### 2-2. GitHub 로그인 앱 등록
1. https://github.com/settings/developers → **OAuth Apps → New OAuth App**
2. 입력값:
   - **Application name:** `Sveltia CMS` (아무 이름)
   - **Homepage URL:** 사이트 주소 (예: `https://happybrain-site.pages.dev`)
   - **Authorization callback URL:** 2-1에서 복사한 Worker 주소 뒤에 `/callback`
     (정확한 경로는 sveltia-cms-auth README에 표기된 값을 그대로 씁니다)
3. 만들면 나오는 **Client ID**와 **Client Secret**을, 2-1에서 만든 Worker의 환경변수
   (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`)에 넣습니다.
   (Cloudflare 대시보드 → 해당 Worker → Settings → Variables)

### 2-3. 사이트에 내 정보 연결
`public/admin/config.yml` 파일 맨 위 3줄을 본인 값으로 바꿉니다:
```yaml
backend:
  name: github
  repo: <본인아이디>/happybrain-site     # ← 내 저장소
  branch: main
  base_url: https://sveltia-cms-auth.<본인>.workers.dev   # ← 2-1의 Worker 주소
```
바꾼 뒤 다시 커밋/푸시하면 Cloudflare가 자동으로 재배포합니다.

---

## 3부. 이제부터 평소 운영

1. 브라우저에서 **`내사이트주소/admin`** 접속
2. **"GitHub으로 로그인"** 클릭
3. 왼쪽에서 **글 / 책 / 영상** 중 고르고 **New**
4. 제목·본문 쓰고 **Publish** — 끝.

발행하면 GitHub에 자동 저장되고, Cloudflare가 1~2분 안에 사이트를 다시 만들어 반영합니다.
**폰에서도 같은 주소로 접속하면 글을 쓸 수 있습니다** (Sveltia는 모바일 지원).
코드·터미널·Git 명령은 앞으로 건드릴 일이 없습니다.

---

## 콘텐츠가 저장되는 곳 (참고용)
- 글 → `src/content/writing/*.md`
- 책 → `src/content/books/*.md`
- 영상 → `src/content/videos/*.md`
- 업로드한 이미지 → `public/uploads/`

지금 들어있는 글·책·영상은 **예시**입니다. `/admin`에서 자유롭게 고치거나 지우고 새로 쓰세요.

## 자주 바꾸는 것
- 사이트 이름/문구: `src/components/Header.astro`, `src/components/Footer.astro`, `src/pages/index.astro`
- 소개 내용: `src/pages/about/index.astro`
- 이메일/연락처: `src/pages/contact/index.astro` 상단
- 글 분류(카테고리) 목록: `src/content.config.ts`와 `public/admin/config.yml` 두 곳을 같이 맞춰주세요
