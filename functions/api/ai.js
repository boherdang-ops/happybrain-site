// ============================================================
//  /api/ai  —  키를 숨긴 "범용" AI 호출 서버 함수
//  Cloudflare Pages Function. 앞으로 만드는 모든 AI 앱은
//  이 하나의 엔드포인트(/api/ai)를 호출합니다.
//
//  GEMINI_API_KEY는 코드가 아니라 Cloudflare 설정
//  (환경변수/시크릿)에 저장합니다. → SETUP 참고
// ============================================================

// 사용할 모델. 2026년 7월 기준 정식(GA) 모델입니다.
// 최신·저가로 바꾸려면 'gemini-3.6-flash'로 교체하세요.
const MODEL = 'gemini-3.5-flash';

// 입력 길이 상한(남용/과금 방지). 회의록 등 긴 텍스트를 위해 넉넉히.
const MAX_CHARS = 30000;

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
    return json({ error: '서버에 API 키가 설정되지 않았습니다. (관리자: Cloudflare 환경변수 GEMINI_API_KEY 를 설정하고 재배포하세요)' }, 500);
  }

  // 3) 입력 파싱·검증
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: '잘못된 요청 형식입니다.' }, 400);
  }
  const systemPrompt = String(body.systemPrompt || '').slice(0, MAX_CHARS);
  const userPrompt = String(body.userPrompt || '').slice(0, MAX_CHARS);
  if (!userPrompt.trim()) {
    return json({ error: '입력 내용이 비어 있습니다.' }, 400);
  }

  // 4) Gemini 호출
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  try {
    const gRes = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
        generationConfig: { temperature: 0.4 },
      }),
    });

    if (!gRes.ok) {
      // Gemini가 준 상세 메시지를 최대한 그대로 노출 → 디버깅이 쉬워짐
      let detail = '';
      try { const e = await gRes.json(); detail = e?.error?.message || ''; } catch {}
      if (gRes.status === 429) {
        return json({ error: '지금 이용량이 많아 잠시 후 다시 시도해 주세요.' }, 429);
      }
      if (gRes.status === 400 || gRes.status === 404) {
        return json({ error: `모델 요청 오류(${gRes.status}). 모델명(${MODEL})이 유효한지 확인하세요.${detail ? ' · ' + detail : ''}` }, 502);
      }
      return json({ error: `AI 서버 오류 (${gRes.status})${detail ? ' · ' + detail : ''}` }, 502);
    }

    const data = await gRes.json();
    // Gemini 3.x는 '생각(thought)' 파트를 섞어 줄 수 있어, 실제 텍스트 파트만 모읍니다.
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const text = parts.filter(p => p && p.text && !p.thought).map(p => p.text).join('').trim();
    if (!text) {
      return json({ error: '결과를 생성하지 못했습니다. 다시 시도해 주세요.' }, 502);
    }
    return json({ text }, 200);
  } catch (e) {
    return json({ error: '요청 처리 중 오류가 발생했습니다.' }, 500);
  }
}

// POST 외 메서드는 막기
export async function onRequest(context) {
  if (context.request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }
  return onRequestPost(context);
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
