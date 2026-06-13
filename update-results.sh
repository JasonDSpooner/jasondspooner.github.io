#!/bin/bash

# Results Generator
# Generates a results article from results.json

set -e

REPO_DIR="/home/theone/Projects/jasondspooner.github.io"
cd "$REPO_DIR"

echo "📊 Generating daily results article..."

# Generate results data
node -e '
const fs = require("fs");
const results = JSON.parse(fs.readFileSync("content/results.json", "utf8"));
const today = new Date().toISOString().split("T")[0];
const todaysResults = results.filter(r => r.date === today);

if (todaysResults.length === 0) {
    console.log("No results found for today, skipping.");
    process.exit(0);
}

const content = `
<h2>Results for ${today}</h2>
<ul>
  ${todaysResults.map(r => `<li>${r.matchup}: Winner ${r.winner}</li>`).join("")}
</ul>`;

const data = {
    title: `Daily Results - ${today}`,
    content: content,
    slug: `daily-results-${today.replace(/-/g, "")}`,
    date: today,
    tags: ["results", "sports"]
};

fs.writeFileSync("/tmp/article-data.json", JSON.stringify(data));
'

# Check if article data was generated
if [ -f "/tmp/article-data.json" ]; then
    node generate-article.js --from-json /tmp/article-data.json
    rm /tmp/article-data.json
    
    # Regenerate blog index
    node generate-blog-index.js
    
    echo "✓ Daily results article generated!"
else
    echo "No results article generated."
fi
