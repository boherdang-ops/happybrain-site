// ============================================================
//  /api/unlock — 공용 비밀번호 확인
//  비밀번호는 코드가 아니라 Cloudflare 환경변수(SITE_PASSWORD)에 보관합니다.
// ============================================================

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost({ request, env }) {
  const secret = env.SITE_PASSWORD;
  if (!secret) {
    return json({ ok: false, error: '아직 열람 비밀번호가 설정되지 않았습니다. (관리자: Cloudflare 환경변수 SITE_PASSWORD 확인)' }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: '잘못된 요청입니다.' }, 400);
  }

  if (String(body.password || '') !== secret) {
    return json({ ok: false, error: '비밀번호가 맞지 않습니다.' }, 401);
  }

  const token = await sha256(secret + '|hb-access');
  const maxAge = 60 * 60 * 24 * 30; // 30일
  const headers = new Headers({ 'Content-Type': 'application/json; charset=utf-8' });
  headers.append('Set-Cookie', `hb_key=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`);
  headers.append('Set-Cookie', `hb_ok=1; Path=/; Secure; SameSite=Lax; Max-Age=${maxAge}`);
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
