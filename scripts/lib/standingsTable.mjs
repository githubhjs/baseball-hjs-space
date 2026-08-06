import { teamInfo } from './teams.mjs';
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

export function renderDivisionTable(division, teamRecords) {
  const rows = teamRecords
    .map((r) => {
      const team = teamInfo(r.team.id);
      const gb = r.divisionGamesBack === '-' ? '-' : r.divisionGamesBack;
      return `
      <tr>
        <td class="cell-team"><span class="team-color-dot" style="background:${team.color}"></span>${team.full}</td>
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
