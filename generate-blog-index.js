#!/usr/bin/env node

/**
 * Generate blog index from articles.json
 */

const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.join(__dirname, 'blog');
const ARTICLES_JSON = path.join(BLOG_DIR, 'articles.json');
const INDEX_PATH = path.join(BLOG_DIR, 'index.html');

function generateIndex(articles) {
  const articleList = articles.map(a => `
        <li>
          <span class="blog-date">${a.date}</span>
          <h3><a href="articles/${a.slug}.html">${a.title}</a></h3>
          <p class="blog-excerpt">${a.excerpt}</p>
        </li>`).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Blog articles by Jason Spooner — IT insights, development stories, and creative writing.">
  <title>Blog — Jason Spooner</title>
  <link rel="stylesheet" href="../css/style.css">
  <style>
    .blog-list { list-style: none; }
    .blog-list li { 
      padding: var(--space-m) 0; 
      border-bottom: 1px solid var(--line); 
    }
    .blog-list li:last-child { border-bottom: none; }
    .blog-date { color: var(--muted); font-size: var(--step--1); }
    .blog-excerpt { margin-top: var(--space-3xs); }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Jason Spooner</h1>
      <p>IT Leader · Developer · Creator</p>
      <nav>
        <a href="../index.html">Resume</a>
        <a href="index.html">Blog</a>
        <a href="../sports/index.html">Sports</a>
        <a href="../bluejays.html">Blue Jays</a>
      </nav>
    </header>

    <section>
      <h2>Blog</h2>
      <p>Thoughts on technology, development, and life.</p>
      
      <ul class="blog-list">
${articleList}
      </ul>
    </section>

    <footer>
      <p>© Jason Spooner</p>
    </footer>
  </div>
</body>
</html>`;
}

function main() {
  if (!fs.existsSync(ARTICLES_JSON)) {
    console.error('No articles.json found');
    process.exit(1);
  }

  const articles = JSON.parse(fs.readFileSync(ARTICLES_JSON, 'utf8'));
  const html = generateIndex(articles);
  fs.writeFileSync(INDEX_PATH, html);
  console.log(`✓ Blog index generated with ${articles.length} articles`);
}

if (require.main === module) {
  main();
}

module.exports = { generateIndex };
