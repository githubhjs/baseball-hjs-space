const BASE = 'https://statsapi.mlb.com/api/v1';

async function getJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'baseball-hjs-space/1.0 (+https://baseball.hjs.space)' } });
  if (!res.ok) throw new Error(`MLB API ${res.status} for ${url}`);
  return res.json();
}

function extractFromBoxscore(data) {
  const pitcherRecords = new Map(); // personId -> { wins, losses }
  const homeRuns = []; // { name, teamId, count }

  for (const side of ['home', 'away']) {
    const teamId = data.teams?.[side]?.team?.id;
    const players = data.teams?.[side]?.players ?? {};
    for (const player of Object.values(players)) {
      const personId = player.person?.id;
      const pitching = player.seasonStats?.pitching;
      if (personId && pitching && (pitching.wins !== undefined || pitching.losses !== undefined)) {
        pitcherRecords.set(personId, { wins: pitching.wins ?? 0, losses: pitching.losses ?? 0, saves: pitching.saves ?? 0 });
      }
      const gameHomeRuns = player.stats?.batting?.homeRuns;
      if (gameHomeRuns) {
        homeRuns.push({ name: player.person.fullName, teamId, count: gameHomeRuns });
      }
    }
  }
  return { pitcherRecords, homeRuns };
}

// Boxscores are fetched one-per-game (no batch endpoint), so this always
// resolves per game rather than throwing -- one game's boxscore failing
// (transient 5xx, unusual game state) must not blank out every other card
// on the page.
export async function fetchBoxscoresByGamePk(gamePks) {
  const results = await Promise.allSettled(
    gamePks.map((pk) => getJson(`${BASE}/game/${pk}/boxscore`).then((data) => [pk, extractFromBoxscore(data)]))
  );
  const byGamePk = new Map();
  for (const r of results) {
    if (r.status === 'fulfilled') {
      const [pk, extracted] = r.value;
      byGamePk.set(pk, extracted);
    }
  }
  return byGamePk;
}
