#!/usr/bin/env node

/**
 * Generate a Blue Jays hub page from the COBOL smart-bet data files.
 *
 * Reads:
 *   /home/theone/Projects/cobol/cobol-screen-test/jays_data.txt
 *   /home/theone/Projects/cobol/cobol-screen-test/hr_tracker_data.txt
 *
 * Writes:
 *   /bluejays.html
 */

const fs = require('fs');
const path = require('path');

const REPO_DIR = __dirname;
const DATA_DIR = '/home/theone/Projects/cobol/cobol-screen-test';
const JAYS_DATA = path.join(DATA_DIR, 'jays_data.txt');
const HR_TRACKER = path.join(DATA_DIR, 'hr_tracker_data.txt');
const ARTICLES_JSON = path.join(REPO_DIR, 'blog', 'articles.json');

function parseJaysData() {
  if (!fs.existsSync(JAYS_DATA)) return [];
  const lines = fs.readFileSync(JAYS_DATA, 'utf8').split('\n').filter(Boolean);
  return lines.map((line) => {
    const date = line.slice(0, 10).trim();
    const opponent = line.slice(10, 30).trim();
    const ha = line.slice(30, 34).trim();
    const js = line.slice(34, 36).trim();
    const os = line.slice(36, 38).trim();
    const result = line.slice(38, 39).trim();
    const status = line.slice(39, 49).trim();
    return { date, opponent, ha, js, os, result, status };
  });
}

function parseHrTracker() {
  if (!fs.existsSync(HR_TRACKER)) return null;
  const lines = fs.readFileSync(HR_TRACKER, 'utf8').split('\n').filter((l) => l.trim());
  if (lines.length < 2) return null;

  const header = lines[0];
  const game = {
    date: header.slice(0, 10).trim(),
    opponent: header.slice(10, 30).trim(),
    venue: header.slice(30, 45).trim(),
    time: header.slice(45, 53).trim(),
    weather: header.slice(53, 73).trim(),
    wind: header.slice(73, 88).trim(),
    temp: header.slice(88, 92).trim(),
    jaysHr9: header.slice(92, 98).trim(),
    oppHr9: header.slice(98, 104).trim(),
  };

  const pitcherMatch = lines[1].match(/MODE:\s*(\S+)\s*PITCHER:\s*([^\(]+?)\s+HAND:\s*(\S)\s+HR\/9:\s*([\d.]+)/i);
  const pitcher = pitcherMatch
    ? {
        mode: pitcherMatch[1].trim(),
        name: pitcherMatch[2].trim(),
        hand: pitcherMatch[3].trim(),
        hr9: pitcherMatch[4].trim(),
      }
    : { mode: '', name: '', hand: '', hr9: '' };

  const players = [];
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Fixed-width name (18 chars) followed by whitespace-separated stats.
    // Columns: Pos Gms HR RBI [vH] OPS ExitVel
    const name = line.slice(0, 18).trim();
    const parts = line.slice(18).trim().split(/\s+/);
    if (parts.length < 6) continue;

    if (parts.length === 6) {
      const [pos, gm, hr, rbi, ops, exitVel] = parts;
      players.push({ name, pos, gm, hr, rbi, vH: '—', ops, exitVel });
    } else if (parts.length >= 7) {
      const [pos, gm, hr, rbi, vH, ops, exitVel] = parts;
      players.push({ name, pos, gm, hr, rbi, vH, ops, exitVel });
    }
  }

  return { game, pitcher, players };
}

function formatResult(row) {
  const score = row.js || row.os ? `${row.js}-${row.os}` : '';
  const opponent = row.opponent;
  const location = row.ha === 'HOME' ? 'vs' : 'at';
  if (row.status.toLowerCase() === 'final' || row.status.toLowerCase().startsWith('final')) {
    const res = row.result === 'W' ? 'W' : row.result === 'L' ? 'L' : row.result;
    return `${res} ${score} ${location} ${opponent}`;
  }
  return `${location} ${opponent} — ${row.status}`;
}

function gameCardClass(row) {
  if (row.result === 'W') return 'game-card win';
  if (row.result === 'L') return 'game-card loss';
  return 'game-card scheduled';
}

function gameCardBadge(row) {
  if (row.result === 'W') return '<span class="badge win">W</span>';
  if (row.result === 'L') return '<span class="badge loss">L</span>';
  return '';
}

function bluejaysPage(schedule, tracker, articles) {
  const recentGames = schedule.slice().reverse().slice(0, 10);
  const scheduleRows = schedule
    .map(
      (row) => `
          <tr>
            <td>${row.date}</td>
            <td>${row.ha === 'HOME' ? 'vs' : 'at'} ${row.opponent}</td>
            <td>${row.js && row.os ? `${row.js}-${row.os}` : '—'}</td>
            <td>${row.result === 'W' ? 'W' : row.result === 'L' ? 'L' : '—'}</td>
            <td>${row.status}</td>
          </tr>`,
    )
    .join('');

  const scheduleCards = schedule
    .map(
      (row) => `
        <div class="${gameCardClass(row)}">
          <div class="game-card-header">
            <div class="game-card-date">${row.date}</div>
            ${gameCardBadge(row)}
          </div>
          <div class="game-card-teams">${row.ha === 'HOME' ? 'vs' : 'at'} ${row.opponent}</div>
          ${row.js && row.os ? `<div class="game-card-score">${row.js} - ${row.os}</div>` : ''}
          <div class="game-card-status">${row.status}</div>
        </div>`,
    )
    .join('');

  const recentRows = recentGames
    .map(
      (row) => `
          <tr>
            <td>${row.date}</td>
            <td>${row.ha === 'HOME' ? 'vs' : 'at'} ${row.opponent}</td>
            <td>${formatResult(row)}</td>
          </tr>`,
    )
    .join('');

  const recentCards = recentGames
    .map(
      (row) => `
        <div class="${gameCardClass(row)}">
          <div class="game-card-header">
            <div class="game-card-date">${row.date}</div>
            ${gameCardBadge(row)}
          </div>
          <div class="game-card-teams">${formatResult(row)}</div>
        </div>`,
    )
    .join('');

  const playerCards = tracker
    ? tracker.players
        .map(
          (p) => `
        <div class="player-card">
          <div class="player-card-header">
            <span class="player-name">${p.name}</span>
            <span class="player-pos">${p.pos}</span>
          </div>
          <div class="player-stats">
            <div class="stat"><span class="stat-label">GM</span><span class="stat-value">${p.gm}</span></div>
            <div class="stat"><span class="stat-label">HR</span><span class="stat-value">${p.hr}</span></div>
            <div class="stat"><span class="stat-label">RBI</span><span class="stat-value">${p.rbi}</span></div>
            <div class="stat"><span class="stat-label">OPS</span><span class="stat-value">${p.ops}</span></div>
          </div>
          <div class="player-exit-vel">Exit Vel: <strong>${p.exitVel}</strong></div>
        </div>`,
        )
        .join('')
    : '';

  const trackerSection = tracker
    ? `
      <section class="tracker-section">
        <div class="section-header">
          <h2>Home Run Tracker</h2>
          <span class="section-tag">${tracker.game.date} ${tracker.game.time}</span>
        </div>
        <div class="tracker-matchup">
          <div class="tracker-game-info">
            <span class="tracker-opponent">${tracker.game.opponent}</span>
            <span class="tracker-venue">${tracker.game.venue}</span>
          </div>
          <div class="tracker-pitcher">
            <span class="tracker-pitcher-label">Opposing Pitcher</span>
            <span class="tracker-pitcher-name">${tracker.pitcher.name}</span>
            <span class="tracker-pitcher-detail">${tracker.pitcher.hand}HP · HR/9 ${tracker.pitcher.hr9} · Lineup ${tracker.pitcher.mode === 'CONF' ? 'Confirmed' : 'Preview'}</span>
          </div>
        </div>

        <div class="table-wrap desktop-only">
          <table>
            <thead>
              <tr><th>Batter</th><th>Pos</th><th>GM</th><th>HR</th><th>RBI</th><th>OPS</th><th>Exit Vel</th></tr>
            </thead>
            <tbody>
${tracker.players
  .map(
    (p) => `
              <tr>
                <td>${p.name}</td>
                <td>${p.pos}</td>
                <td>${p.gm}</td>
                <td>${p.hr}</td>
                <td>${p.rbi}</td>
                <td>${p.ops}</td>
                <td><strong>${p.exitVel}</strong></td>
              </tr>`,
  )
  .join('')}
            </tbody>
          </table>
        </div>
        <div class="player-cards mobile-only">
${playerCards}
        </div>
      </section>`
    : '';

  const articleCards = articles.length
    ? articles
        .map(
          (a, i) => `
        <a href="blog/articles/${a.slug}.html" class="article-card${i === 0 ? ' featured' : ''}">
          <div class="article-card-content">
            <div class="article-card-date">${a.date}</div>
            <h3 class="article-card-title">${a.title}</h3>
            ${a.excerpt ? `<p class="article-card-excerpt">${a.excerpt}</p>` : ''}
          </div>
          <svg class="article-card-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </a>`,
        )
        .join('')
    : '<p class="empty-state">No Blue Jays articles yet.</p>';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Toronto Blue Jays schedule, results, and home-run tracker powered by live MLB data.">
  <title>Toronto Blue Jays — Jason Spooner</title>
  <link rel="stylesheet" href="css/style.css">
  <style>
    .hub-header { text-align: center; margin-bottom: var(--space-xl); }
    .hub-header h2 { margin-bottom: var(--space-2xs); }
    .hub-header p { color: var(--muted); }
    .section-header { display: flex; align-items: baseline; gap: var(--space-s); margin-bottom: var(--space-m); flex-wrap: wrap; }
    .section-header h2 { margin: 0; }
    .section-tag { color: var(--muted); font-size: var(--step--1); }

    /* Articles - top priority */
    .articles-grid { display: grid; gap: var(--space-s); }
    .article-card { display: flex; align-items: center; justify-content: space-between; gap: var(--space-m); padding: var(--space-m); border: 1px solid var(--line); border-radius: 10px; text-decoration: none; color: inherit; transition: box-shadow 0.15s, border-color 0.15s; }
    .article-card:hover { border-color: #3366cc; box-shadow: 0 2px 12px rgba(51,102,204,0.1); }
    .article-card.featured { border-left: 4px solid #3366cc; background: #fafcff; }
    .article-card-content { flex: 1; min-width: 0; }
    .article-card-date { font-size: var(--step--1); color: var(--muted); margin-bottom: var(--space-3xs); }
    .article-card-title { font-size: var(--step-0); font-weight: 600; margin: 0 0 var(--space-3xs); line-height: 1.3; }
    .article-card.featured .article-card-title { font-size: var(--step-1); }
    .article-card-excerpt { font-size: var(--step--1); color: var(--muted); margin: 0; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .article-card-arrow { width: 20px; height: 20px; flex-shrink: 0; color: var(--muted); }

    /* Game cards */
    .game-cards-grid { display: grid; gap: var(--space-s); }
    .game-card { padding: var(--space-m); border-radius: 10px; border: 1px solid var(--line); }
    .game-card.win { border-left: 4px solid #2d8a4e; background: #f6fbf8; }
    .game-card.loss { border-left: 4px solid #c0392b; background: #fdf6f5; }
    .game-card.scheduled { border-left: 4px solid #888; }
    .game-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-2xs); }
    .game-card-date { font-size: var(--step--1); color: var(--muted); }
    .badge { font-size: var(--step--2); font-weight: 700; padding: 2px 8px; border-radius: 4px; }
    .badge.win { background: #2d8a4e; color: #fff; }
    .badge.loss { background: #c0392b; color: #fff; }
    .game-card-teams { font-weight: 600; font-size: var(--step-0); margin-bottom: var(--space-2xs); }
    .game-card-score { font-size: var(--step-1); color: var(--muted); margin-bottom: var(--space-2xs); }
    .game-card-status { font-size: var(--step--1); color: var(--muted); }

    /* HR Tracker */
    .tracker-section { border: 1px solid var(--line); border-radius: 10px; padding: var(--space-m); }
    .tracker-matchup { display: grid; gap: var(--space-m); margin-bottom: var(--space-m); }
    .tracker-game-info { display: flex; flex-direction: column; gap: var(--space-2xs); }
    .tracker-opponent { font-weight: 600; font-size: var(--step-1); }
    .tracker-venue { font-size: var(--step--1); color: var(--muted); }
    .tracker-pitcher { display: flex; flex-direction: column; gap: var(--space-2xs); }
    .tracker-pitcher-label { font-size: var(--step--2); color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .tracker-pitcher-name { font-weight: 600; font-size: var(--step-0); }
    .tracker-pitcher-detail { font-size: var(--step--1); color: var(--muted); }

    /* Player cards */
    .player-cards { display: none; gap: var(--space-s); }
    .player-card { border: 1px solid var(--line); border-radius: 10px; padding: var(--space-m); }
    .player-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-xs); }
    .player-name { font-weight: 600; font-size: var(--step-0); }
    .player-pos { font-size: var(--step--1); color: var(--muted); background: #f0f0f0; padding: 2px 8px; border-radius: 4px; }
    .player-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-xs); }
    .stat { display: flex; flex-direction: column; gap: 2px; }
    .stat-label { font-size: var(--step--2); color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .stat-value { font-weight: 600; font-size: var(--step-0); }
    .player-exit-vel { margin-top: var(--space-xs); padding-top: var(--space-xs); border-top: 1px solid var(--line); font-size: var(--step--1); color: var(--muted); }
    .player-exit-vel strong { color: #3366cc; }

    .empty-state { color: var(--muted); padding: var(--space-xl); text-align: center; }

    nav { display: flex; flex-wrap: wrap; gap: var(--space-xs) var(--space-s); }

    /* Table overrides */
    .table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; margin: var(--space-m) 0; border: 1px solid var(--line); border-radius: 10px; }
    .table-wrap table { width: 100%; min-width: 640px; border-collapse: collapse; font-size: var(--step--1); }
    th, td { padding: var(--space-2xs) var(--space-xs); border-bottom: 1px solid var(--line); text-align: left; }
    th { font-weight: 600; background: #f7f7f7; }
    tr:last-child td { border-bottom: none; }

    section { margin-bottom: var(--space-xl); }

    @media (max-width: 640px) {
      .desktop-only { display: none; }
      .player-cards { display: grid; gap: var(--space-s); }
      .player-card { box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
      .player-stats { grid-template-columns: repeat(2, 1fr); }
      .table-wrap table { min-width: 100%; }
      th, td { padding: var(--space-3xs) var(--space-2xs); }
      section { margin-bottom: var(--space-2xl); }
      .hub-header { margin-bottom: var(--space-l); }
      .article-card { padding: var(--space-s); }
      .article-card.featured { padding: var(--space-m); }
    }

    @media (min-width: 641px) {
      .articles-grid { grid-template-columns: 1fr 1fr; }
      .article-card.featured { grid-column: 1 / -1; }
      .tracker-matchup { grid-template-columns: 1fr 1fr; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Jason Spooner</h1>
      <p>IT Leader · Developer · Creator</p>
      <nav>
        <a href="index.html">Resume</a>
        <a href="blog/index.html">Blog</a>
        <a href="sports/index.html">Sports</a>
        <a href="bluejays.html">Blue Jays</a>
      </nav>
    </header>

    <section class="hub-header">
      <h2>Toronto Blue Jays Hub</h2>
      <p>Scores, analysis, and odds — all in one place</p>
    </section>

    <section>
      <div class="section-header">
        <h2>Latest Articles</h2>
      </div>
      <div class="articles-grid">
${articleCards}
      </div>
    </section>

    <section>
      <div class="section-header">
        <h2>Recent Games</h2>
      </div>
      <div class="game-cards-grid desktop-only">
${recentCards}
      </div>
      <div class="game-cards-grid mobile-only">
${recentCards}
      </div>
    </section>

    ${trackerSection}

    <section>
      <div class="section-header">
        <h2>Full Schedule</h2>
      </div>
      <div class="table-wrap desktop-only">
        <table>
          <thead>
            <tr><th>Date</th><th>Opponent</th><th>Score</th><th>Result</th><th>Status</th></tr>
          </thead>
          <tbody>
${scheduleRows}
          </tbody>
        </table>
      </div>
      <div class="game-cards-grid mobile-only">
${scheduleCards}
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
  const schedule = parseJaysData();
  const tracker = parseHrTracker();

  let articles = [];
  if (fs.existsSync(ARTICLES_JSON)) {
    articles = JSON.parse(fs.readFileSync(ARTICLES_JSON, 'utf8')).filter(
      (a) => Array.isArray(a.tags) && a.tags.some((t) => t.toLowerCase() === 'mlb' || t.toLowerCase() === 'bluejays'),
    );
  }

  const html = bluejaysPage(schedule, tracker, articles);
  fs.writeFileSync(path.join(REPO_DIR, 'bluejays.html'), html);
  console.log(`✓ bluejays.html generated with ${schedule.length} schedule rows and ${tracker ? tracker.players.length : 0} HR candidates`);
}

if (require.main === module) {
  main();
}

module.exports = { parseJaysData, parseHrTracker, bluejaysPage };
