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
// Division Series pairings are fixed by bracket slot, not re-seeded after
// the Wild Card round: #1 always plays the 4/5 winner, #2 always plays the
// 3/6 winner. Seeding uses the API's own divisionRank/wildCardRank fields
// rather than hand-computing tiebreakers.
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

function seedMini(team, seedNumber) {
  const info = teamInfo(team.team.id);
  return `
  <span class="seed-mini">
    <span class="seed-mini-number">#${seedNumber}</span>
    <img class="team-logo-sm" src="${teamLogoUrl(team.team.id)}" alt="" width="18" height="18" loading="lazy" onerror="this.style.display='none'">
    <span class="seed-mini-name">${escapeHtml(info.short)}</span>
    <span class="seed-mini-record">${team.leagueRecord.wins}-${team.leagueRecord.losses}</span>
  </span>`;
}

function byeMatch(team, seedNumber) {
  return `
  <div class="bracket-match bracket-bye">
    ${seedMini(team, seedNumber)}
    <span class="bracket-tag">輪空晉級</span>
  </div>`;
}

function wcMatch(matchup) {
  const hostShort = escapeHtml(teamInfo(matchup.host.team.id).short);
  return `
  <div class="bracket-match">
    ${seedMini(matchup.host, matchup.hostSeed)}
    <span class="bracket-vs">vs</span>
    ${seedMini(matchup.visitor, matchup.visitorSeed)}
    <span class="bracket-tag">${hostShort}主場</span>
  </div>`;
}

function tbdMatch(label, sideA, sideB) {
  return `
  <div class="bracket-match bracket-tbd">
    <span class="bracket-tbd-label">${escapeHtml(label)}</span>
    <span class="bracket-tbd-side">${sideA}</span>
    <span class="bracket-vs">vs</span>
    <span class="bracket-tbd-side">${sideB}</span>
  </div>`;
}

function seedTag(team, seedNumber) {
  const info = teamInfo(team.team.id);
  return `#${seedNumber} ${escapeHtml(info.short)}`;
}

function leagueBracketHtml(leagueId, bracket) {
  const leagueName = LEAGUE_ZH[leagueId];
  if (!bracket) {
    return `
    <div class="postseason-league">
      <h3 class="division-title">${leagueName}</h3>
      <p class="empty-state">賽季資料不足，暫無法推算對戰組合。</p>
    </div>`;
  }
  const [seed1, seed2] = bracket.byes;
  const [wc36, wc45] = bracket.wildCardMatchups;

  return `
  <div class="postseason-league">
    <h3 class="division-title">${leagueName}</h3>
    <div class="bracket">
      <div class="bracket-round">
        <span class="bracket-round-title">外卡輪</span>
        <div class="bracket-pair">
          ${byeMatch(seed1, 1)}
          ${wcMatch(wc45)}
        </div>
        <div class="bracket-pair">
          ${byeMatch(seed2, 2)}
          ${wcMatch(wc36)}
        </div>
      </div>
      <div class="bracket-round">
        <span class="bracket-round-title">分區系列賽</span>
        <div class="bracket-pair">
          ${tbdMatch('分區系列賽 A', seedTag(seed1, 1), `#4/5 勝者`)}
          ${tbdMatch('分區系列賽 B', seedTag(seed2, 2), `#3/6 勝者`)}
        </div>
      </div>
      <div class="bracket-round">
        <span class="bracket-round-title">聯盟冠軍賽</span>
        <div class="bracket-single">
          ${tbdMatch(`${leagueName}冠軍賽`, '系列賽 A 勝者', '系列賽 B 勝者')}
        </div>
      </div>
    </div>
  </div>`;
}

export function renderPostseasonBody(brackets) {
  return `
    <h1 class="page-title">季後賽推算</h1>
    <p class="page-subtitle">假設賽季今日結束，依目前戰績排名推算的季後賽對戰組合（美聯／國聯各 6 隊，第 1-2 種子輪空晉級分區系列賽，第 3 打第 6、第 4 打第 5，戰績較佳者主場）。分區系列賽及以後的對戰組合尚未發生，以「待定」標示。僅為即時推算，非官方正式對戰表，最終結果須以球季實際結束戰績為準。</p>
    <div class="postseason-brackets">
      ${leagueBracketHtml(103, brackets[103])}
      ${leagueBracketHtml(104, brackets[104])}
    </div>
    <div class="postseason-league postseason-worldseries">
      <h3 class="division-title">世界大賽</h3>
      <div class="bracket-single bracket-single-center">
        ${tbdMatch('世界大賽', '美聯冠軍', '國聯冠軍')}
      </div>
    </div>`;
}
