import { mkdir, writeFile, copyFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { fetchSchedule, fetchStandings, fetchPlayerLeaders, fetchTeamStats, todayOfficialDate } from './lib/mlbApi.mjs';
import { renderGameCard } from './lib/gameCard.mjs';
import { renderDivisionTable } from './lib/standingsTable.mjs';
import { page } from './lib/layout.mjs';
import { taipeiDateStamp } from './lib/format.mjs';
import {
  PLAYER_BATTING_CATS,
  PLAYER_PITCHING_CATS,
  TEAM_BATTING_CATS,
  TEAM_PITCHING_CATS,
  playerRowsFromLeaders,
  teamRowsFromStats,
  renderLeaderCard,
} from './lib/leaders.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const ASSETS = path.join(ROOT, 'assets');

const DIVISION_ORDER = [201, 202, 200, 204, 205, 203]; // AL East/Central/West, NL East/Central/West

async function main() {
  const date = todayOfficialDate();
  const season = date.slice(0, 4);
  const generatedAt = taipeiDateStamp(new Date().toISOString());

  const [games, standings, playerBatting, playerPitching, teamBatting, teamPitching] = await Promise.all([
    fetchSchedule(date),
    fetchStandings(season),
    fetchPlayerLeaders(season, PLAYER_BATTING_CATS.map((c) => c.key), 'hitting'),
    fetchPlayerLeaders(season, PLAYER_PITCHING_CATS.map((c) => c.key), 'pitching'),
    fetchTeamStats(season, 'hitting'),
    fetchTeamStats(season, 'pitching'),
  ]);

  games.sort((a, b) => new Date(a.gameDate) - new Date(b.gameDate));

  const todayBody = renderTodayBody(games, date);
  const standingsBody = renderStandingsBody(standings);
  const leadersBody = renderLeadersBody({ playerBatting, playerPitching, teamBatting, teamPitching });

  await mkdir(DIST, { recursive: true });
  await mkdir(path.join(DIST, 'standings'), { recursive: true });
  await mkdir(path.join(DIST, 'leaders'), { recursive: true });

  await writeFile(
    path.join(DIST, 'index.html'),
    page({
      title: 'MLB 今日賽事即時比分 | baseball.hjs.space',
      description: 'MLB 美國職棒大聯盟今日賽事、即時比分與戰績，繁體中文呈現。',
      active: 'today',
      body: todayBody,
      generatedAt,
    })
  );

  await writeFile(
    path.join(DIST, 'standings', 'index.html'),
    page({
      title: 'MLB 戰績排名 | baseball.hjs.space',
      description: 'MLB 美國職棒大聯盟最新戰績排名，各分區勝負、勝差、近十戰戰績，繁體中文呈現。',
      active: 'standings',
      body: standingsBody,
      generatedAt,
    })
  );

  await writeFile(
    path.join(DIST, 'leaders', 'index.html'),
    page({
      title: 'MLB 數據王 | baseball.hjs.space',
      description: 'MLB 美國職棒大聯盟球員與球隊數據排行榜，打擊率、全壘打、防禦率等，繁體中文呈現。',
      active: 'leaders',
      body: leadersBody,
      generatedAt,
    })
  );

  if (existsSync(path.join(ASSETS, 'style.css'))) {
    await copyFile(path.join(ASSETS, 'style.css'), path.join(DIST, 'style.css'));
  }
  if (existsSync(path.join(ASSETS, 'favicon.svg'))) {
    await copyFile(path.join(ASSETS, 'favicon.svg'), path.join(DIST, 'favicon.svg'));
  }
  await writeFile(
    path.join(DIST, 'robots.txt'),
    'User-agent: *\nAllow: /\nSitemap: https://baseball.hjs.space/sitemap.xml\n'
  );
  await writeFile(
    path.join(DIST, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>https://baseball.hjs.space/</loc></url>\n  <url><loc>https://baseball.hjs.space/standings/</loc></url>\n  <url><loc>https://baseball.hjs.space/leaders/</loc></url>\n</urlset>\n`
  );

  console.log(`Built ${games.length} games + ${standings.length} standings groups for ${date}.`);
}

function renderTodayBody(games, date) {
  if (games.length === 0) {
    return `
    <h1 class="page-title">今日賽事</h1>
    <p class="empty-state">${date} 沒有安排 MLB 賽事。</p>`;
  }
  const cards = games.map(renderGameCard).join('\n');
  return `
    <h1 class="page-title">今日賽事</h1>
    <div class="game-grid">${cards}</div>`;
}

function renderStandingsBody(standings) {
  const byDivision = new Map();
  for (const record of standings) {
    byDivision.set(record.division.id, record);
  }
  const sections = DIVISION_ORDER
    .filter((id) => byDivision.has(id))
    .map((id) => {
      const record = byDivision.get(id);
      return renderDivisionTable(record.division, record.teamRecords);
    })
    .join('\n');

  return `
    <h1 class="page-title">戰績排名</h1>
    <div class="standings-grid">${sections}</div>`;
}

function renderLeadersBody({ playerBatting, playerPitching, teamBatting, teamPitching }) {
  const playerBattingCards = PLAYER_BATTING_CATS.map((cat) =>
    renderLeaderCard(cat.label, playerRowsFromLeaders(playerBatting, cat.key))
  ).join('\n');

  const playerPitchingCards = PLAYER_PITCHING_CATS.map((cat) =>
    renderLeaderCard(cat.label, playerRowsFromLeaders(playerPitching, cat.key))
  ).join('\n');

  const teamBattingCards = TEAM_BATTING_CATS.map((cat) =>
    renderLeaderCard(cat.label, teamRowsFromStats(teamBatting, cat.key, cat.dir), { showTeamColumn: false })
  ).join('\n');

  const teamPitchingCards = TEAM_PITCHING_CATS.map((cat) =>
    renderLeaderCard(cat.label, teamRowsFromStats(teamPitching, cat.key, cat.dir), { showTeamColumn: false })
  ).join('\n');

  return `
    <h1 class="page-title">數據王</h1>
    <section class="leaders-section">
      <h2 class="leaders-section-title">球員 · 打擊</h2>
      <div class="leaders-grid">${playerBattingCards}</div>
    </section>
    <section class="leaders-section">
      <h2 class="leaders-section-title">球員 · 投球</h2>
      <div class="leaders-grid">${playerPitchingCards}</div>
    </section>
    <section class="leaders-section">
      <h2 class="leaders-section-title">球隊 · 打擊</h2>
      <div class="leaders-grid">${teamBattingCards}</div>
    </section>
    <section class="leaders-section">
      <h2 class="leaders-section-title">球隊 · 投球</h2>
      <div class="leaders-grid">${teamPitchingCards}</div>
    </section>`;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
