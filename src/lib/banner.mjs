export function isBannerVisible(banner, now = new Date()) {
 if (!banner?.enabled || !String(banner.title || '').trim()) return false;
 const valid = value => !value || (/^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value);
 const start=String(banner.startDate || ''),end=String(banner.endDate || '');
 if(!valid(start)||!valid(end)||(start&&end&&start>end))return false;
 const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
 return (!start||today>=start)&&(!end||today<=end);
}
export function publicLink(value) { const s=String(value||'').trim();return /^(https?:\/\/|\/(?!\/))/i.test(s)?s:''; }
