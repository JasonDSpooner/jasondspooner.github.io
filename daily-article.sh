#!/bin/bash

# Daily Article Pipeline
# Generates a new article, commits, and pushes to GitHub

set -e

REPO_DIR="/home/theone/Projects/jasondspooner.github.io"
cd "$REPO_DIR"

echo "📰 Starting daily article pipeline..."

# Generate article from JSON if provided, otherwise use default
if [ -f "/tmp/article-data.json" ]; then
  node generate-article.js --from-json /tmp/article-data.json
  rm /tmp/article-data.json
else
  # Generate a default article for today
  DATE=$(date +"%Y-%m-%d")
  TITLE="Daily Tech Insights - $DATE"
  SLUG="daily-tech-insights-$(date +"%Y%m%d")"
  
  node generate-article.js \
    --title "$TITLE" \
    --slug "$SLUG" \
    --content "<p>Today's tech insights and observations from the world of IT leadership and development.</p>
    
<h2>What I Learned Today</h2>
<p>Every day brings new challenges and opportunities to learn. Here are my thoughts on today's developments in technology.</p>

<h2>Industry News</h2>
<p>The tech world never stands still. Here are the stories that caught my attention today.</p>

<h2>Personal Reflections</h2>
<p>As a CTO, I'm always thinking about how technology can better serve our teams and customers.</p>"
fi

# Regenerate blog index
node generate-blog-index.js

# Deploy
./deploy.sh

echo "✓ Daily article published!"
