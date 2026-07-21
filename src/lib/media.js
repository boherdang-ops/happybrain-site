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
