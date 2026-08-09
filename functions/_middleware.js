// ============================================================
//  보호 구역 문지기 — 구역별 비밀번호 (최상위 미들웨어)
//
//  구역이 3개이고, 각각 다른 비밀번호를 씁니다.
//    공용(private)  : SITE_PASSWORD      → /apps/private/,  /uploads/private/
//    학습(learning) : LEARNING_PASSWORD  → /apps/learning/, /uploads/learning/
//    실습(practice) : PRACTICE_PASSWORD  → /apps/practice/, /uploads/practice/
//
//  구역을 늘리려면 아래 ZONES에 한 줄만 추가하면 됩니다.
//  ※ 이 파일은 반드시 functions/ 최상위에 있어야 정적 파일 앞에서 검사됩니다.
// ============================================================

const ZONES = [
  { key: 'private',  env: 'SITE_PASSWORD',     label: '공용 자료' },
  { key: 'learning', env: 'LEARNING_PASSWORD', label: '학습 자료' },
  { key: 'practice', env: 'PRACTICE_PASSWORD', label: '실습 자료' },
];

function zoneForPath(pathname) {
  const p = pathname.toLowerCase();
  for (const z of ZONES) {
    if (p.startsWith(`/apps/${z.key}/`) || p.startsWith(`/uploads/${z.key}/`)) return z;
  }
  return null;
}

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  const zone = zoneForPath(url.pathname);
  if (!zone) return next();          // 보호 구역이 아니면 그대로 통과

  const secret = env[zone.env];
  if (!secret) {
    return new Response(
      `이 자료는 아직 열람 설정이 완료되지 않았습니다. (관리자: Cloudflare 환경변수 ${zone.env} 설정 필요)`,
      { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
    );
  }

  const cookie = request.headers.get('Cookie') || '';
  const m = cookie.match(new RegExp(`(?:^|;\\s*)hb_${zone.key}=([a-f0-9]{64})`));
  const expected = await sha256(`${secret}|hb-${zone.key}`);

  if (m && m[1] === expected) {
    const res = await next();
    const out = new Response(res.body, res);
    out.headers.set('Cache-Control', 'private, no-store');
    return out;
  }

  const to = new URL('/unlock/', url.origin);
  to.searchParams.set('next', url.pathname + url.search);
  to.searchParams.set('zone', zone.key);
  return Response.redirect(to.toString(), 302);
}
