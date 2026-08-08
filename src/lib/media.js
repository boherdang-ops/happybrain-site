// 유튜브 URL에서 영상 ID 추출 (watch, youtu.be, embed, shorts, live 지원)
export function youtubeId(url = '') {
  const m = String(url).match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return m ? m[1] : null;
}

// 영상 썸네일: 직접 올린 게 있으면 그것, 없으면 유튜브 링크에서 자동 생성
export function videoThumb(data = {}) {
  if (data.thumbnail) return data.thumbnail;
  const id = youtubeId(data.url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

// CSS background-image용: 경로에 공백·한글이 있어도 안전하게 따옴표 처리
export function bgImage(path) {
  return path ? `background-image:url('${String(path).replace(/'/g, "\\'")}')` : '';
}

// 파일 주소 안전 변환: 한글·띄어쓰기가 들어간 경로를 웹 주소 규격으로 인코딩
// (이미 인코딩된 경로는 이중 인코딩하지 않음)
export function safeUrl(path) {
  if (!path) return path;
  const p = String(path).trim();
  if (/^https?:\/\//.test(p)) return p;            // 외부 링크는 그대로
  if (/%[0-9A-Fa-f]{2}/.test(p)) return p;         // 이미 인코딩됨
  return encodeURI(p);
}
