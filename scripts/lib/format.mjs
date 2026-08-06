export const DIVISIONS = {
  200: '美聯西區',
  201: '美聯東區',
  202: '美聯中區',
  203: '國聯西區',
  204: '國聯東區',
  205: '國聯中區',
};

export function taipeiDateTime(isoString) {
  const d = new Date(isoString);
  return new Intl.DateTimeFormat('zh-Hant-TW', {
    timeZone: 'Asia/Taipei',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

export function taipeiDateStamp(isoString) {
  const d = new Date(isoString);
  return new Intl.DateTimeFormat('zh-Hant-TW', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
