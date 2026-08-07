import { mkdir, writeFile, copyFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  fetchScheduleRange,
  fetchStandings,
  fetchPlayerLeaders,
  fetchTeamStats,
  todayOfficialDate,
  offsetDate,
} from './lib/mlbApi.mjs';
import { renderGameCard } from './lib/gameCard.mjs';
import { renderDivisionTable } from './lib/standingsTable.mjs';
import { page } from './lib/layout.mjs';
import { taipeiDateStamp, taipeiDateKey, dateLabel } from './lib/format.mjs';
import { renderDateNav } from './lib/dateNav.mjs';
import {
  PLAYER_BATTING_CATS,
  PLAYER_PITCHING_CATS,
  TEAM_BATTING_CATS,
  TEAM_PITCHING_CATS,
  playerRowsFromLeaders,
  teamRowsFromStats,
  renderLeaderCard,
} from './lib/leaders.mjs';
import { fetchExpectedStats, fetchStatcastBattedBall, fetchSprintSpeed } from './lib/savantApi.mjs';
import { BATTER_ADVANCED_CATS, PITCHER_ADVANCED_CATS, advancedRows, renderAdvancedCard } from './lib/advanced.mjs';
import { renderHistoryBody } from './lib/historyPage.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const ASSETS = path.join(ROOT, 'assets');

const DIVISION_ORDER = [201, 202, 200, 204, 205, 203]; // AL East/Central/West, NL East/Central/West

const SCHEDULE_WINDOW_DAYS = 7; // days before/after today shown in the date-nav strip

async function main() {
  const date = taipeiDateKey(new Date().toISOString()); // "today" means today in Taipei, not US officialDate
  const season = todayOfficialDate().slice(0, 4);
  const generatedAt = taipeiDateStamp(new Date().toISOString());
  const rangeStart = offsetDate(date, -SCHEDULE_WINDOW_DAYS);
  const rangeEnd = offsetDate(date, SCHEDULE_WINDOW_DAYS);
  const windowDates = [];
  for (let d = rangeStart; d <= rangeEnd; d = offsetDate(d, 1)) windowDates.push(d);

  // Fetch a couple of extra days of US-officialDate padding on each side: a
  // US game's officialDate almost always lands one Taipei calendar date
  // later once converted, so the raw fetch window must be shifted/padded to
  // fully cover the Taipei-anchored window after re-bucketing below.
  const fetchStart = offsetDate(rangeStart, -2);
  const fetchEnd = offsetDate(rangeEnd, 1);

  const [rawGamesByDate, standings, playerBatting, playerPitching, teamBatting, teamPitching] = await Promise.all([
    fetchScheduleRange(fetchStart, fetchEnd),
    fetchStandings(season),
    fetchPlayerLeaders(season, PLAYER_BATTING_CATS.map((c) => c.key), 'hitting'),
    fetchPlayerLeaders(season, PLAYER_PITCHING_CATS.map((c) => c.key), 'pitching'),
    fetchTeamStats(season, 'hitting'),
    fetchTeamStats(season, 'pitching'),
  ]);

  // Re-bucket every game by its real Taipei calendar date (derived from the
  // actual game instant), not the US officialDate bucket the API grouped it
  // under -- otherwise the date-nav label and the game times shown under it
  // disagree (verified: nearly every game shifts +1 day once converted).
  const gamesByDate = new Map();
  for (const games of rawGamesByDate.values()) {
    for (const game of games) {
      const key = taipeiDateKey(game.gameDate);
      if (!gamesByDate.has(key)) gamesByDate.set(key, []);
      gamesByDate.get(key).push(game);
    }
  }

  const standingsBody = renderStandingsBody(standings);
  const leadersBody = renderLeadersBody({ playerBatting, playerPitching, teamBatting, teamPitching });
  const advancedBody = await buildAdvancedBody(season);

  await mkdir(DIST, { recursive: true });
  await mkdir(path.join(DIST, 'standings'), { recursive: true });
  await mkdir(path.join(DIST, 'leaders'), { recursive: true });
  await mkdir(path.join(DIST, 'advanced'), { recursive: true });
  await mkdir(path.join(DIST, 'history'), { recursive: true });

  let totalGames = 0;
  for (const d of windowDates) {
    const games = (gamesByDate.get(d) ?? []).slice().sort((a, b) => new Date(a.gameDate) - new Date(b.gameDate));
    totalGames += games.length;
    const isToday = d === date;
    const body = renderScheduleDayBody(d, games, windowDates, date);
    const outPath = isToday
      ? path.join(DIST, 'index.html')
      : path.join(DIST, 'schedule', d, 'index.html');
    if (!isToday) await mkdir(path.join(DIST, 'schedule', d), { recursive: true });
    await writeFile(
      outPath,
      page({
        title: isToday
          ? 'MLB 今日賽事即時比分 | baseball.hjs.space'
          : `MLB ${dateLabel(d)} 賽事 | baseball.hjs.space`,
        description: `MLB 美國職棒大聯盟 ${dateLabel(d)} 賽事、比分與戰況，繁體中文呈現。`,
        active: 'today',
        body,
        generatedAt,
        canonicalPath: isToday ? '/' : `/schedule/${d}/`,
      })
    );
  }

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

  await writeFile(
    path.join(DIST, 'advanced', 'index.html'),
    page({
      title: 'MLB 進階數據 | baseball.hjs.space',
      description: 'MLB Statcast 官方進階數據：xwOBA、xERA、出球速度、標準桶率、衝刺速度，繁體中文呈現。',
      active: 'advanced',
      body: advancedBody,
      generatedAt,
    })
  );

  await writeFile(
    path.join(DIST, 'history', 'index.html'),
    page({
      title: 'MLB 歷史數據 | baseball.hjs.space',
      description: 'MLB 歷史戰績排名、數據王與球員生涯數據查詢，任意年度，繁體中文呈現。',
      active: 'history',
      body: renderHistoryBody(),
      generatedAt,
      extraScripts: '<script src="/history.js?v=1" defer></script>',
    })
  );

  if (existsSync(path.join(ASSETS, 'style.css'))) {
    await copyFile(path.join(ASSETS, 'style.css'), path.join(DIST, 'style.css'));
  }
  if (existsSync(path.join(ASSETS, 'favicon.svg'))) {
    await copyFile(path.join(ASSETS, 'favicon.svg'), path.join(DIST, 'favicon.svg'));
  }
  if (existsSync(path.join(ASSETS, 'history.js'))) {
    await copyFile(path.join(ASSETS, 'history.js'), path.join(DIST, 'history.js'));
  }
  await writeFile(
    path.join(DIST, 'robots.txt'),
    'User-agent: *\nAllow: /\nSitemap: https://baseball.hjs.space/sitemap.xml\n'
  );
  const scheduleUrls = windowDates
    .map((d) => (d === date ? '' : `  <url><loc>https://baseball.hjs.space/schedule/${d}/</loc></url>\n`))
    .join('');
  await writeFile(
    path.join(DIST, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>https://baseball.hjs.space/</loc></url>\n${scheduleUrls}  <url><loc>https://baseball.hjs.space/standings/</loc></url>\n  <url><loc>https://baseball.hjs.space/leaders/</loc></url>\n  <url><loc>https://baseball.hjs.space/advanced/</loc></url>\n  <url><loc>https://baseball.hjs.space/history/</loc></url>\n</urlset>\n`
  );

  console.log(`Built ${totalGames} games across ${windowDates.length} days + ${standings.length} standings groups.`);
}

function renderScheduleDayBody(dateStr, games, windowDates, todayDate) {
  const nav = renderDateNav(windowDates, dateStr, todayDate);
  const heading = dateStr === todayDate ? '今日賽事' : `${dateLabel(dateStr)} 賽事`;
  if (games.length === 0) {
    return `
    <h1 class="page-title">${heading}</h1>
    ${nav}
    <p class="empty-state">${dateStr} 沒有安排 MLB 賽事。</p>`;
  }
  const cards = games.map(renderGameCard).join('\n');
  return `
    <h1 class="page-title">${heading}</h1>
    ${nav}
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

async function buildAdvancedBody(season) {
  let batterExpected = [];
  let batterBattedBall = [];
  let sprintSpeed = [];
  let pitcherExpected = [];
  let pitcherBattedBall = [];
  let fetchFailed = false;

  try {
    [batterExpected, batterBattedBall, sprintSpeed, pitcherExpected, pitcherBattedBall] = await Promise.all([
      fetchExpectedStats(season, 'batter'),
      fetchStatcastBattedBall(season, 'batter'),
      fetchSprintSpeed(season),
      fetchExpectedStats(season, 'pitcher'),
      fetchStatcastBattedBall(season, 'pitcher'),
    ]);
  } catch (err) {
    // Isolated on purpose: Baseball Savant is a separate system from the
    // official MLB Stats API used everywhere else on this site. If Savant
    // has an outage or changes its export format, the rest of the site
    // (today's games, standings, leaders) must still build successfully.
    console.error('Baseball Savant fetch failed, rendering empty-state advanced page:', err);
    fetchFailed = true;
  }

  if (fetchFailed) {
    return `
    <h1 class="page-title">進階數據</h1>
    <p class="empty-state">Baseball Savant 官方數據暫時無法取得，請稍後再試。</p>`;
  }

  const batterCards = BATTER_ADVANCED_CATS.map((cat) =>
    renderAdvancedCard(
      cat.label,
      advancedRows({ expected: batterExpected, battedball: batterBattedBall, sprintspeed: sprintSpeed }, cat)
    )
  ).join('\n');

  const pitcherCards = PITCHER_ADVANCED_CATS.map((cat) =>
    renderAdvancedCard(cat.label, advancedRows({ expected: pitcherExpected, battedball: pitcherBattedBall }, cat))
  ).join('\n');

  return `
    <h1 class="page-title">進階數據</h1>
    <p class="page-subtitle">資料來源：Baseball Savant（MLB 官方 Statcast 追蹤系統），非 FanGraphs／Baseball-Reference 資料。</p>
    <section class="leaders-section">
      <h2 class="leaders-section-title">打者 · Statcast</h2>
      <div class="leaders-grid">${batterCards}</div>
    </section>
    <section class="leaders-section">
      <h2 class="leaders-section-title">投手 · Statcast</h2>
      <div class="leaders-grid">${pitcherCards}</div>
    </section>`;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
