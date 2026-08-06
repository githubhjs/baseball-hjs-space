import { escapeHtml } from './format.mjs';

export const BATTER_ADVANCED_CATS = [
  { label: '預期 wOBA（xwOBA）', source: 'expected', key: 'estWoba', dir: 'desc' },
  { label: 'wOBA（官方實際值）', source: 'expected', key: 'woba', dir: 'desc' },
  { label: '預期打擊率（xBA）', source: 'expected', key: 'estBa', dir: 'desc' },
  { label: '平均出球速度', source: 'battedball', key: 'avgHitSpeed', dir: 'desc', unit: ' mph' },
  { label: '標準桶率（Barrel%）', source: 'battedball', key: 'barrelPercent', dir: 'desc', unit: '%' },
  { label: '衝刺速度', source: 'sprintspeed', key: 'sprintSpeed', dir: 'desc', unit: ' ft/s' },
];

export const PITCHER_ADVANCED_CATS = [
  { label: '預期防禦率（xERA）', source: 'expected', key: 'xera', dir: 'asc' },
  { label: '被打者 xwOBA', source: 'expected', key: 'estWoba', dir: 'asc' },
  { label: '被打出平均出球速度', source: 'battedball', key: 'avgHitSpeed', dir: 'asc', unit: ' mph' },
  { label: '被打出標準桶率', source: 'battedball', key: 'barrelPercent', dir: 'asc', unit: '%' },
];

export function advancedRows(dataBySource, cat) {
  const rows = dataBySource[cat.source] ?? [];
  const withValue = rows.filter((r) => r[cat.key] !== undefined && r[cat.key] !== '' && r[cat.key] !== null);
  const sorted = [...withValue].sort((a, b) => {
    const av = parseFloat(a[cat.key]);
    const bv = parseFloat(b[cat.key]);
    return cat.dir === 'asc' ? av - bv : bv - av;
  });
  return sorted.slice(0, 10).map((r) => ({
    name: r.name,
    value: `${r[cat.key]}${cat.unit ?? ''}`,
  }));
}

export function renderAdvancedCard(title, rows) {
  const rowsHtml = rows
    .map(
      (r, i) => `
      <li class="leader-row">
        <span class="leader-rank">${i + 1}</span>
        <span class="leader-name">${escapeHtml(r.name)}</span>
        <span class="leader-value">${escapeHtml(r.value)}</span>
      </li>`
    )
    .join('');

  return `
  <div class="leader-card">
    <h4 class="leader-card-title">${escapeHtml(title)}</h4>
    <ol class="leader-list">${rowsHtml || '<li class="leader-empty">暫無資料</li>'}</ol>
  </div>`;
}
