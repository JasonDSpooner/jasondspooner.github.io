#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Mocked scraping function for now.
// In a real scenario, this would use fetch or puppeteer to get data.
function fetchOdds() {
  console.log("Fetching odds from sources...");
  // Simulate data from Sports Select and Bet365
  return [
    {
      source: 'Sports Select',
      date: new Date().toISOString().split('T')[0],
      matchup: 'Montreal Alouettes vs Toronto Argonauts',
      odds: { home: 1.95, away: 1.85 }
    },
    {
      source: 'Bet365',
      date: new Date().toISOString().split('T')[0],
      matchup: 'Montreal Alouettes vs Toronto Argonauts',
      odds: { home: 1.92, away: 1.88 }
    }
  ];
}

const odds = fetchOdds();
const ODDS_PATH = path.join(__dirname, 'content/odds.json');

let existingOdds = [];
try {
  existingOdds = JSON.parse(fs.readFileSync(ODDS_PATH, 'utf8'));
} catch (e) {
  // File might be empty or invalid, ignore
}

// Append new odds
existingOdds.push(...odds);
fs.writeFileSync(ODDS_PATH, JSON.stringify(existingOdds, null, 2));

console.log('✓ Odds collected and persisted.');
