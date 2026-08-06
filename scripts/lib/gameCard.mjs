import { teamInfo } from './teams.mjs';
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

export function renderGameCard(game) {
  const away = teamInfo(game.teams.away.team.id);
  const home = teamInfo(game.teams.home.team.id);
  const badge = statusBadge(game.status);
  const isLive = game.status.abstractGameState === 'Live';
  const isFinal = game.status.abstractGameState === 'Final';
  const linescore = game.linescore;

  const awayScore = linescore?.teams?.away?.runs;
  const homeScore = linescore?.teams?.home?.runs;
  const hasScore = (isLive || isFinal) && awayScore !== undefined && homeScore !== undefined;

  const awayProbable = game.teams.away.probablePitcher?.fullName;
  const homeProbable = game.teams.home.probablePitcher?.fullName;

  let decisionsHtml = '';
  if (isFinal && game.decisions) {
    const parts = [];
    if (game.decisions.winner) parts.push(`勝投 ${escapeHtml(game.decisions.winner.fullName)}`);
    if (game.decisions.loser) parts.push(`敗投 ${escapeHtml(game.decisions.loser.fullName)}`);
    if (game.decisions.save) parts.push(`救援 ${escapeHtml(game.decisions.save.fullName)}`);
    if (parts.length) decisionsHtml = `<p class="game-decisions">${parts.join('　')}</p>`;
  }

  let probableHtml = '';
  if (!hasScore && (awayProbable || homeProbable)) {
    probableHtml = `<p class="game-probable">先發投手：${escapeHtml(awayProbable || '未定')} vs ${escapeHtml(homeProbable || '未定')}</p>`;
  }

  const metaLine = isLive
    ? inningLabel(linescore)
    : isFinal
      ? '最終戰績'
      : taipeiDateTime(game.gameDate);

  return `
  <article class="game-card${isLive ? ' is-live' : ''}">
    <div class="game-card-top">
      <span class="badge ${badge.cls}">${badge.text}</span>
      <span class="game-meta">${metaLine}</span>
    </div>
    <div class="matchup">
      <div class="team-row">
        <span class="team-color-dot" style="background:${away.color}"></span>
        <span class="team-name">${away.full}</span>
        ${hasScore ? `<span class="team-score">${awayScore}</span>` : ''}
      </div>
      <div class="team-row">
        <span class="team-color-dot" style="background:${home.color}"></span>
        <span class="team-name">${home.full}</span>
        ${hasScore ? `<span class="team-score">${homeScore}</span>` : ''}
      </div>
    </div>
    ${decisionsHtml}
    ${probableHtml}
    <p class="game-venue">${escapeHtml(game.venue?.name || '')}</p>
  </article>`;
}
