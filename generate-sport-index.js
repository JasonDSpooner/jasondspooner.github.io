#!/usr/bin/env node

/**
 * Generate per-sport index pages for jasondspooner.github.io
 *
 * Reads blog/articles.json and writes:
 *   /cfl.html
 *   /mlb.html
 *   /fifa.html
 *   /sports/index.html
 */

const fs = require('fs');
const path = require('path');

const REPO_DIR = __dirname;
const BLOG_DIR = path.join(REPO_DIR, 'blog');
const ARTICLES_JSON = path.join(BLOG_DIR, 'articles.json');

const SPORTS = [
  { key: 'cfl', label: 'CFL', description: 'Canadian Football League odds, previews, and results.' },
  { key: 'mlb', label: 'MLB', description: 'Major League Baseball odds, previews, and results.' },
  { key: 'fifa', label: 'FIFA World Cup', description: 'FIFA World Cup odds, previews, and results.' },
];

function sportPage({ key, label, description, articles }) {
  const articleList = articles.map(a => `
        <li>
          <span class="blog-date">${a.date}</span>
          <h3><a href="blog/articles/${a.slug}.html">${a.title}</a></h3>
          <p class="blog-excerpt">${a.excerpt}</p>
        </li>`).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${description}">
  <title>${label} — Jason Spooner</title>
  <link rel="stylesheet" href="css/style.css">
  <style>
    .blog-list { list-style: none; }
    .blog-list li { padding: var(--space-m) 0; border-bottom: 1px solid var(--line); }
    .blog-list li:last-child { border-bottom: none; }
    .blog-date { color: var(--muted); font-size: var(--step--1); }
    .blog-excerpt { margin-top: var(--space-3xs); }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Jason Spooner</h1>
      <p>IT Leader · Developer · Creator</p>
      <nav>
        <a href="index.html">Resume</a>
        <a href="fifa2026.html">FIFA 2026</a>
        <a href="blog/index.html">Blog</a>
        <a href="sports/index.html">Sports</a>
      </nav>
    </header>

    <section>
      <h2>${label}</h2>
      <p>${description}</p>

      ${articles.length === 0 ? `<p>No ${label} articles yet. Check back soon.</p>` : `
      <ul class="blog-list">
${articleList}
      </ul>`}
    </section>

    <a href="sports/index.html" class="back-link">← All Sports</a>

    <footer>
      <p>© Jason Spooner</p>
    </footer>
  </div>
</body>
</html>`;
}

function sportsHubPage(articlesBySport) {
  const sections = SPORTS.map(({ key, label, description }) => {
    const articles = articlesBySport[key] || [];
    const latest = articles.slice(0, 3).map(a =>
      `<li><a href="../blog/articles/${a.slug}.html">${a.title}</a> <span class="blog-date">${a.date}</span></li>`
    ).join('');
    return `
        <div class="sport-card">
          <h3><a href="${key}.html">${label}</a></h3>
          <p>${description}</p>
          ${latest ? `<ul>${latest}</ul>` : `<p><em>No articles yet.</em></p>`}
        </div>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Sports odds, previews, and results for CFL, MLB, and FIFA World Cup.">
  <title>Sports — Jason Spooner</title>
  <link rel="stylesheet" href="../css/style.css">
  <style>
    .sport-card { padding: var(--space-m) 0; border-bottom: 1px solid var(--line); }
    .sport-card:last-child { border-bottom: none; }
    .sport-card h3 { margin-bottom: var(--space-3xs); }
    .sport-card ul { margin-top: var(--space-xs); padding-left: var(--space-m); }
    .blog-date { color: var(--muted); font-size: var(--step--1); }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Jason Spooner</h1>
      <p>IT Leader · Developer · Creator</p>
      <nav>
        <a href="../index.html">Resume</a>
        <a href="../fifa2026.html">FIFA 2026</a>
        <a href="../blog/index.html">Blog</a>
        <a href="index.html">Sports</a>
      </nav>
    </header>

    <section>
      <h2>Sports</h2>
      <p>Data-driven odds, previews, and results.</p>

      <div class="sport-grid">
${sections}
      </div>
    </section>

    <footer>
      <p>© Jason Spooner</p>
    </footer>
  </div>
</body>
</html>`;
}

function main() {
  if (!fs.existsSync(ARTICLES_JSON)) {
    console.error('No articles.json found');
    process.exit(1);
  }

  const articles = JSON.parse(fs.readFileSync(ARTICLES_JSON, 'utf8'));

  const articlesBySport = {};
  for (const sport of SPORTS) {
    articlesBySport[sport.key] = articles.filter(a =>
      Array.isArray(a.tags) && a.tags.some(t => t.toLowerCase() === sport.key)
    );
  }

  // Write root sport pages
  for (const sport of SPORTS) {
    const html = sportPage({ ...sport, articles: articlesBySport[sport.key] });
    const outPath = path.join(REPO_DIR, `${sport.key}.html`);
    fs.writeFileSync(outPath, html);
    console.log(`✓ ${sport.key}.html generated with ${articlesBySport[sport.key].length} articles`);
  }

  // Write sports hub
  const sportsDir = path.join(REPO_DIR, 'sports');
  fs.mkdirSync(sportsDir, { recursive: true });
  const hubHtml = sportsHubPage(articlesBySport);
  fs.writeFileSync(path.join(sportsDir, 'index.html'), hubHtml);
  console.log('✓ sports/index.html generated');
}

if (require.main === module) {
  main();
}

module.exports = { SPORTS, sportPage, sportsHubPage };
