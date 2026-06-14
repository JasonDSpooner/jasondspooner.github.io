#!/bin/bash

# Collect Morning Odds
# Runs the odds collection script

REPO_DIR="/home/theone/Projects/jasondspooner.github.io"
cd "$REPO_DIR"

echo "📊 Collecting morning odds..."

node collect-odds.js

echo "✓ Morning odds collection complete."
