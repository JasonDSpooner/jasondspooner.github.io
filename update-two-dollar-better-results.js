#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const TDB_PATH = path.join(__dirname, 'content/two-dollar-better.json');
const RESULTS_PATH = path.join(__dirname, 'content/results.json');
const BLOG_DIR = path.join(__dirname, 'blog');
const ARTICLES_DIR = path.join(BLOG_DIR, 'articles');

const tdb = JSON.parse(fs.readFileSync(TDB_PATH, 'utf8'));
const results = JSON.parse(fs.readFileSync(RESULTS_PATH, 'utf8'));

let updated = false;
const processedBets = [];

for (const bet of tdb.bets) {
  if (bet.status === 'pending') {
    const gameResult = results.find(r => r.matchup === bet.matchup && r.date === bet.date);
    if (gameResult) {
      if (gameResult.winner === bet.selection) {
        bet.status = 'win';
        tdb.currentBalance += (bet.wager * bet.odds);
      } else {
        bet.status = 'loss';
      }
      tdb.runningBalance = tdb.currentBalance;
      updated = true;
      processedBets.push(bet);
    }
  }
}

if (updated) {
  fs.writeFileSync(TDB_PATH, JSON.stringify(tdb, null, 2));
  
  // Generate "cranky old man" blog post
  const date = new Date().toISOString().split('T')[0];
  const title = `Two Dollar Better Update - ${date}`;
  const content = `
    <h2>The Results Are In</h2>
    <p>Well, look at that. Another day, another couple of bucks thrown at the wall. Here's how my "strategy" held up:</p>
    <ul>
      ${processedBets.map(b => `<li>${b.matchup}: ${b.status.toUpperCase()}! (Selection: ${b.selection}, Odds: ${b.odds})</li>`).join('')}
    </ul>
    <p>My balance is now sitting at $${tdb.currentBalance.toFixed(2)}. Don't ask me how, it's probably just luck.</p>
  `;
  
  // Use generate-article.js logic
  const { generateArticleHTML, updateArticlesIndex, slugify } = require('./generate-article');
  const slug = `tdb-update-${date.replace(/-/g, '')}`;
  const html = generateArticleHTML(title, content, date, title);
  fs.writeFileSync(path.join(ARTICLES_DIR, `${slug}.html`), html);
  updateArticlesIndex(slug, title, date, `TDB update for ${date}`, ['wager', 'sports']);
  
  console.log('✓ Two-dollar better bets updated and blog post generated.');
} else {
  console.log('No new results to process.');
}
