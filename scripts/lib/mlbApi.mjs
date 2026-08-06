const BASE = 'https://statsapi.mlb.com/api/v1';

async function getJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'baseball-hjs-space/1.0 (+https://baseball.hjs.space)' } });
  if (!res.ok) throw new Error(`MLB API ${res.status} for ${url}`);
  return res.json();
}

export function todayOfficialDate() {
  // MLB's "officialDate" runs on US time; using Taipei date is close enough for a
  // schedule lookup and keeps this dependency-free (no timezone library needed).
  return new Date().toISOString().slice(0, 10);
}

export async function fetchSchedule(date) {
  const url = `${BASE}/schedule?sportId=1&date=${date}&hydrate=team,linescore,decisions,probablePitcher`;
  const data = await getJson(url);
  return data.dates?.[0]?.games ?? [];
}

export async function fetchStandings(season) {
  const url = `${BASE}/standings?leagueId=103,104&season=${season}&standingsTypes=regularSeason`;
  const data = await getJson(url);
  return data.records ?? [];
}

export async function fetchPlayerLeaders(season, categories, statGroup) {
  const url = `${BASE}/stats/leaders?leaderCategories=${categories.join(',')}&season=${season}&sportId=1&statGroup=${statGroup}&limit=10`;
  const data = await getJson(url);
  return data.leagueLeaders ?? [];
}

export async function fetchTeamStats(season, group) {
  const url = `${BASE}/teams/stats?season=${season}&sportId=1&group=${group}&stats=season`;
  const data = await getJson(url);
  return data.stats?.[0]?.splits ?? [];
}
