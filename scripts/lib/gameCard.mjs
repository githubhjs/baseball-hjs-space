import { teamInfo, teamLogoUrl } from './teams.mjs';
import { taipeiDateTime, escapeHtml } from './format.mjs';

const INNING_STATE_ZH = {
  Top: '局上',
  Bottom: '局下',
  Middle: '局中',
  End: '局後',
};

function inningLabel(linescore) {
  if (!linescore || !linescore.currentInning) return '';
  const state = INNING_STATE_ZH[linescore.inningState] || '';
  return `第 ${linescore.currentInning} ${state}`;
}

function statusBadge(status) {
  const state = status.abstractGameState;
  if (state === 'Live') return { text: '直播中', cls: 'badge-live' };
  if (state === 'Final') return { text: '已結束', cls: 'badge-final' };
  if (status.detailedState === 'Postponed') return { text: '延賽', cls: 'badge-postponed' };
  if (status.detailedState === 'Suspended') return { text: '中止', cls: 'badge-postponed' };
  return { text: '未開始', cls: 'badge-preview' };
}

function teamLogo(team) {
  return `<img class="team-logo" src="${teamLogoUrl(team.id)}" alt="" width="22" height="22" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-block';"><span class="team-color-dot" style="background:${team.info.color};display:none"></span>`;
}

function recordSuffix(person, pitcherRecords) {
  if (!person) return '';
  const record = pitcherRecords?.get(person.id);
  if (!record) return '';
  return record.saves ? `（${record.wins}-${record.losses}，${record.saves}S）` : `（${record.wins}-${record.losses}）`;
}

function homeRunsLine(homeRuns) {
  if (!homeRuns || homeRuns.length === 0) return '';
  const parts = homeRuns.map((hr) => {
    const team = teamInfo(hr.teamId);
    const countSuffix = hr.count > 1 ? ` x${hr.count}` : '';
    return `${escapeHtml(hr.name)}（${escapeHtml(team.short)}）${countSuffix}`;
  });
  return `<p class="game-homeruns">⚾ 全壘打：${parts.join('　')}</p>`;
}

export function renderGameCard(game, boxscore) {
  const awayInfo = teamInfo(game.teams.away.team.id);
  const homeInfo = teamInfo(game.teams.home.team.id);
  const away = { id: game.teams.away.team.id, info: awayInfo };
  const home = { id: game.teams.home.team.id, info: homeInfo };
  const badge = statusBadge(game.status);
  const isLive = game.status.abstractGameState === 'Live';
  const isFinal = game.status.abstractGameState === 'Final';
  const linescore = game.linescore;

  const awayScore = linescore?.teams?.away?.runs;
  const homeScore = linescore?.teams?.home?.runs;
  const hasScore = (isLive || isFinal) && awayScore !== undefined && homeScore !== undefined;

  const awayProbable = game.teams.away.probablePitcher?.fullName;
  const homeProbable = game.teams.home.probablePitcher?.fullName;

  const pitcherRecords = boxscore?.pitcherRecords;

  let decisionsHtml = '';
  if (isFinal && game.decisions) {
    const parts = [];
    if (game.decisions.winner) {
      parts.push(`勝投 ${escapeHtml(game.decisions.winner.fullName)}${recordSuffix(game.decisions.winner, pitcherRecords)}`);
    }
    if (game.decisions.loser) {
      parts.push(`敗投 ${escapeHtml(game.decisions.loser.fullName)}${recordSuffix(game.decisions.loser, pitcherRecords)}`);
    }
    if (game.decisions.save) {
      parts.push(`救援 ${escapeHtml(game.decisions.save.fullName)}${recordSuffix(game.decisions.save, pitcherRecords)}`);
    }
    if (parts.length) decisionsHtml = `<p class="game-decisions">${parts.join('　')}</p>`;
  }

  let probableHtml = '';
  if (!hasScore && (awayProbable || homeProbable)) {
    probableHtml = `<p class="game-probable">先發投手：${escapeHtml(awayProbable || '未定')} vs ${escapeHtml(homeProbable || '未定')}</p>`;
  }

  const homeRunsHtml = (isFinal || isLive) ? homeRunsLine(boxscore?.homeRuns) : '';

  const inningText = isLive ? inningLabel(linescore) : '';

  return `
  <article class="game-card${isLive ? ' is-live' : ''}">
    <div class="game-card-top">
      <span class="badge ${badge.cls}">${badge.text}</span>
      <span class="game-meta">${taipeiDateTime(game.gameDate)}</span>
    </div>
    ${inningText ? `<p class="game-inning">${escapeHtml(inningText)}</p>` : ''}
    <div class="matchup">
      <div class="team-row">
        ${teamLogo(away)}
        <span class="team-name">${away.info.full}</span>
        ${hasScore ? `<span class="team-score">${awayScore}</span>` : ''}
      </div>
      <div class="team-row">
        ${teamLogo(home)}
        <span class="team-name">${home.info.full}</span>
        ${hasScore ? `<span class="team-score">${homeScore}</span>` : ''}
      </div>
    </div>
    ${decisionsHtml}
    ${probableHtml}
    ${homeRunsHtml}
    <p class="game-venue">${escapeHtml(game.venue?.name || '')}</p>
  </article>`;
}
