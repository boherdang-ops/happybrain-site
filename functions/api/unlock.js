// ============================================================
//  /api/unlock — 비밀번호 확인 (구역 자동 판별)
//  입력한 비밀번호가 어느 구역의 것인지 알아서 찾아 통행증을 발급합니다.
//  비밀번호는 코드가 아니라 Cloudflare 환경변수에 보관합니다.
// ============================================================

const ZONES = [
  { key: 'private',  env: 'SITE_PASSWORD',     label: '공용 자료' },
  { key: 'learning', env: 'LEARNING_PASSWORD', label: '학습 자료' },
  { key: 'practice', env: 'PRACTICE_PASSWORD', label: '실습 자료' },
];

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: '잘못된 요청입니다.' }, 400);
  }

  // 로그아웃(통행증 반납)
  if (body.logout) {
    const headers = new Headers({ 'Content-Type': 'application/json; charset=utf-8' });
    for (const z of ZONES) {
      headers.append('Set-Cookie', `hb_${z.key}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
      headers.append('Set-Cookie', `hb_ok_${z.key}=; Path=/; Secure; SameSite=Lax; Max-Age=0`);
    }
    headers.append('Set-Cookie', 'hb_ok=; Path=/; Secure; SameSite=Lax; Max-Age=0');
    headers.append('Set-Cookie', 'hb_key=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
    return new Response(JSON.stringify({ ok: true, loggedOut: true }), { status: 200, headers });
  }

  const input = String(body.password || '');
  if (!input) return json({ ok: false, error: '비밀번호를 입력해 주세요.' }, 400);

  const configured = ZONES.filter((z) => !!env[z.env]);
  if (configured.length === 0) {
    return json({ ok: false, error: '아직 열람 비밀번호가 설정되지 않았습니다. (관리자 확인 필요)' }, 500);
  }

  // 입력한 비밀번호와 일치하는 구역을 모두 찾아 통행증 발급
  const matched = configured.filter((z) => env[z.env] === input);
  if (matched.length === 0) {
    return json({ ok: false, error: '비밀번호가 맞지 않습니다.' }, 401);
  }

  const maxAge = 60 * 60 * 24 * 30; // 30일
  const headers = new Headers({ 'Content-Type': 'application/json; charset=utf-8' });
  for (const z of matched) {
    const token = await sha256(`${env[z.env]}|hb-${z.key}`);
    headers.append('Set-Cookie', `hb_${z.key}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`);
    headers.append('Set-Cookie', `hb_ok_${z.key}=1; Path=/; Secure; SameSite=Lax; Max-Age=${maxAge}`);
  }
  headers.append('Set-Cookie', `hb_ok=1; Path=/; Secure; SameSite=Lax; Max-Age=${maxAge}`);

  return new Response(
    JSON.stringify({ ok: true, zones: matched.map((z) => ({ key: z.key, label: z.label })) }),
    { status: 200, headers }
  );
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
