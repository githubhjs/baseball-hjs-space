import { parseCsv, savantNameToDisplay } from './csv.mjs';

const BASE = 'https://baseballsavant.mlb.com';

async function getCsv(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'baseball-hjs-space/1.0 (+https://baseball.hjs.space)' } });
  if (!res.ok) throw new Error(`Savant ${res.status} for ${url}`);
  const text = await res.text();
  return parseCsv(text);
}

// Official Statcast expected stats: real wOBA/xwOBA/xBA/xSLG (+ xERA for pitchers).
// This is MLB's own tracking-system data, not a third-party proprietary metric.
export async function fetchExpectedStats(season, type) {
  const url = `${BASE}/leaderboard/expected_statistics?type=${type}&year=${season}&position=&team=&min=q&csv=true`;
  const rows = await getCsv(url);
  return rows.map((r) => ({
    name: savantNameToDisplay(r['last_name, first_name']),
    playerId: r.player_id,
    ba: r.ba,
    estBa: r.est_ba,
    slg: r.slg,
    estSlg: r.est_slg,
    woba: r.woba,
    estWoba: r.est_woba,
    era: r.era,
    xera: r.xera,
  }));
}

// Batted-ball quality: exit velocity + barrel rate.
export async function fetchStatcastBattedBall(season, type) {
  const url = `${BASE}/leaderboard/statcast?year=${season}&type=${type}&min=q&sort=brl_percent&sortDir=desc&csv=true`;
  const rows = await getCsv(url);
  return rows.map((r) => ({
    name: savantNameToDisplay(r['last_name, first_name']),
    playerId: r.player_id,
    avgHitSpeed: r.avg_hit_speed,
    barrelPercent: r.brl_percent,
  }));
}

export async function fetchSprintSpeed(season) {
  const url = `${BASE}/leaderboard/sprint_speed?year=${season}&position=&team=&min=0&csv=true`;
  const rows = await getCsv(url);
  return rows.map((r) => ({
    name: savantNameToDisplay(r['last_name, first_name']),
    playerId: r.player_id,
    team: r.team,
    sprintSpeed: r.sprint_speed,
  }));
}
