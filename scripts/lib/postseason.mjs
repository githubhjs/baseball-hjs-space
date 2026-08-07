import { teamInfo, teamLogoUrl } from './teams.mjs';
import { escapeHtml } from './format.mjs';

const LEAGUE_DIVISIONS = {
  103: [200, 201, 202], // AL West/East/Central
  104: [203, 204, 205], // NL West/East/Central
};
const LEAGUE_ZH = { 103: '美聯', 104: '國聯' };

// Current (2022+) MLB format: 3 division winners + 3 wild cards per league,
// seeded 1-6 by record. Seeds 1-2 get a bye to the Division Series; the
// Wild Card round is 3-vs-6 and 4-vs-5, higher seed hosts every game.
// Seeding uses the API's own divisionRank/wildCardRank fields rather than
// hand-computing tiebreakers.
export function computeBracket(regularSeasonRecords, wildCardRecords) {
  const brackets = {};
  for (const leagueId of [103, 104]) {
    const divisionIds = LEAGUE_DIVISIONS[leagueId];
    const divisionWinners = regularSeasonRecords
      .filter((r) => divisionIds.includes(r.division?.id))
      .map((r) => r.teamRecords.find((t) => t.divisionRank === '1'))
      .filter(Boolean)
      .sort((a, b) => parseFloat(b.leagueRecord.pct) - parseFloat(a.leagueRecord.pct));

    const wcRecord = wildCardRecords.find((r) => r.league?.id === leagueId);
    const wildCardTeams = (wcRecord?.teamRecords ?? [])
      .filter((t) => Number(t.wildCardRank) >= 1 && Number(t.wildCardRank) <= 3)
      .sort((a, b) => Number(a.wildCardRank) - Number(b.wildCardRank));

    const seeds = [...divisionWinners, ...wildCardTeams].slice(0, 6);
    if (seeds.length < 6) {
      brackets[leagueId] = null; // season/data incomplete -- don't render a broken bracket
      continue;
    }

    brackets[leagueId] = {
      seeds,
      byes: [seeds[0], seeds[1]],
      wildCardMatchups: [
        { host: seeds[2], visitor: seeds[5], hostSeed: 3, visitorSeed: 6 },
        { host: seeds[3], visitor: seeds[4], hostSeed: 4, visitorSeed: 5 },
      ],
    };
  }
  return brackets;
}

function seedCard(team, seedNumber) {
  const info = teamInfo(team.team.id);
  return `
  <div class="seed-card">
    <span class="seed-number">#${seedNumber}</span>
    <img class="team-logo-sm" src="${teamLogoUrl(team.team.id)}" alt="" loading="lazy" onerror="this.style.display='none'">
    <span class="seed-team-name">${escapeHtml(info.full)}</span>
    <span class="seed-record">${team.leagueRecord.wins}-${team.leagueRecord.losses}</span>
  </div>`;
}

function matchupCard(matchup) {
  return `
  <div class="matchup-card">
    ${seedCard(matchup.host, matchup.hostSeed)}
    <span class="matchup-vs">vs</span>
    ${seedCard(matchup.visitor, matchup.visitorSeed)}
    <p class="matchup-note">外卡系列賽（${escapeHtml(teamInfo(matchup.host.team.id).short)}主場）</p>
  </div>`;
}

function leagueBracketHtml(leagueId, bracket) {
  if (!bracket) {
    return `
    <section class="division-block">
      <h3 class="division-title">${LEAGUE_ZH[leagueId]}</h3>
      <p class="empty-state">賽季資料不足，暫無法推算對戰組合。</p>
    </section>`;
  }
  const byesHtml = bracket.byes.map((t, i) => seedCard(t, i + 1)).join('');
  const matchupsHtml = bracket.wildCardMatchups.map(matchupCard).join('');

  return `
  <section class="postseason-league">
    <h3 class="division-title">${LEAGUE_ZH[leagueId]}</h3>
    <div class="postseason-tier">
      <h4 class="postseason-tier-title">第 1-2 種子（直接晉級分區系列賽）</h4>
      <div class="seed-row">${byesHtml}</div>
    </div>
    <div class="postseason-tier">
      <h4 class="postseason-tier-title">外卡戰（第 3-6 種子）</h4>
      <div class="matchup-row">${matchupsHtml}</div>
    </div>
  </section>`;
}

export function renderPostseasonBody(brackets) {
  return `
    <h1 class="page-title">季後賽推算</h1>
    <p class="page-subtitle">假設賽季今日結束，依目前戰績排名推算的季後賽對戰組合（美聯／國聯各 6 隊，第 1-2 種子輪空晉級分區系列賽，第 3 打第 6、第 4 打第 5，戰績較佳者主場）。僅為即時推算，非官方正式對戰表，最終結果須以球季實際結束戰績為準。</p>
    <div class="postseason-grid">
      ${leagueBracketHtml(103, brackets[103])}
      ${leagueBracketHtml(104, brackets[104])}
    </div>`;
}
