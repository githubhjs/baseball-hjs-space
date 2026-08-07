import { teamInfo, teamLogoUrl } from './teams.mjs';
import { DIVISIONS } from './format.mjs';
import { escapeHtml } from './format.mjs';

function streakZh(streak) {
  if (!streak?.streakCode) return '-';
  const n = streak.streakNumber;
  return streak.streakType === 'wins' ? `${n} 連勝` : `${n} 連敗`;
}

function lastTen(record) {
  const l10 = record.records?.splitRecords?.find((r) => r.type === 'lastTen');
  return l10 ? `${l10.wins}-${l10.losses}` : '-';
}

function teamCell(teamId) {
  const team = teamInfo(teamId);
  return `<img class="team-logo-sm" src="${teamLogoUrl(teamId)}" alt="" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-block';"><span class="team-color-dot" style="background:${team.color};display:none"></span>${team.full}`;
}

export function renderDivisionTable(division, teamRecords) {
  const rows = teamRecords
    .map((r) => {
      const gb = r.divisionGamesBack === '-' ? '-' : r.divisionGamesBack;
      return `
      <tr>
        <td class="cell-team">${teamCell(r.team.id)}</td>
        <td>${r.leagueRecord.wins}</td>
        <td>${r.leagueRecord.losses}</td>
        <td>${r.leagueRecord.pct}</td>
        <td>${gb}</td>
        <td>${lastTen(r)}</td>
        <td>${streakZh(r.streak)}</td>
      </tr>`;
    })
    .join('');

  return `
  <section class="division-block">
    <h3 class="division-title">${escapeHtml(DIVISIONS[division.id] || division.id)}</h3>
    <div class="table-scroll">
      <table class="standings-table">
        <thead>
          <tr>
            <th>球隊</th>
            <th>勝</th>
            <th>敗</th>
            <th>勝率</th>
            <th>勝差</th>
            <th>近十戰</th>
            <th>連勝敗</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </section>`;
}

const LEAGUE_ZH = { 103: '美聯', 104: '國聯' };

export function renderWildCardTable(leagueId, teamRecords) {
  const rows = teamRecords
    .map((r) => {
      const rank = Number(r.wildCardRank);
      const isIn = rank <= 3;
      const wcgb = r.wildCardGamesBack === '-' ? '-' : r.wildCardGamesBack;
      return `
      <tr class="${isIn ? 'wc-in' : ''}">
        <td>${rank}</td>
        <td class="cell-team">${teamCell(r.team.id)}</td>
        <td>${r.leagueRecord.wins}</td>
        <td>${r.leagueRecord.losses}</td>
        <td>${r.leagueRecord.pct}</td>
        <td>${wcgb}</td>
        <td>${lastTen(r)}</td>
      </tr>`;
    })
    .join('');

  return `
  <section class="division-block">
    <h3 class="division-title">${escapeHtml(LEAGUE_ZH[leagueId] || leagueId)}外卡</h3>
    <p class="wc-legend"><span class="wc-dot wc-in-dot"></span>晉級外卡戰　<span class="wc-dot"></span>目前落榜</p>
    <div class="table-scroll">
      <table class="standings-table">
        <thead>
          <tr>
            <th>順位</th>
            <th>球隊</th>
            <th>勝</th>
            <th>敗</th>
            <th>勝率</th>
            <th>外卡差</th>
            <th>近十戰</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </section>`;
}
