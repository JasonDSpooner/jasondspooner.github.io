#!/bin/bash

# Daily Wager Generator
# Generates a wager article from bets.json, commits, and pushes to GitHub

set -e

REPO_DIR="/home/theone/Projects/jasondspooner.github.io"
cd "$REPO_DIR"

echo "💰 Generating daily wager article..."

# Generate wager data
node -e '
const fs = require("fs");
const bets = JSON.parse(fs.readFileSync("content/bets.json", "utf8"));
const today = new Date().toISOString().split("T")[0];
const todaysBets = bets.filter(b => b.date === today);

if (todaysBets.length === 0) {
    console.log("No bets found for today, skipping.");
    process.exit(0);
}

const content = `
<h2>Bets for ${today}</h2>
<ul>
  ${todaysBets.map(b => `<li>${b.matchup}: ${b.selection} (${b.bet_type}) - $${b.wager} @ ${b.odds}</li>`).join("")}
</ul>`;

const data = {
    title: `Daily Wager - ${today}`,
    content: content,
    slug: `daily-wager-${today.replace(/-/g, "")}`,
    date: today,
    tags: ["wager", "sports"]
};

fs.writeFileSync("/tmp/article-data.json", JSON.stringify(data));
'

# Check if article data was generated
if [ -f "/tmp/article-data.json" ]; then
    node generate-article.js --from-json /tmp/article-data.json
    rm /tmp/article-data.json
    
    # Regenerate blog index
    node generate-blog-index.js
    
    # ./deploy.sh
    
    echo "✓ Daily wager article generated (deploy skipped)!"
else
    echo "No wager article generated."
fi
