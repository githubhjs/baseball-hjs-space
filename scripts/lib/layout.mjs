const ADSENSE_PUBLISHER_ID = 'ca-pub-4111341429707175';

export function page({ title, description, active, body, generatedAt, extraScripts = '', canonicalPath }) {
  const nav = [
    { href: '/', label: '今日賽事', key: 'today' },
    { href: '/standings/', label: '戰績排名', key: 'standings' },
    { href: '/postseason/', label: '季後賽', key: 'postseason' },
    { href: '/leaders/', label: '數據王', key: 'leaders' },
    { href: '/advanced/', label: '進階數據', key: 'advanced' },
    { href: '/history/', label: '歷史數據', key: 'history' },
  ];

  const navHtml = nav
    .map(
      (item) =>
        `<a href="${item.href}" class="nav-link${item.key === active ? ' active' : ''}">${item.label}</a>`
    )
    .join('\n        ');

  return `<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script>
(function () {
  try {
    var t = localStorage.getItem("theme");
    if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t);
  } catch (e) {}
})();
</script>
<title>${title}</title>
<meta name="description" content="${description}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="stylesheet" href="/style.css?v=1">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:type" content="website">
<meta property="og:url" content="https://baseball.hjs.space${canonicalPath ?? { standings: '/standings/', postseason: '/postseason/', leaders: '/leaders/', advanced: '/advanced/', history: '/history/' }[active] ?? '/'}">
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUBLISHER_ID}" crossorigin="anonymous"></script>
</head>
<body>
<header class="site-header">
  <div class="header-inner">
    <a class="brand" href="/">⚾ Baseball<span class="brand-accent">.hjs.space</span></a>
    <nav class="site-nav">
        ${navHtml}
        <button id="theme-toggle" class="theme-toggle" onclick="cycleTheme()" aria-label="切換深色／淺色主題" type="button"></button>
    </nav>
  </div>
</header>
<script>
  function cycleTheme() {
    var current = localStorage.getItem("theme"); // null = auto, "light", "dark"
    var next = current === null ? "dark" : current === "dark" ? "light" : null;
    if (next === null) {
      localStorage.removeItem("theme");
      document.documentElement.removeAttribute("data-theme");
    } else {
      localStorage.setItem("theme", next);
      document.documentElement.setAttribute("data-theme", next);
    }
    updateThemeToggleLabel();
  }
  function updateThemeToggleLabel() {
    var t = localStorage.getItem("theme");
    var btn = document.getElementById("theme-toggle");
    if (btn) btn.textContent = t === "dark" ? "\u{1F319} 深色" : t === "light" ? "☀️ 淺色" : "\u{1F313} 自動";
  }
  updateThemeToggleLabel();
</script>
<main class="page">
${body}
</main>
<footer class="site-footer">
  <p>資料來源：<a href="https://statsapi.mlb.com/" target="_blank" rel="noopener">MLB Stats API</a>（官方公開數據）。本站由 GitHub Actions 定時抓取並自動產生，非官方網站，與 MLB 無關。</p>
  <p class="updated-at">最後更新：${generatedAt}</p>
</footer>
${extraScripts}
</body>
</html>
`;
}
