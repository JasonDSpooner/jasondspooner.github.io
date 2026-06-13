#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const TDB_PATH = path.join(__dirname, 'content/two-dollar-better.json');
const RESULTS_PATH = path.join(__dirname, 'content/results.json');
const BLOG_DIR = path.join(__dirname, 'blog');
const ARTICLES_DIR = path.join(BLOG_DIR, 'articles');

const tdb = JSON.parse(fs.readFileSync(TDB_PATH, 'utf8'));
const results = JSON.parse(fs.readFileSync(RESULTS_PATH, 'utf8'));

function evaluateBet(bet, result) {
  const betType = (bet.betType || bet.bet_type || 'moneyline').toLowerCase();
  const selection = (bet.selection || '').trim();

  if (betType === 'moneyline') {
    return result.winner === selection ? 'win' : 'loss';
  }

  if (betType === 'spread') {
    // Selection like "Montreal Alouettes -3.5" or "Toronto Argonauts +3.5"
    const match = selection.match(/^(.+?)\s+([+-]?\d+(?:\.\d+)?)$/);
    if (!match || result.homeScore == null || result.awayScore == null) return 'pending';
    const [, team, lineStr] = match;
    const line = parseFloat(lineStr);
    const isHome = team === result.homeTeam;
    const isAway = team === result.awayTeam;
    if (!isHome && !isAway) return 'pending';
    const teamScore = isHome ? result.homeScore : result.awayScore;
    const opponentScore = isHome ? result.awayScore : result.homeScore;
    const margin = teamScore - opponentScore;
    return margin + line > 0 ? 'win' : 'loss';
  }

  if (betType === 'total') {
    // Selection like "Over 47.5" or "Under 47.5"
    const match = selection.match(/^(Over|Under)\s+(\d+(?:\.\d+)?)$/i);
    if (!match || result.homeScore == null || result.awayScore == null) return 'pending';
    const [, side, totalStr] = match;
    const total = parseFloat(totalStr);
    const combined = result.homeScore + result.awayScore;
    const overWins = combined > total;
    return (side.toLowerCase() === 'over' && overWins) || (side.toLowerCase() === 'under' && !overWins) ? 'win' : 'loss';
  }

  return 'pending';
}

let updated = false;
const processedBets = [];

for (const bet of tdb.bets) {
  if ((bet.status || 'pending') === 'pending') {
    const gameResult = results.find(r => r.matchup === bet.matchup && r.date === bet.date);
    if (gameResult) {
      const outcome = evaluateBet(bet, gameResult);
      if (outcome !== 'pending') {
        const wager = Number(bet.wager || bet.stake || 2);
        const odds = Number(bet.odds || 1.95);
        bet.status = outcome;
        bet.result = outcome;
        if (outcome === 'win') {
          // Net profit = wager * (odds - 1); the original stake was already in the bankroll
          tdb.currentBalance += wager * (odds - 1);
          bet.payout = wager * odds;
        } else if (outcome === 'loss') {
          tdb.currentBalance -= wager;
          bet.payout = 0;
        }
        bet.runningBalance = tdb.currentBalance;
        tdb.runningBalance = tdb.currentBalance;
        updated = true;
        processedBets.push(bet);
      }
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
