// ============================================================
//  /api/gate-status — 잠금 상태 진단
//  구역별 비밀번호 설정 여부와 내 통행증 상태를 한눈에 보여줍니다.
// ============================================================

const ZONES = [
  { key: 'private',  env: 'SITE_PASSWORD',     label: '공용' },
  { key: 'learning', env: 'LEARNING_PASSWORD', label: '학습' },
  { key: 'practice', env: 'PRACTICE_PASSWORD', label: '실습' },
];

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequest({ request, env }) {
  const cookie = request.headers.get('Cookie') || '';
  const zones = {};

  for (const z of ZONES) {
    const secret = env[z.env];
    let state;
    if (!secret) {
      state = `비밀번호 미설정 ❌ (환경변수 ${z.env} 추가 필요)`;
    } else {
      const m = cookie.match(new RegExp(`(?:^|;\\s*)hb_${z.key}=([a-f0-9]{64})`));
      const expected = await sha256(`${secret}|hb-${z.key}`);
      state = !m
        ? '설정됨 ✅ / 내 통행증: 없음 (잠김)'
        : m[1] === expected
          ? '설정됨 ✅ / 내 통행증: 유효 (열람 가능)'
          : '설정됨 ✅ / 내 통행증: 무효 (비밀번호가 바뀜)';
    }
    zones[`${z.label}(${z.key})`] = {
      상태: state,
      보호경로: [`/apps/${z.key}/*`, `/uploads/${z.key}/*`],
    };
  }

  return new Response(JSON.stringify({
    함수작동: '예 — 이 화면이 보이면 Functions 정상',
    구역: zones,
    안내: '통행증을 반납하려면 /unlock/ 에서 "이 기기에서 통행증 해제"를 누르세요. 잠금 시험은 시크릿 창에서 하세요.',
  }, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
