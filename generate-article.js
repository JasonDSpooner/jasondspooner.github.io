#!/usr/bin/env node

/**
 * Article Generator for jasondspooner.github.io
 * 
 * Usage:
 *   node generate-article.js --title "Article Title" --content "Article content" --slug "article-slug"
 *   node generate-article.js --from-json article-data.json
 */

const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.join(__dirname, 'blog');
const ARTICLES_DIR = path.join(BLOG_DIR, 'articles');
const ARTICLES_JSON = path.join(BLOG_DIR, 'articles.json');
const TEMPLATE_PATH = path.join(ARTICLES_DIR, 'template.html');

function formatDate(date) {
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function generateArticleHTML(title, content, date, description) {
  const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  
  return template
    .replace(/ARTICLE_TITLE/g, title)
    .replace(/ARTICLE_DATE/g, date)
    .replace(/ARTICLE_CONTENT/g, content)
    .replace(/ARTICLE_DESCRIPTION/g, description || title);
}

function updateArticlesIndex(slug, title, date, excerpt) {
  let articles = [];
  
  if (fs.existsSync(ARTICLES_JSON)) {
    articles = JSON.parse(fs.readFileSync(ARTICLES_JSON, 'utf8'));
  }
  
  // Add new article at the beginning
  articles.unshift({ slug, title, date, excerpt });
  
  fs.writeFileSync(ARTICLES_JSON, JSON.stringify(articles, null, 2));
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log(`
Article Generator

Usage:
  node generate-article.js --title "Title" --content "<p>Content</p>" [--slug "slug"] [--description "desc"]
  node generate-article.js --from-json article-data.json

Options:
  --title        Article title (required)
  --content      Article content in HTML (required unless --from-json)
  --slug         URL slug (auto-generated from title if omitted)
  --description  Meta description (defaults to title)
  --from-json    Read article data from JSON file
  --help         Show this help
    `);
    process.exit(0);
  }
  
  let title, content, slug, description, date;
  
  if (args.includes('--from-json')) {
    const jsonPath = args[args.indexOf('--from-json') + 1];
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    title = data.title;
    content = data.content;
    slug = data.slug || slugify(title);
    description = data.description;
    date = data.date || formatDate(new Date());
  } else {
    title = args[args.indexOf('--title') + 1];
    content = args[args.indexOf('--content') + 1];
    slug = args.includes('--slug') ? args[args.indexOf('--slug') + 1] : slugify(title);
    description = args.includes('--description') ? args[args.indexOf('--description') + 1] : title;
    date = formatDate(new Date());
  }
  
  if (!title || !content) {
    console.error('Error: --title and --content are required');
    process.exit(1);
  }
  
  // Ensure directories exist
  fs.mkdirSync(ARTICLES_DIR, { recursive: true });
  
  // Generate article HTML
  const html = generateArticleHTML(title, content, date, description);
  const articlePath = path.join(ARTICLES_DIR, `${slug}.html`);
  fs.writeFileSync(articlePath, html);
  
  // Update articles index
  const excerpt = content.replace(/<[^>]*>/g, '').substring(0, 150) + '...';
  updateArticlesIndex(slug, title, date, excerpt);
  
  console.log(`✓ Article created: ${articlePath}`);
  console.log(`✓ Index updated: ${ARTICLES_JSON}`);
}

if (require.main === module) {
  main();
}

module.exports = { generateArticleHTML, updateArticlesIndex, slugify, formatDate };
