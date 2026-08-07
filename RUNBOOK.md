# baseball.hjs.space — RUNBOOK

Self-contained reference for this project. Written so any agent (Claude, or otherwise) can pick
this up cold with zero conversation history. If you're continuing work here, read this file first.

## What this is

A Traditional-Chinese (zh-Hant) MLB data site at **https://baseball.hjs.space**. Static site,
zero npm dependencies, rebuilt automatically on a schedule. Repo: `githubhjs/baseball-hjs-space`
(private), local clone typically at `~/projects/baseball-hjs-space`.

## Pages (6 nav sections; the schedule section is 15 physical pages)

| Path | Content | Data source | Rebuilt |
|---|---|---|---|
| `/` + `/schedule/<YYYY-MM-DD>/` (14 more, +/-7 days) | Games/scores/probable pitchers for that date, with a date-pill nav strip. Each card: real team logos, always-visible Taipei start time, pitcher W-L records on decisions, home-run hitters+counts | MLB Stats API `/schedule` (one range query) + per-game `/boxscore` for Final/Live games | Every 15 min (static build) |
| `/standings/` | Full league standings (all 6 divisions) + wild card race per league | MLB Stats API `/standings` (regularSeason + wildCard types) | Every 15 min (static build) |
| `/postseason/` | "If the season ended today" bracket projection (3 division winners + 3 wild cards per league, seeded, wild-card round matchups) | Same standings data as above | Every 15 min (static build) |
| `/leaders/` | Player + team stat leaderboards (current season) | MLB Stats API `/stats/leaders`, `/teams/stats` | Every 15 min (static build) |
| `/advanced/` | Official Statcast advanced stats (xwOBA, xERA, exit velo, barrel%, sprint speed) | Baseball Savant CSV exports | Every 15 min (static build) |
| `/history/` | Any season 1901–present: standings, leaders, player career lookup | MLB Stats API, called **client-side** | Live, on every page view (not baked into the build) |

Every page also has an auto/dark/light theme toggle in the nav (see `site-theme-toggle` skill).

## Architecture

- **Static site generator**: `scripts/build.mjs` (Node 20+, zero dependencies — uses native
  `fetch`). Fetches all JSON/CSV, renders HTML strings, writes to `dist/`. Run it with
  `node scripts/build.mjs`.
- **Templates**: `scripts/lib/*.mjs` — `layout.mjs` (page shell/nav/AdSense/footer), `gameCard.mjs`,
  `standingsTable.mjs`, `leaders.mjs`, `advanced.mjs`, `historyPage.mjs` (static shell only, no data
  — the actual history page is client-rendered).
- **Data**: `scripts/lib/mlbApi.mjs` (official MLB Stats API, `statsapi.mlb.com`, no auth, CORS-open),
  `scripts/lib/savantApi.mjs` + `scripts/lib/csv.mjs` (Baseball Savant CSV exports,
  `baseballsavant.mlb.com`, no auth, CORS-open).
- **Client-side JS**: `assets/history.js` — the only page with real browser JS. Calls MLB Stats API
  directly from the visitor's browser (confirmed `Access-Control-Allow-Origin: *` on both
  `statsapi.mlb.com` and `baseballsavant.mlb.com`). Historical data never changes, so pre-baking
  hundreds of yearly static pages would be pure waste — this is deliberate, not a shortcut.
- **Styling**: single `assets/style.css`, dark "scoreboard" aesthetic by default (deliberately
  distinct from the retro-desktop look of hjs.space/solarsystem.hjs.space — this site targets
  general MLB fans), with a real light palette + auto/dark/light 3-state toggle in the nav (see the
  `site-theme-toggle` Claude Code skill — this is a standing cross-site requirement across all
  `*.hjs.space` properties, not specific to this project). Team logos come from
  `mlbstatic.com/team-logos/{id}.svg` (official MLB CDN).
- **`dist/`** is committed to git (not gitignored) — Cloudflare Pages serves it directly with
  `build_config.destination_dir: "dist"` and `build_command: ""` (no build step on Cloudflare's
  side; the build already happened before the commit).

## Auto-update mechanism — READ THIS if the site looks stale

Two redundant triggers keep the site current. **Neither one is optional** — see the incident below.

1. **GitHub Actions**: `.github/workflows/update.yml`, `on: schedule: '*/15 * * * *'` (+ `push` +
   `workflow_dispatch`). Runs `node scripts/build.mjs`, commits `dist/` if changed, pushes to
   `main` — which triggers Cloudflare Pages' GitHub-integration auto-deploy.
2. **GX10 crontab** (the machine this was built on): `*/15 * * * * /usr/bin/gh workflow run
   update.yml -R githubhjs/baseball-hjs-space >> /tmp/baseball_cron_trigger.log 2>&1`. Fires the
   same workflow via `workflow_dispatch`.

**Why both exist (incident, 2026-08-06)**: after the workflow had been live for 2.5+ hours, `gh run
list -R githubhjs/baseball-hjs-space` showed **zero** `schedule`-triggered runs — only `push`- and
later `workflow_dispatch`-triggered ones. GitHub's own cron scheduler is documented by GitHub itself
as best-effort with no SLA ("can be delayed during periods of high load"), and in this case it
simply never fired at all during the observation window. `workflow_dispatch` triggered via `gh`
CLI, by contrast, ran within ~10 seconds every time it was tried. Rather than trust GitHub's
scheduler alone, the GX10 crontab entry above is the **primary** reliable trigger; GitHub's own
`schedule:` stays in the workflow as a free backup in case it eventually starts firing too (having
both is harmless — the workflow is idempotent, and `concurrency: cancel-in-progress: false` in
`update.yml` prevents overlapping runs from racing).

**If the site looks stale, check in this order**:
1. `crontab -l` on GX10 — is the `baseball-hjs-space` line still there? (Could've been dropped by an
   unrelated `crontab -` overwrite — always append, never replace, when editing this machine's
   crontab.)
2. `cat /tmp/baseball_cron_trigger.log` — is `gh workflow run` actually firing every 15 min and
   succeeding (not an auth/network error)?
3. `gh run list -R githubhjs/baseball-hjs-space --limit 10` — are runs completing successfully?
4. Cloudflare Pages deployments (see below) — is the push actually triggering a deploy?

## Cloudflare Pages

- Project name: `baseball-hjs-space`, account `eecfb2b781b1c6314012a33e8c7c9adc` (same token as
  other `*.hjs.space` sites — see the `reference_cloudflare_api` memory / this repo's git history
  for the token, not repeated here since it's account-wide and already documented elsewhere).
- **`build_config.destination_dir` is `"dist"`** — this is the one config difference from sibling
  projects (`hjs-space`, `solarsystem-hjs-space`) which serve from repo root. Get this wrong and the
  live site 404s or serves source files instead of built HTML.
- Custom domain `baseball.hjs.space` registered on the Pages project (`POST .../domains`) **and** a
  DNS CNAME (`baseball` → `baseball-hjs-space.pages.dev`, proxied) — both steps required, a CNAME
  alone isn't enough (see `reference_cloudflare_api` memory for the general Cloudflare Pages recipe
  this followed).
- **Alias domain**: `mlb.hjs.space` also points at this same project (added 2026-08-06, same
  `POST .../domains` + CNAME recipe, second hostname on the same project) — same pattern as
  `blog.hjs.space`/`career.hjs.space` on the career-blog project. Any future domain-facing change
  (redirects, canonical URL logic, etc.) should account for both hostnames.
- **Deploy-verification gotcha (hit repeatedly this project)**: a screenshot/fetch taken
  *immediately* after a `deploy success` can show stale content for several seconds to ~30s — pure
  Cloudflare edge-cache propagation lag, not a failed deploy or a real bug. Wait and re-check before
  concluding something broke. (Same pattern documented in the `solarsystem-hjs-space` project.)

## Known gotchas / lessons (don't re-discover these)

- **US officialDate != Taipei calendar date — nearly always off by one.** MLB's schedule API groups
  games by a US "officialDate", but this site displays everything in Taipei time (UTC+8), which is
  far enough ahead of every US timezone that almost every game's real Taipei date is the *US date
  plus one*. Grouping/labeling by the API's officialDate bucket (what the original single-day
  version did) makes the date-nav label and the game times shown under it visibly disagree. Fixed
  by `taipeiDateKey()` in `format.mjs`, which re-buckets every individual game by the real Taipei
  calendar date computed from its actual `gameDate` instant — never trust the API's own date
  grouping for a Taiwan-facing display. The build fetches a couple of extra padding days
  (`fetchStart`/`fetchEnd` in `build.mjs`) specifically to have enough raw data on hand after
  re-bucketing shifts things by a day.
- **Pitcher W-L records and per-game home runs come from each game's `/boxscore` endpoint, not the
  schedule endpoint.** `scripts/lib/boxscore.mjs` fetches this only for Final/Live games (Preview
  games have no `seasonStats.pitching`/per-game `stats.batting.homeRuns` yet) using
  `Promise.allSettled`, not `Promise.all` — one game's boxscore failing must not blank out every
  other card on the page. Benchmarked at ~50 concurrent distinct-game fetches in ~8s with zero
  failures, so fetching all Final/Live games in the 15-day window (~100-115 on a typical day) is
  fine within a 15-minute build cycle.
- **Postseason seeding uses the API's own `divisionRank`/`wildCardRank` fields, not hand-computed
  tiebreakers** (`scripts/lib/postseason.mjs`) — division winners are seeds 1-3 ranked by record
  *among themselves only*, wild cards are seeds 4-6 by `wildCardRank`. This means a division winner
  with a worse overall record than a wild-card team still outranks it — that's the real 2022+ MLB
  rule, not a bug, if it looks surprising when reviewing the bracket.
- **Team-logo `<img>` tags need explicit `width`/`height` HTML attributes, not just CSS.** Without
  them, a browser that hasn't finished loading `style.css` yet (slow connection, or the usual
  post-deploy edge-cache-lag window) renders the raw SVG at its native intrinsic size (~112px,
  confirmed) instead of the intended 22px/18px, until the stylesheet catches up — visible as a
  flash of huge logos. Confirmed the fix (adding `width="22" height="22"` etc. to every `<img
  class="team-logo...">` in `gameCard.mjs`/`standingsTable.mjs`/`postseason.mjs`) by blocking
  `style.css` entirely in a Playwright test and checking the rendered box was still 22×22 — this is
  a real regression class (CSS-only image sizing) worth checking for on any future `<img>` added to
  this site, not just team logos.
- **`minmax(460px, 1fr)` in a CSS grid overflows on mobile** — found on `.standings-grid` and
  `.postseason-grid` via an actual mobile screenshot (a static desktop-only review missed it).
  `minmax(460px, 1fr)` forces a track that can never shrink below 460px, so a 390px viewport gets a
  horizontal-scrolling page instead of a stacked single column. Fixed with
  `minmax(min(460px, 100%), 1fr)`, which clamps the minimum to the container's own width. Check any
  future `minmax(<fixed-px>, 1fr)` grid the same way — this class of bug only shows up on an actual
  narrow-viewport screenshot, not in code review.
- **FanGraphs and Baseball-Reference are both fully blocked** (Cloudflare bot-challenge, 403 "Just a
  moment..." on every endpoint including their internal APIs) — confirmed by direct testing, not
  assumption. This is *why* `/advanced/` uses Baseball Savant instead: Savant
  (`baseballsavant.mlb.com`) is MLB's own official Statcast site, not a third party, and is not
  blocked. Real wRC+/WAR specifically cannot be reproduced without FanGraphs' proprietary park
  factors — genuinely unavailable elsewhere, not just inconvenient to fetch. Don't waste time
  re-trying FanGraphs/BRef scraping (including via `pybaseball` — it wraps the same blocked pages
  plus the same Savant endpoints already used directly here) unless Cloudflare's block is somehow
  lifted.
- **The Savant fetch is deliberately isolated** in `buildAdvancedBody()` (`scripts/build.mjs`) via
  try/catch — a Savant outage or CSV-format change must degrade `/advanced/` to an empty-state
  message, not break the other 4 pages' build.
- **Savant returns CSV, not JSON** — `scripts/lib/csv.mjs` is a small hand-written parser (handles
  quoted fields with embedded commas, needed for the "Last, First" name column). No npm dependency.
- **`style.css`/`history.js` cache-busting**: `layout.mjs` links them with `?v=1` — bump this
  version string if you ever need to force-bust a stale cached asset (same gotcha hit on the
  `career-blog` project; hasn't needed bumping here yet since only new files were added, but will
  matter if an existing asset's content changes without a filename change).
- **Writing `.github/workflows/*.yml` triggers a security-reminder hook** that blocks the write on
  the first attempt regardless of content — it's checking for `github.event.*` interpolated into
  `run:` steps (a real XSS/injection class for untrusted PR titles etc.). This project's workflow
  has no such interpolation; just retry the write once you've confirmed it's actually safe.
- **`history.js` innerHTML usage** triggers a similar hook (XSS risk warning). Every dynamic value
  rendered into HTML goes through the `esc()` helper in that file — even fields that look purely
  numeric — since Stats API fields are technically external input. Keep this discipline if you add
  more rendering there.
- **Git workflow**: the 15-min cron auto-commits `dist/` on its own schedule, so a local `git push`
  can get rejected mid-session if a cron commit landed first. Fix: `git merge origin/main` (not
  rebase — avoids replaying the same `dist/` conflict once per local commit), then re-run
  `node scripts/build.mjs` to regenerate the generated files fresh rather than hand-resolving
  `<<<<<<<` conflict markers inside build output.
- **Pre-1969 standings have no division field** — `history.js`'s `loadStandings()` detects
  `division.id` absence and falls back to a flat league (AL/NL) table instead of assuming divisions
  always exist. Verified against real 1950 data.
- **Mid-season-trade players get a `team: null` "season total" row** in MLB's `yearByYear` stats
  (verified via Ichiro Suzuki's actual 2012 Mariners→Yankees trade). `history.js` labels this row
  `全季合計` (season total) rather than showing a garbled team name — check for `s.team` being
  falsy before looking up a team, don't assume every split row has a team.
- **Team names**: full 30-team MLB-Stats-API-id → Traditional Chinese name/color map exists in
  *two* places by design — `scripts/lib/teams.mjs` (Node, build-time pages) and a duplicate literal
  object inside `assets/history.js` (browser, since it can't `import` a Node module across that
  boundary without a bundler, which this project deliberately doesn't have). If you ever rename a
  team in one, update both.

## How to extend this

- **Add a new build-time page**: follow the pattern of `/leaders/` or `/advanced/` — a data-fetch
  function in a new/existing `scripts/lib/*Api.mjs`, a render function producing an HTML string
  reusing existing CSS classes where possible (`.leaders-grid`/`.leader-card`,
  `.standings-grid`/`.division-block`/`.standings-table`), wire it into `build.mjs`'s `main()`, add
  a nav entry + `og:url` mapping in `layout.mjs`, add the URL to `sitemap.xml`.
- **Add a new client-side (history-style) page**: only worth it if the data is either (a) too large
  to reasonably pre-bake (many years × many categories) or (b) genuinely real-time in a way the
  15-min build can't serve. Otherwise prefer a build-time page — it's simpler and has no
  browser-JS-error surface.
- **Testing an interactive JS feature**: static HTML review is not enough (learned building
  `history.js`'s tab/dropdown/search interactions). Install `playwright-core` in a scratch `/tmp`
  dir (not a project dependency — never add it to `package.json`) pointed at the system's existing
  chromium binary (`executablePath: '/usr/bin/chromium-browser'`), and drive real
  clicks/selects/form-submits against a locally-served `dist/`. This is how the `team: null`
  season-total bug above was actually found.
- **Verifying a live deploy**: always screenshot/fetch the *production* URL after deploy, not just
  local `dist/` — but expect up to ~30s of edge-cache lag before concluding something's wrong.

## Credentials / accounts referenced (not repeated here)

- Cloudflare API token + account ID: `reference_cloudflare_api` memory.
- GitHub: `gh auth status` — logged in as `githubhjs` account, used for all `gh` commands above.
- Google AdSense publisher ID `ca-pub-4111341429707175`: reused from `hjs.space` (see
  `project_personal_websites` memory) — no new AdSense account needed.
