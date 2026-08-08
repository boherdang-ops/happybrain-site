// ============================================================
//  /api/gate-status — 잠금 기능 진단용
//  이 주소가 열리면 = 문지기(Functions)가 작동 중이라는 뜻입니다.
// ============================================================

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequest({ request, env }) {
  const secret = env.SITE_PASSWORD;
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/(?:^|;\s*)hb_key=([a-f0-9]{64})/);

  let cookieState = '없음 (비밀번호 미입력 상태)';
  if (match) {
    if (secret) {
      const expected = await sha256(secret + '|hb-access');
      cookieState = match[1] === expected ? '유효함 (열람 가능 상태)' : '무효함 (비밀번호가 바뀌었거나 위조)';
    } else {
      cookieState = '있음 (다만 비밀번호 미설정이라 확인 불가)';
    }
  }

  const report = {
    '1_함수작동': '예 — 이 화면이 보이면 Functions는 정상 작동 중입니다',
    '2_비밀번호설정': secret ? '설정됨 ✅' : '설정 안 됨 ❌ (Cloudflare 환경변수 SITE_PASSWORD 확인 필요)',
    '3_내쿠키상태': cookieState,
    '4_보호경로': ['/apps/private/*', '/uploads/private/*'],
    '안내': secret
      ? '위 보호 경로의 파일은 비밀번호를 통과해야만 열립니다. 시크릿 창에서 /apps/private/zzz.html 을 열어 확인해 보세요.'
      : '비밀번호가 설정되지 않아 보호 경로는 503으로 차단됩니다. Cloudflare Settings에서 SITE_PASSWORD를 추가하고 재배포하세요.',
  };

  return new Response(JSON.stringify(report, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
