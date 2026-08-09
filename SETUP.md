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

---

## 행정지원앱 (AI 앱) 운영

### 앱이 사는 곳
- 앱 파일(HTML 등): `public/apps/<앱이름>/index.html` → 주소는 `사이트/apps/<앱이름>/`
- 앱 목록 카드: `/admin`의 **"행정지원앱"** 에서 추가·수정 (제목·설명·링크·태그)
- 새 앱 올리기 = ① 앱 HTML을 `public/apps/새앱/`에 올리기(코드 업로드) → ② `/admin`에서 카드 추가

### AI(키)가 필요한 앱 — 키는 코드에 넣지 않습니다
키가 필요한 앱은 `functions/api/`의 서버 함수가 대신 AI를 호출하고, **키는 Cloudflare 환경변수에 숨겨** 둡니다.

**Gemini 무료 키 발급 → Cloudflare에 등록 (한 번만):**
1. Google AI Studio(aistudio.google.com)에서 **무료 API 키** 발급 (신용카드 불필요, 요금 청구 없음)
2. Cloudflare 대시보드 → 해당 Pages 프로젝트 → **Settings → Environment variables**
3. 변수 추가: 이름 `GEMINI_API_KEY`, 값 = 발급받은 키. (Production/Preview 모두)
4. 저장 후 다시 배포(Retry deployment 또는 새 커밋)하면 적용됨

- 무료 등급은 하루 사용량 한도가 있어, 초과하면 잠시 도구가 쉬었다가 다시 됩니다(요금은 0원 유지).
- 무료 등급은 입력 내용이 Google 제품 개선에 쓰일 수 있으니, 앱에 "민감·비공개 정보 입력 금지" 안내를 두는 게 좋습니다.

---

## 보호 자료 (공용 비밀번호)

교육 참가자에게만 열어주고 싶은 자료·앱은 **공용 비밀번호**로 잠글 수 있습니다.
주소를 직접 입력해도 비밀번호 없이는 열리지 않습니다(서버에서 차단).

### 1. 비밀번호 정하기 (한 번만)
1. Cloudflare 대시보드 → 해당 Pages 프로젝트 → **Settings → Environment variables**
2. 변수 추가: 이름 `SITE_PASSWORD`, 값 = 원하는 비밀번호 (예: `kpa-2026-uiryeong`)
   - 종류를 고를 수 있으면 **Secret(암호화)** 선택
3. 저장 후 재배포하면 적용됩니다.
- 비밀번호를 바꾸고 싶으면 이 값만 바꾸면 됩니다. (기존에 열어둔 사람은 다시 입력해야 함)
- 과정마다 다른 비밀번호를 쓰고 싶다면, 과정이 끝날 때 값을 새로 바꿔주세요.

### 2. 자료 잠그기 (자료실)
`/admin` → 자료실 → 자료 편집 →
- 공개 자료: **"자료 파일"** 칸에 업로드
- 보호 자료: **"보호 자료(비밀번호를 아는 사람만 열람)"** 칸에 업로드
둘 중 하나만 쓰면 됩니다. 보호 자료는 목록에 🔒 표시가 붙고, 제목·설명은 보이되
미리보기와 내려받기는 비밀번호를 통과해야 열립니다.

### 3. 앱 잠그기 (행정지원앱)
1. 앱 HTML 파일을 GitHub의 **`public/apps/private/`** 폴더에 업로드
   (없으면 업로드할 때 파일명을 `private/앱이름.html` 로 적으면 폴더가 만들어집니다)
2. `/admin` → 행정지원앱 → 카드의 링크를 `/apps/private/앱이름.html` 로 입력
3. **"비밀번호 필요"** 토글을 켜면 목록에 🔒 표시가 붙습니다

### 참고
- 한 번 비밀번호를 입력하면 **30일간** 다시 묻지 않습니다(그 브라우저에서).
- 비밀번호를 아는 사람끼리는 공유가 가능합니다. 사람별로 통제하려면 Cloudflare Access(이메일 승인제)를 대신 쓸 수 있습니다.


---

## 보호 구역 3종 — 학습 / 실습 / 공용

자료와 앱을 세 구역으로 나눠, **구역마다 다른 비밀번호**를 씁니다.

| 구역 | 폴더 | Cloudflare 환경변수 | 쓰임새 |
|---|---|---|---|
| 공용 | `private` | `SITE_PASSWORD` | 여러 과정에 두루 쓰는 자료 |
| 학습 | `learning` | `LEARNING_PASSWORD` | 강의 중 함께 보는 학습 앱·자료 |
| 실습 | `practice` | `PRACTICE_PASSWORD` | 실습 과제용 앱·자료 |

- 비밀번호는 **구역을 자동으로 알아봅니다.** 참가자는 잠금 화면에서 받은 비밀번호 하나만 넣으면, 그 비밀번호가 속한 구역이 열립니다.
- 구역끼리는 서로 막힙니다. 학습 비밀번호로 실습 자료는 열리지 않습니다.

### 최초 1회 — 비밀번호 등록
Cloudflare → 프로젝트 → **Settings → Variables and secrets → Add**
- `SITE_PASSWORD`   = 공용 비밀번호
- `LEARNING_PASSWORD` = 학습 비밀번호
- `PRACTICE_PASSWORD` = 실습 비밀번호

세 개 모두 Type을 **Secret**으로. 저장 후 재배포하면 적용됩니다.
(등록하지 않은 구역은 안전하게 차단된 상태로 남습니다.)

### 자료 올리기 (자료실)
`/admin` → 자료실 → 자료 편집. 파일 칸이 네 개입니다. **한 자료에는 하나만** 쓰세요.
- 자료 파일 → 공개
- 보호 자료(공용 암호) / 학습 자료(학습 암호) / 실습 자료(실습 암호) → 각 구역

### 앱 올리기 (행정지원앱)
1. GitHub `public/apps/` 에서 업로드할 때 파일명 앞에 폴더를 붙입니다.
   - 학습 앱 → `learning/앱이름.html`
   - 실습 앱 → `practice/앱이름.html`
   - 공용 앱 → `private/앱이름.html`
   - 공개 앱 → 그냥 `앱이름.html`
2. `/admin` → 행정지원앱 → 링크를 `/apps/learning/앱이름.html` 처럼 폴더까지 정확히 입력
   - 🔒 표시는 링크 경로를 보고 자동으로 붙습니다.

### 교육 전후 비밀번호 관리
**교육 시작 전**
1. Settings → Variables and secrets → 해당 구역 변수의 연필 아이콘 → 이번 과정용 비밀번호로 변경 → Save
2. 재배포 1회 (또는 자료를 하나 올리면 자동 반영)
3. `/api/gate-status` 로 "설정됨 ✅" 확인
4. 시크릿 창에서 잠긴 자료를 열어 비밀번호 화면이 뜨는지 확인

**교육 중** — 참가자에게 해당 구역 비밀번호만 안내. 한 번 입력하면 그 기기에서 30일간 유지됩니다.

**교육 종료 후**
1. 같은 자리에서 비밀번호를 새 값으로 변경 → Save → 재배포
2. 이것만으로 **기존 참가자의 통행증이 전부 무효**가 됩니다(통행증이 비밀번호로 만들어지므로).
3. 자료 자체를 내리고 싶으면 CMS에서 임시저장(draft)으로 돌리거나 삭제

**내 통행증 해제(시험용)** — `/unlock/` 에서 "이 기기에서 통행증 해제" 클릭. 시크릿 창을 열지 않고도 잠금 상태를 확인할 수 있습니다.
