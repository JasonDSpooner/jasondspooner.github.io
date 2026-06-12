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

  const trackerSection = tracker
    ? `
      <section>
        <h2>Home Run Tracker — ${tracker.game.date} ${tracker.game.time}</h2>
        <p><strong>${tracker.game.opponent}</strong> at ${tracker.game.venue} | ${tracker.game.weather}, ${tracker.game.wind}, ${tracker.game.temp}°F</p>
        <p>Opposing pitcher: <strong>${tracker.pitcher.name}</strong> (${tracker.pitcher.hand}HP, HR/9 ${tracker.pitcher.hr9}) — lineup ${tracker.pitcher.mode === 'CONF' ? 'confirmed' : 'preview'}</p>

        <table>
          <thead>
            <tr><th>Batter</th><th>Pos</th><th>GM</th><th>HR</th><th>RBI</th><th>vH</th><th>OPS</th><th>Exit Vel</th></tr>
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
              <td>${p.vH}</td>
              <td>${p.ops}</td>
              <td><strong>${p.exitVel}</strong></td>
            </tr>`,
  )
  .join('')}
          </tbody>
        </table>
      </section>`
    : '<p>No HR tracker data available.</p>';

  const articleLinks = articles.length
    ? `<ul>${articles.map((a) => `<li><a href="blog/articles/${a.slug}.html">${a.title}</a> <span class="blog-date">${a.date}</span></li>`).join('')}</ul>`
    : '<p>No Blue Jays articles yet.</p>';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Toronto Blue Jays schedule, results, and home-run tracker powered by live MLB data.">
  <title>Toronto Blue Jays — Jason Spooner</title>
  <link rel="stylesheet" href="css/style.css">
  <style>
    table { width: 100%; border-collapse: collapse; margin: var(--space-m) 0; }
    th, td { padding: var(--space-2xs) var(--space-xs); border-bottom: 1px solid var(--line); text-align: left; }
    th { font-weight: 600; }
    .blog-date { color: var(--muted); font-size: var(--step--1); }
    section { margin-bottom: var(--space-xl); }
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
        <a href="bluejays.html">Blue Jays</a>
      </nav>
    </header>

    <section>
      <h2>🍁 Toronto Blue Jays Hub</h2>
      <p>Live schedule, results, and home-run tracker data pulled from the Blue Jays Smart Bet system.</p>
    </section>

    <section>
      <h2>Recent Results</h2>
      <table>
        <thead>
          <tr><th>Date</th><th>Opponent</th><th>Result</th></tr>
        </thead>
        <tbody>
${recentRows}
        </tbody>
      </table>
    </section>

    ${trackerSection}

    <section>
      <h2>Schedule</h2>
      <table>
        <thead>
          <tr><th>Date</th><th>Opponent</th><th>Score</th><th>Result</th><th>Status</th></tr>
        </thead>
        <tbody>
${scheduleRows}
        </tbody>
      </table>
    </section>

    <section>
      <h2>Blue Jays Articles</h2>
      ${articleLinks}
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
