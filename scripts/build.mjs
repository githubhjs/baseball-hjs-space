import { mkdir, writeFile, copyFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { fetchSchedule, fetchStandings, todayOfficialDate } from './lib/mlbApi.mjs';
import { renderGameCard } from './lib/gameCard.mjs';
import { renderDivisionTable } from './lib/standingsTable.mjs';
import { page } from './lib/layout.mjs';
import { taipeiDateStamp } from './lib/format.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const ASSETS = path.join(ROOT, 'assets');

const DIVISION_ORDER = [201, 202, 200, 204, 205, 203]; // AL East/Central/West, NL East/Central/West

async function main() {
  const date = todayOfficialDate();
  const season = date.slice(0, 4);
  const generatedAt = taipeiDateStamp(new Date().toISOString());

  const [games, standings] = await Promise.all([
    fetchSchedule(date),
    fetchStandings(season),
  ]);

  games.sort((a, b) => new Date(a.gameDate) - new Date(b.gameDate));

  const todayBody = renderTodayBody(games, date);
  const standingsBody = renderStandingsBody(standings);

  await mkdir(DIST, { recursive: true });
  await mkdir(path.join(DIST, 'standings'), { recursive: true });

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
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>https://baseball.hjs.space/</loc></url>\n  <url><loc>https://baseball.hjs.space/standings/</loc></url>\n</urlset>\n`
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

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
