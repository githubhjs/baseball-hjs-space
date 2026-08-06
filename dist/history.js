(() => {
  const API = 'https://statsapi.mlb.com/api/v1';
  const FIRST_YEAR = 1901; // American League founding; National League is older but this keeps AL/NL standings consistent.

  const TEAMS = {
    108: { full: '洛杉磯天使', short: '天使', color: '#BA0021' },
    109: { full: '亞利桑那響尾蛇', short: '響尾蛇', color: '#A71930' },
    110: { full: '巴爾的摩金鶯', short: '金鶯', color: '#DF4601' },
    111: { full: '波士頓紅襪', short: '紅襪', color: '#BD3039' },
    112: { full: '芝加哥小熊', short: '小熊', color: '#0E3386' },
    113: { full: '辛辛那提紅人', short: '紅人', color: '#C6011F' },
    114: { full: '克里夫蘭守護者', short: '守護者', color: '#00385D' },
    115: { full: '科羅拉多落磯', short: '落磯', color: '#333366' },
    116: { full: '底特律老虎', short: '老虎', color: '#0C2340' },
    117: { full: '休士頓太空人', short: '太空人', color: '#002D62' },
    118: { full: '堪薩斯皇家', short: '皇家', color: '#004687' },
    119: { full: '洛杉磯道奇', short: '道奇', color: '#005A9C' },
    120: { full: '華盛頓國民', short: '國民', color: '#AB0003' },
    121: { full: '紐約大都會', short: '大都會', color: '#002D72' },
    133: { full: '奧克蘭運動家', short: '運動家', color: '#003831' },
    134: { full: '匹茲堡海盜', short: '海盜', color: '#FDB827' },
    135: { full: '聖地牙哥教士', short: '教士', color: '#2F241D' },
    136: { full: '西雅圖水手', short: '水手', color: '#0C2C56' },
    137: { full: '舊金山巨人', short: '巨人', color: '#FD5A1E' },
    138: { full: '聖路易紅雀', short: '紅雀', color: '#C41E3A' },
    139: { full: '坦帕灣光芒', short: '光芒', color: '#092C5C' },
    140: { full: '德州遊騎兵', short: '遊騎兵', color: '#003278' },
    141: { full: '多倫多藍鳥', short: '藍鳥', color: '#134A8E' },
    142: { full: '明尼蘇達雙城', short: '雙城', color: '#002B5C' },
    143: { full: '費城費城人', short: '費城人', color: '#E81828' },
    144: { full: '亞特蘭大勇士', short: '勇士', color: '#CE1141' },
    145: { full: '芝加哥白襪', short: '白襪', color: '#27251F' },
    146: { full: '邁阿密馬林魚', short: '馬林魚', color: '#00A3E0' },
    147: { full: '紐約洋基', short: '洋基', color: '#003087' },
    158: { full: '密爾瓦基釀酒人', short: '釀酒人', color: '#12284B' },
  };

  const DIVISIONS = {
    200: '美聯西區', 201: '美聯東區', 202: '美聯中區',
    203: '國聯西區', 204: '國聯東區', 205: '國聯中區',
  };

  function teamZh(id) {
    return TEAMS[id] || { full: `隊伍 #${id}`, short: `#${id}`, color: '#555' };
  }

  // Every dynamic value rendered into HTML goes through this -- never
  // interpolate a raw API field into a template string unescaped, even
  // fields that look numeric, since Stats API fields are still external
  // input as far as this static bundle is concerned.
  function esc(value) {
    return String(value ?? '-')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function el(tag, className) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  function setText(node, text) {
    node.textContent = text;
    return node;
  }

  async function getJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API ${res.status}`);
    return res.json();
  }

  function showMessage(container, text) {
    container.replaceChildren();
    container.appendChild(setText(el('p', 'empty-state'), text));
  }

  // ---------- Year picker (shared by standings + leaders tabs) ----------
  function populateYearSelect(select) {
    const currentYear = new Date().getFullYear();
    const frag = document.createDocumentFragment();
    for (let y = currentYear; y >= FIRST_YEAR; y--) {
      const opt = document.createElement('option');
      opt.value = String(y);
      opt.textContent = `${y} 年`;
      frag.appendChild(opt);
    }
    select.appendChild(frag);
  }

  // ---------- Standings tab ----------
  async function loadStandings(year, container) {
    showMessage(container, '載入中…');
    try {
      const data = await getJson(`${API}/standings?leagueId=103,104&season=${encodeURIComponent(year)}&standingsTypes=regularSeason`);
      const records = data.records || [];
      if (records.length === 0) {
        showMessage(container, `找不到 ${year} 年的戰績資料。`);
        return;
      }
      const hasDivisions = records.some((r) => r.division && r.division.id);
      const grid = el('div', 'standings-grid');

      if (hasDivisions) {
        const order = [201, 202, 200, 204, 205, 203];
        const byId = new Map(records.map((r) => [r.division.id, r]));
        for (const id of order) {
          const record = byId.get(id);
          if (record) grid.appendChild(renderDivisionBlock(DIVISIONS[id] || String(id), record.teamRecords));
        }
      } else {
        for (const record of records) {
          const leagueName = record.league?.name || (record.league?.id === 103 ? '美聯' : '國聯');
          grid.appendChild(renderDivisionBlock(leagueName, record.teamRecords));
        }
      }
      container.replaceChildren(grid);
    } catch (err) {
      showMessage(container, `讀取失敗：${err.message}`);
    }
  }

  function renderDivisionBlock(title, teamRecords) {
    const block = el('section', 'division-block');
    block.appendChild(setText(el('h3', 'division-title'), title));
    const scroll = el('div', 'table-scroll');
    const table = el('table', 'standings-table');
    const rowsHtml = teamRecords
      .map((r) => {
        const team = teamZh(r.team.id);
        const gb = r.divisionGamesBack ?? r.gamesBack ?? '-';
        return `<tr>
          <td class="cell-team"><span class="team-color-dot" style="background:${esc(team.color)}"></span>${esc(team.full)}</td>
          <td>${esc(r.leagueRecord.wins)}</td>
          <td>${esc(r.leagueRecord.losses)}</td>
          <td>${esc(r.leagueRecord.pct)}</td>
          <td>${esc(gb)}</td>
        </tr>`;
      })
      .join('');
    table.innerHTML = `<thead><tr><th>球隊</th><th>勝</th><th>敗</th><th>勝率</th><th>勝差</th></tr></thead><tbody>${rowsHtml}</tbody>`;
    scroll.appendChild(table);
    block.appendChild(scroll);
    return block;
  }

  // ---------- Historical leaders tab ----------
  const BATTING_CATS = [
    ['battingAverage', '打擊率'],
    ['homeRuns', '全壘打'],
    ['runsBattedIn', '打點'],
    ['onBasePlusSlugging', 'OPS'],
  ];
  const PITCHING_CATS = [
    ['earnedRunAverage', '防禦率'],
    ['wins', '勝投'],
    ['strikeouts', '三振'],
    ['saves', '救援成功'],
  ];

  async function loadLeaders(year, container) {
    showMessage(container, '載入中…');
    try {
      const [batting, pitching] = await Promise.all([
        getJson(`${API}/stats/leaders?leaderCategories=${BATTING_CATS.map((c) => c[0]).join(',')}&season=${encodeURIComponent(year)}&sportId=1&statGroup=hitting&limit=10`),
        getJson(`${API}/stats/leaders?leaderCategories=${PITCHING_CATS.map((c) => c[0]).join(',')}&season=${encodeURIComponent(year)}&sportId=1&statGroup=pitching&limit=10`),
      ]);
      const anyData = (batting.leagueLeaders || []).some((c) => c.leaders?.length) || (pitching.leagueLeaders || []).some((c) => c.leaders?.length);
      if (!anyData) {
        showMessage(container, `找不到 ${year} 年的數據王資料（該年份可能早於聯盟開始完整記錄的時期）。`);
        return;
      }
      const grid = el('div', 'leaders-grid');
      for (const [key, label] of BATTING_CATS) grid.appendChild(renderLeaderCard(label, batting.leagueLeaders, key));
      for (const [key, label] of PITCHING_CATS) grid.appendChild(renderLeaderCard(label, pitching.leagueLeaders, key));
      container.replaceChildren(grid);
    } catch (err) {
      showMessage(container, `讀取失敗：${err.message}`);
    }
  }

  function renderLeaderCard(title, leagueLeaders, key) {
    const card = el('div', 'leader-card');
    card.appendChild(setText(el('h4', 'leader-card-title'), title));
    const list = el('ol', 'leader-list');
    const category = (leagueLeaders || []).find((c) => c.leaderCategory === key);
    const rows = category ? category.leaders.slice(0, 10) : [];
    list.innerHTML = rows.length
      ? rows
          .map((l, i) => {
            const team = teamZh(l.team?.id);
            return `<li class="leader-row">
              <span class="leader-rank">${esc(i + 1)}</span>
              <span class="leader-name">${esc(l.person.fullName)}</span>
              <span class="leader-team">${esc(team.short)}</span>
              <span class="leader-value">${esc(l.value)}</span>
            </li>`;
          })
          .join('')
      : '<li class="leader-empty">暫無資料</li>';
    card.appendChild(list);
    return card;
  }

  // ---------- Player career lookup tab ----------
  async function searchPlayer(name, resultsContainer, detailContainer) {
    showMessage(resultsContainer, '搜尋中…');
    detailContainer.replaceChildren();
    try {
      const data = await getJson(`${API}/people/search?names=${encodeURIComponent(name)}`);
      const people = (data.people || []).slice(0, 8);
      if (people.length === 0) {
        showMessage(resultsContainer, `找不到「${name}」，請確認拼字（需用英文姓名搜尋）。`);
        return;
      }
      const list = el('div', 'player-search-results');
      for (const person of people) {
        const btn = el('button', 'player-result-btn');
        btn.type = 'button';
        const label = person.birthDate ? `${person.fullName} (${person.birthDate.slice(0, 4)})` : person.fullName;
        setText(btn, label);
        btn.addEventListener('click', () => loadPlayerCareer(person, detailContainer));
        list.appendChild(btn);
      }
      resultsContainer.replaceChildren(list);
      loadPlayerCareer(people[0], detailContainer);
    } catch (err) {
      showMessage(resultsContainer, `讀取失敗：${err.message}`);
    }
  }

  async function loadPlayerCareer(person, container) {
    showMessage(container, '載入生涯數據中…');
    try {
      const [hitting, pitching] = await Promise.all([
        getJson(`${API}/people/${person.id}/stats?stats=yearByYear&group=hitting`),
        getJson(`${API}/people/${person.id}/stats?stats=yearByYear&group=pitching`),
      ]);
      const hittingSplits = (hitting.stats?.[0]?.splits || []).filter((s) => !s.sport || s.sport.id === 1);
      const pitchingSplits = (pitching.stats?.[0]?.splits || []).filter((s) => !s.sport || s.sport.id === 1);

      const frag = document.createDocumentFragment();
      frag.appendChild(setText(el('h3', 'division-title'), person.fullName));

      if (hittingSplits.length) frag.appendChild(renderCareerTable(hittingSplits, [
        ['season', '年度'], ['team', '球隊'], ['gamesPlayed', 'G'], ['avg', 'AVG'], ['homeRuns', 'HR'], ['rbi', 'RBI'], ['ops', 'OPS'],
      ]));
      if (pitchingSplits.length) frag.appendChild(renderCareerTable(pitchingSplits, [
        ['season', '年度'], ['team', '球隊'], ['wins', 'W'], ['losses', 'L'], ['era', 'ERA'], ['strikeOuts', 'SO'], ['whip', 'WHIP'],
      ]));

      if (!hittingSplits.length && !pitchingSplits.length) {
        showMessage(container, `${person.fullName} 沒有可顯示的生涯數據。`);
        return;
      }
      container.replaceChildren(frag);
    } catch (err) {
      showMessage(container, `讀取失敗：${err.message}`);
    }
  }

  function renderCareerTable(splits, columns) {
    const scroll = el('div', 'table-scroll');
    const table = el('table', 'standings-table career-table');
    const headHtml = columns.map(([, label]) => `<th>${esc(label)}</th>`).join('');
    const rowsHtml = splits
      .map((s) => {
        const cells = columns.map(([key]) => {
          if (key === 'season') return esc(s.season);
          if (key === 'team') return esc(s.team ? teamZh(s.team.id).short : '全季合計');
          return esc(s.stat?.[key]);
        });
        return `<tr>${cells.map((c) => `<td>${c}</td>`).join('')}</tr>`;
      })
      .join('');
    table.innerHTML = `<thead><tr>${headHtml}</tr></thead><tbody>${rowsHtml}</tbody>`;
    scroll.appendChild(table);
    return scroll;
  }

  // ---------- Wire up tabs ----------
  function initTabs() {
    const tabButtons = document.querySelectorAll('.history-tab-btn');
    const panels = document.querySelectorAll('.history-panel');
    tabButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        tabButtons.forEach((b) => b.classList.toggle('active', b === btn));
        panels.forEach((p) => p.classList.toggle('active', p.dataset.panel === btn.dataset.tab));
      });
    });
  }

  function init() {
    initTabs();

    const standingsYearSelect = document.getElementById('standings-year');
    const standingsContainer = document.getElementById('standings-result');
    populateYearSelect(standingsYearSelect);
    standingsYearSelect.addEventListener('change', () => loadStandings(standingsYearSelect.value, standingsContainer));
    loadStandings(standingsYearSelect.value, standingsContainer);

    const leadersYearSelect = document.getElementById('leaders-year');
    const leadersContainer = document.getElementById('leaders-result');
    populateYearSelect(leadersYearSelect);
    leadersYearSelect.addEventListener('change', () => loadLeaders(leadersYearSelect.value, leadersContainer));
    loadLeaders(leadersYearSelect.value, leadersContainer);

    const playerForm = document.getElementById('player-search-form');
    const playerInput = document.getElementById('player-search-input');
    const playerResults = document.getElementById('player-search-results');
    const playerDetail = document.getElementById('player-career-detail');
    playerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (playerInput.value.trim()) searchPlayer(playerInput.value.trim(), playerResults, playerDetail);
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
