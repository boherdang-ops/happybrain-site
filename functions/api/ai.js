// ============================================================
//  /api/ai  —  키를 숨긴 "범용" AI 호출 서버 함수
//  Cloudflare Pages Function. 모든 AI 앱이 이 하나의
//  엔드포인트(/api/ai)를 호출합니다.
//
//  ★ 이 버전은 Gemini의 일시적 혼잡(503 "high demand")·
//    호출 폭주(429)에 대비해 자동 재시도 + 모델 자동 전환을
//    합니다. 한 모델이 붐비면 다음 모델로 넘어갑니다.
//
//  GEMINI_API_KEY는 코드가 아니라 Cloudflare 설정
//  (환경변수/시크릿)에 저장합니다.
// ============================================================

// 시도 순서: 1차 모델(2회까지 재시도) → 붐비면 다음 모델로.
// 최신·저가로 바꾸려면 순서를 조정하세요.
const ATTEMPTS = [
  { model: 'gemini-3.5-flash',      retries: 2 },
  { model: 'gemini-3.6-flash',      retries: 1 },
  { model: 'gemini-3.5-flash-lite', retries: 1 },
];

const MAX_CHARS = 30000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function onRequestPost(context) {
  const { request, env } = context;

  // 1) 같은 사이트에서 온 요청만 허용
  const origin = request.headers.get('Origin');
  const selfOrigin = new URL(request.url).origin;
  if (origin && origin !== selfOrigin) {
    return json({ error: '허용되지 않은 요청입니다.' }, 403);
  }

  // 2) 키 확인
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    return json({ error: '서버에 API 키가 설정되지 않았습니다. (관리자: Cloudflare 환경변수 GEMINI_API_KEY 설정 후 재배포)' }, 500);
  }

  // 3) 입력 파싱·검증
  let body;
  try { body = await request.json(); } catch { return json({ error: '잘못된 요청 형식입니다.' }, 400); }
  const systemPrompt = String(body.systemPrompt || '').slice(0, MAX_CHARS);
  const userPrompt = String(body.userPrompt || '').slice(0, MAX_CHARS);
  if (!userPrompt.trim()) return json({ error: '입력 내용이 비어 있습니다.' }, 400);

  const payload = JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
    generationConfig: { temperature: 0.4 },
  });

  let lastStatus = 0, lastDetail = '';

  // 4) 모델별·재시도 루프
  for (const step of ATTEMPTS) {
    for (let attempt = 0; attempt <= step.retries; attempt++) {
      let gRes;
      try {
        gRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${step.model}:generateContent`,
          { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey }, body: payload }
        );
      } catch (e) {
        lastStatus = 0; lastDetail = '네트워크 오류';
        if (attempt < step.retries) { await sleep(400 * (attempt + 1)); continue; } else break;
      }

      if (gRes.ok) {
        const data = await gRes.json();
        const parts = data?.candidates?.[0]?.content?.parts || [];
        const text = parts.filter((p) => p && p.text && !p.thought).map((p) => p.text).join('').trim();
        if (text) return json({ text }, 200);
        // 빈 응답도 일시 오류로 보고 재시도/다음 모델
        lastStatus = 502; lastDetail = '빈 응답';
        if (attempt < step.retries) { await sleep(400 * (attempt + 1)); continue; } else break;
      }

      lastStatus = gRes.status;
      try { const e = await gRes.json(); lastDetail = e?.error?.message || ''; } catch { lastDetail = ''; }

      const transient = gRes.status === 503 || gRes.status === 429 || gRes.status === 500;
      if (transient) {
        // 일시적 혼잡 → 잠깐 쉬고 재시도, 재시도 소진 시 다음 모델로
        if (attempt < step.retries) { await sleep(500 * (attempt + 1)); continue; } else break;
      } else {
        // 400/404 등 영구 오류 → 즉시 반환(디버깅용 상세 포함)
        if (gRes.status === 400 || gRes.status === 404) {
          return json({ error: `모델 요청 오류(${gRes.status}). 모델명(${step.model})이 유효한지 확인하세요.${lastDetail ? ' · ' + lastDetail : ''}` }, 502);
        }
        return json({ error: `AI 서버 오류 (${gRes.status})${lastDetail ? ' · ' + lastDetail : ''}` }, 502);
      }
    }
    // 다음 모델로 넘어가기 전 아주 짧게 대기
    await sleep(200);
  }

  // 5) 모든 모델·재시도 실패
  if (lastStatus === 503 || lastStatus === 429) {
    return json({ error: '지금 AI 이용량이 많아 잠시 뒤 다시 시도해 주세요. (여러 번 자동 재시도했지만 계속 혼잡합니다)' }, 503);
  }
  return json({ error: `AI 응답을 받지 못했습니다. 잠시 후 다시 시도해 주세요.${lastDetail ? ' · ' + lastDetail : ''}` }, 502);
}

// POST 외 메서드는 막기 (배포 확인용: 브라우저로 /api/ai 열면 405가 정상)
export async function onRequest(context) {
  if (context.request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  return onRequestPost(context);
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
