import { dateLabel, escapeHtml } from './format.mjs';

export function renderDateNav(dates, activeDate, todayDate) {
  const pills = dates
    .map((d) => {
      const href = d === todayDate ? '/' : `/schedule/${d}/`;
      const isActive = d === activeDate;
      const label = d === todayDate ? `今日 ${dateLabel(d)}` : dateLabel(d);
      return `<a href="${href}" class="date-pill${isActive ? ' active' : ''}">${escapeHtml(label)}</a>`;
    })
    .join('');

  return `<nav class="date-nav">${pills}</nav>`;
}
