export function renderHistoryBody() {
  return `
    <h1 class="page-title">歷史數據</h1>
    <p class="page-subtitle">選擇年度瀏覽歷史戰績、數據王，或查詢球員生涯數據。資料即時從瀏覽器直接向 MLB Stats API 查詢（官方公開資料），無需等待站內定時更新。</p>

    <div class="history-tabs">
      <button type="button" class="history-tab-btn active" data-tab="standings">戰績排名</button>
      <button type="button" class="history-tab-btn" data-tab="leaders">數據王</button>
      <button type="button" class="history-tab-btn" data-tab="player">球員生涯查詢</button>
    </div>

    <section class="history-panel active" data-panel="standings">
      <div class="history-controls">
        <label for="standings-year">年度：</label>
        <select id="standings-year"></select>
      </div>
      <div id="standings-result"></div>
    </section>

    <section class="history-panel" data-panel="leaders">
      <div class="history-controls">
        <label for="leaders-year">年度：</label>
        <select id="leaders-year"></select>
      </div>
      <div id="leaders-result"></div>
    </section>

    <section class="history-panel" data-panel="player">
      <form id="player-search-form" class="history-controls">
        <label for="player-search-input">球員英文姓名：</label>
        <input id="player-search-input" type="text" placeholder="例如 Ichiro Suzuki" autocomplete="off">
        <button type="submit" class="history-search-btn">搜尋</button>
      </form>
      <div id="player-search-results"></div>
      <div id="player-career-detail"></div>
    </section>`;
}
