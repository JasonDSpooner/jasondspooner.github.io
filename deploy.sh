#!/bin/bash

# Deploy script for jasondspooner.github.io
# Commits and pushes changes to GitHub

set -e

REPO_DIR="/home/theone/Projects/jasondspooner.github.io"
cd "$REPO_DIR"

echo "📦 Deploying to GitHub..."

# Check if there are changes
if git diff --quiet && git diff --cached --quiet; then
  echo "No changes to deploy"
  exit 0
fi

# Stage all changes
git add -A

# Commit with timestamp
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
git commit -m "Add blog section with daily article system

- Created blog/index.html with article listing
- Added article template and generator script
- Added js/blog.js for dynamic article loading
- Added first article: Getting Started with AI Automation
- Updated main navigation with Blog link

Co-Authored-By: Paperclip <noreply@paperclip.ing>"

# Push to GitHub
git push origin main

echo "✓ Deployed successfully!"
