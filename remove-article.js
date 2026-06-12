#!/usr/bin/env node

/**
 * Remove an article from jasondspooner.github.io by slug.
 *
 * Usage:
 *   node remove-article.js --slug article-slug
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO_DIR = __dirname;
const BLOG_DIR = path.join(REPO_DIR, 'blog');
const ARTICLES_DIR = path.join(BLOG_DIR, 'articles');
const IMAGES_DIR = path.join(BLOG_DIR, 'images');
const ARTICLES_JSON = path.join(BLOG_DIR, 'articles.json');
const INDEXER = path.join(REPO_DIR, 'generate-blog-index.js');
const SPORT_INDEXER = path.join(REPO_DIR, 'generate-sport-index.js');
const DEPLOYER = path.join(REPO_DIR, 'deploy.sh');

function parseArgs(argv) {
  const args = argv.slice(2);
  const get = (flag) => {
    const idx = args.indexOf(flag);
    return idx >= 0 ? args[idx + 1] : undefined;
  };
  return {
    slug: get('--slug'),
    dryRun: args.includes('--dry-run'),
  };
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.slug) {
    console.error('Error: --slug is required');
    process.exit(1);
  }

  const slug = args.slug;
  const articlePath = path.join(ARTICLES_DIR, `${slug}.html`);
  const imageDir = path.join(IMAGES_DIR, slug);

  if (!fs.existsSync(articlePath) && !fs.existsSync(imageDir)) {
    console.error(`Error: no article or image found for slug "${slug}"`);
    process.exit(1);
  }

  if (args.dryRun) {
    console.log(`[dry-run] Would remove ${articlePath}`);
    console.log(`[dry-run] Would remove ${imageDir}`);
    console.log(`[dry-run] Would remove "${slug}" from ${ARTICLES_JSON}`);
    process.exit(0);
  }

  let removed = false;

  if (fs.existsSync(articlePath)) {
    fs.unlinkSync(articlePath);
    console.log(`✓ Removed ${articlePath}`);
    removed = true;
  }

  if (fs.existsSync(imageDir)) {
    fs.rmSync(imageDir, { recursive: true, force: true });
    console.log(`✓ Removed ${imageDir}`);
    removed = true;
  }

  if (fs.existsSync(ARTICLES_JSON)) {
    const articles = JSON.parse(fs.readFileSync(ARTICLES_JSON, 'utf8'));
    const filtered = articles.filter((a) => a.slug !== slug);
    if (filtered.length < articles.length) {
      fs.writeFileSync(ARTICLES_JSON, JSON.stringify(filtered, null, 2));
      console.log(`✓ Removed "${slug}" from ${ARTICLES_JSON}`);
      removed = true;
    }
  }

  if (!removed) {
    console.log(`No files found to remove for "${slug}"`);
    process.exit(0);
  }

  console.log('Regenerating blog index...');
  execSync(`node "${INDEXER}"`, { cwd: REPO_DIR, stdio: 'inherit' });

  console.log('Regenerating sport index pages...');
  execSync(`node "${SPORT_INDEXER}"`, { cwd: REPO_DIR, stdio: 'inherit' });

  console.log('Deploying to GitHub Pages...');
  execSync(`"${DEPLOYER}"`, { cwd: REPO_DIR, stdio: 'inherit' });

  console.log(`✓ Removed and redeployed without "${slug}"`);
}

main();
