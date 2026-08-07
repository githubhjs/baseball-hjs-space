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

// Which Taipei calendar date a real instant falls on -- e.g. a 7pm ET game
// on MLB's US "officialDate" almost always lands on the *next* calendar date
// in Taipei (UTC+8 is far enough ahead of every US timezone that this is true
// for nearly every game time, not just late-night ones). Games must be
// re-bucketed by this, not trusted to stay on their US officialDate, or the
// displayed date label and the game times underneath it disagree.
export function taipeiDateKey(isoString) {
  const d = new Date(isoString);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const get = (type) => parts.find((p) => p.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

// For a plain "YYYY-MM-DD" calendar date (not an instant) -- format anchored
// to UTC so the label always matches the date string exactly, regardless of
// the machine's local timezone.
export function dateLabel(dateStr) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return new Intl.DateTimeFormat('zh-Hant-TW', {
    timeZone: 'UTC',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  }).format(d);
}

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
