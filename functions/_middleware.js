// ============================================================
//  보호 구역 문지기 (공용 비밀번호) — 최상위 미들웨어
//
//  Cloudflare Pages에서 "정적 파일 앞"에서 검사하려면
//  이 파일이 반드시 functions/ 최상위에 있어야 합니다.
//  아래 경로로 시작하는 요청만 검사하고, 나머지는 그대로 통과시킵니다.
// ============================================================

const PROTECTED = ['/apps/private/', '/uploads/private/'];

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // 보호 대상이 아니면 그대로 통과 (사이트 전체는 평소처럼 동작)
  const needsAuth = PROTECTED.some((p) => url.pathname.startsWith(p));
  if (!needsAuth) return next();

  const secret = env.SITE_PASSWORD;
  if (!secret) {
    return new Response('이 자료는 아직 열람 설정이 완료되지 않았습니다. (관리자: SITE_PASSWORD 설정 필요)', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/(?:^|;\s*)hb_key=([a-f0-9]{64})/);
  const expected = await sha256(secret + '|hb-access');

  if (match && match[1] === expected) {
    const res = await next();
    const out = new Response(res.body, res);
    out.headers.set('Cache-Control', 'private, no-store');
    return out;
  }

  const to = new URL('/unlock/', url.origin);
  to.searchParams.set('next', url.pathname + url.search);
  return Response.redirect(to.toString(), 302);
}
