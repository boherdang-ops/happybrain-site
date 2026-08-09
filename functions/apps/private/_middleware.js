// (사용하지 않음) 검사는 최상위 functions/_middleware.js 에서 처리합니다.
// 예전 파일이 남아 충돌하지 않도록 그냥 통과시킵니다.
export async function onRequest(context) {
  return context.next();
}
