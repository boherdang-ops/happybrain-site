// ============================================================
//  보호 구역 문지기 (공용 비밀번호)
//  이 폴더 아래 파일은 비밀번호를 통과한 사람에게만 전달됩니다.
//  주소를 직접 입력해도 잠금 화면으로 보내집니다.
// ============================================================

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const secret = env.SITE_PASSWORD;

  // 비밀번호가 아직 설정되지 않았으면 안전하게 막아 둠
  if (!secret) {
    return new Response('이 자료는 아직 열람 설정이 완료되지 않았습니다.', {
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

  const url = new URL(request.url);
  const to = new URL('/unlock/', url.origin);
  to.searchParams.set('next', url.pathname + url.search);
  return Response.redirect(to.toString(), 302);
}
