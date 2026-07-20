// ============================================================
//  /api/press-release  —  키를 숨긴 AI 호출 서버 함수
//  Cloudflare Pages Function. GEMINI_API_KEY는 코드가 아니라
//  Cloudflare 설정(환경변수/시크릿)에 저장됩니다.  → SETUP 참고
// ============================================================

// 사용할 모델. 무료 등급에서 도는 모델입니다. 필요하면 여기만 바꾸세요.
const MODEL = 'gemini-3-flash';

// 입력 길이 상한(남용/과금 방지)
const MAX_CHARS = 8000;

export async function onRequestPost(context) {
  const { request, env } = context;

  // 1) 같은 사이트에서 온 요청만 허용 (다른 사이트가 이 함수를 훔쳐 쓰는 것 차단)
  const origin = request.headers.get('Origin');
  const selfOrigin = new URL(request.url).origin;
  if (origin && origin !== selfOrigin) {
    return json({ error: '허용되지 않은 요청입니다.' }, 403);
  }

  // 2) 키 확인
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    return json({ error: '서버에 API 키가 설정되지 않았습니다. (관리자: Cloudflare 환경변수 GEMINI_API_KEY 확인)' }, 500);
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
        contents: [{ parts: [{ text: userPrompt }] }],
        systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
      }),
    });

    if (!gRes.ok) {
      // 무료 등급 한도 초과 등
      if (gRes.status === 429) {
        return json({ error: '지금 이용량이 많아 잠시 후 다시 시도해 주세요.' }, 429);
      }
      return json({ error: `AI 서버 오류 (${gRes.status})` }, 502);
    }

    const data = await gRes.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return json({ error: '결과를 생성하지 못했습니다. 다시 시도해 주세요.' }, 502);
    }
    return json({ text }, 200);
  } catch (e) {
    return json({ error: '요청 처리 중 오류가 발생했습니다.' }, 500);
  }
}

// 다른 메서드는 막기
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
