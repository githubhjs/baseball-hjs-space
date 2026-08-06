import { teamInfo } from './teams.mjs';
import { escapeHtml } from './format.mjs';

export const PLAYER_BATTING_CATS = [
  { key: 'battingAverage', label: '打擊率' },
  { key: 'homeRuns', label: '全壘打' },
  { key: 'runsBattedIn', label: '打點' },
  { key: 'stolenBases', label: '盜壘' },
  { key: 'onBasePlusSlugging', label: 'OPS' },
];

export const PLAYER_PITCHING_CATS = [
  { key: 'earnedRunAverage', label: '防禦率' },
  { key: 'wins', label: '勝投' },
  { key: 'strikeouts', label: '三振' },
  { key: 'saves', label: '救援成功' },
  { key: 'walksAndHitsPerInningPitched', label: 'WHIP' },
];

export const TEAM_BATTING_CATS = [
  { key: 'avg', label: '打擊率', dir: 'desc' },
  { key: 'homeRuns', label: '全壘打', dir: 'desc' },
  { key: 'rbi', label: '打點', dir: 'desc' },
  { key: 'ops', label: 'OPS', dir: 'desc' },
];

export const TEAM_PITCHING_CATS = [
  { key: 'era', label: '防禦率', dir: 'asc' },
  { key: 'strikeOuts', label: '三振', dir: 'desc' },
  { key: 'saves', label: '救援成功', dir: 'desc' },
  { key: 'whip', label: 'WHIP', dir: 'asc' },
];

export function playerRowsFromLeaders(leagueLeaders, catKey) {
  const category = leagueLeaders.find((c) => c.leaderCategory === catKey);
  if (!category) return [];
  return category.leaders.slice(0, 10).map((l) => ({
    name: l.person.fullName,
    teamShort: teamInfo(l.team.id).short,
    value: l.value,
  }));
}

export function teamRowsFromStats(splits, statKey, dir) {
  const sorted = [...splits].sort((a, b) => {
    const av = parseFloat(a.stat[statKey]);
    const bv = parseFloat(b.stat[statKey]);
    return dir === 'asc' ? av - bv : bv - av;
  });
  return sorted.slice(0, 10).map((s) => ({
    name: teamInfo(s.team.id).full,
    teamShort: teamInfo(s.team.id).short,
    value: s.stat[statKey],
  }));
}

export function renderLeaderCard(title, rows, { showTeamColumn = true } = {}) {
  const rowsHtml = rows
    .map(
      (r, i) => `
      <li class="leader-row">
        <span class="leader-rank">${i + 1}</span>
        <span class="leader-name">${escapeHtml(r.name)}</span>
        ${showTeamColumn ? `<span class="leader-team">${escapeHtml(r.teamShort)}</span>` : ''}
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
