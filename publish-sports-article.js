#!/usr/bin/env node

/**
 * Publish a sports article to jasondspooner.github.io
 *
 * Usage:
 *   node publish-sports-article.js --title "Title" --markdown /path/to/article.md \
 *     [--description "desc"] [--image /path/to/featured.jpg] [--date "June 12, 2026"]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO_DIR = __dirname;
const BLOG_DIR = path.join(REPO_DIR, 'blog');
const ARTICLES_DIR = path.join(BLOG_DIR, 'articles');
const IMAGES_DIR = path.join(BLOG_DIR, 'images');
const GENERATOR = path.join(REPO_DIR, 'generate-article.js');
const INDEXER = path.join(REPO_DIR, 'generate-blog-index.js');
const SPORT_INDEXER = path.join(REPO_DIR, 'generate-sport-index.js');
const DEPLOYER = path.join(REPO_DIR, 'deploy.sh');

function parseArgs(argv) {
  const args = argv.slice(2);
  const get = (flag) => {
    const idx = args.indexOf(flag);
    return idx >= 0 ? args[idx + 1] : undefined;
  };
  const getTags = () => {
    const raw = get('--tags');
    if (!raw) return [];
    return raw.split(',').map(t => t.trim()).filter(Boolean);
  };
  return {
    title: get('--title'),
    markdownPath: get('--markdown'),
    imagePath: get('--image'),
    description: get('--description'),
    date: get('--date'),
    sport: get('--sport'),
    tags: getTags(),
    dryRun: args.includes('--dry-run'),
    help: args.includes('--help') || args.includes('-h'),
  };
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function inlineMarkdownToHtml(text) {
  let md = escapeHtml(text);
  md = md.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  md = md.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  md = md.replace(/\*(.+?)\*/g, '<em>$1</em>');
  md = md.replace(/__(.+?)__/g, '<strong>$1</strong>');
  md = md.replace(/_(.+?)_/g, '<em>$1</em>');
  md = md.replace(/`([^`]+)`/g, '<code>$1</code>');
  return md;
}

function markdownToHtml(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const blocks = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === '') {
      blocks.push({ type: 'blank' });
      continue;
    }

    // Code block
    if (trimmed.startsWith('```')) {
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: 'code', content: escapeHtml(codeLines.join('\n')) });
      continue;
    }

    // Heading
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      blocks.push({ type: `h${level}`, content: inlineMarkdownToHtml(headingMatch[2]) });
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push({ type: 'hr' });
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      const quoteLines = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      i--;
      blocks.push({ type: 'blockquote', content: inlineMarkdownToHtml(quoteLines.join(' ')) });
      continue;
    }

    // Unordered list
    if (/^[-*]\s+/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ''));
        i++;
      }
      i--;
      blocks.push({
        type: 'ul',
        items: items.map(item => inlineMarkdownToHtml(item)),
      });
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
        i++;
      }
      i--;
      blocks.push({
        type: 'ol',
        items: items.map(item => inlineMarkdownToHtml(item)),
      });
      continue;
    }

    // Paragraph (absorb consecutive non-blank lines)
    const paraLines = [];
    while (i < lines.length && lines[i].trim() !== '') {
      paraLines.push(lines[i]);
      i++;
    }
    i--;
    blocks.push({
      type: 'p',
      content: inlineMarkdownToHtml(paraLines.join('<br />')),
    });
  }

  // Render blocks, collapsing blanks into paragraph separators
  const htmlBlocks = [];
  for (const block of blocks) {
    switch (block.type) {
      case 'blank':
        break;
      case 'p':
        htmlBlocks.push(`<p>${block.content}</p>`);
        break;
      case 'blockquote':
        htmlBlocks.push(`<blockquote>${block.content}</blockquote>`);
        break;
      case 'code':
        htmlBlocks.push(`<pre><code>${block.content}</code></pre>`);
        break;
      case 'hr':
        htmlBlocks.push('<hr />');
        break;
      case 'ul':
        htmlBlocks.push(`<ul>${block.items.map(item => `<li>${item}</li>`).join('')}</ul>`);
        break;
      case 'ol':
        htmlBlocks.push(`<ol>${block.items.map(item => `<li>${item}</li>`).join('')}</ol>`);
        break;
      default:
        if (block.type.startsWith('h')) {
          htmlBlocks.push(`<${block.type}>${block.content}</${block.type}>`);
        }
    }
  }

  return htmlBlocks.join('\n\n');
}

function main() {
  const args = parseArgs(process.argv);

  if (args.help) {
    console.log(`
Publish Sports Article

Usage:
  node publish-sports-article.js --title "Title" --markdown /path/to/article.md
    [--description "desc"] [--image /path/to/featured.jpg] [--date "June 12, 2026"]
`);
    process.exit(0);
  }

  if (!args.title || !args.markdownPath) {
    console.error('Error: --title and --markdown are required');
    process.exit(1);
  }

  if (!fs.existsSync(args.markdownPath)) {
    console.error(`Error: markdown file not found: ${args.markdownPath}`);
    process.exit(1);
  }

  const slug = slugify(args.title);
  const date = args.date || formatDate(new Date());
  const description = args.description || args.title;

  let markdown = fs.readFileSync(args.markdownPath, 'utf8');
  // Remove a leading H1 if it matches the title to avoid duplication in the body
  const leadingH1 = new RegExp(`^#\\s*${args.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\n+`, 'i');
  markdown = markdown.replace(leadingH1, '');

  let htmlContent = markdownToHtml(markdown);

  // Handle featured image
  if (args.imagePath && fs.existsSync(args.imagePath)) {
    const imageDir = path.join(IMAGES_DIR, slug);
    fs.mkdirSync(imageDir, { recursive: true });
    const ext = path.extname(args.imagePath) || '.jpg';
    const destImage = path.join(imageDir, `featured${ext}`);
    fs.copyFileSync(args.imagePath, destImage);
    const webPath = `../images/${slug}/featured${ext}`;
    htmlContent = `<figure><img src="${webPath}" alt="${escapeHtml(args.title)}" style="max-width:100%;height:auto;" /></figure>\n\n${htmlContent}`;
  }

  // Build JSON payload for the existing generator
  const tags = Array.from(new Set(
    [args.sport, ...(args.tags || [])].filter(Boolean)
  ));
  const payload = {
    title: args.title,
    content: htmlContent,
    slug,
    description,
    date,
    tags,
  };

  const payloadPath = path.join('/tmp', `publish-sports-article-${slug}.json`);
  fs.writeFileSync(payloadPath, JSON.stringify(payload, null, 2));

  try {
    console.log(`Generating article HTML for "${args.title}"...`);
    if (!args.dryRun) {
      execSync(`node "${GENERATOR}" --from-json "${payloadPath}"`, { cwd: REPO_DIR, stdio: 'inherit' });
    } else {
      console.log(`[dry-run] Would run: node "${GENERATOR}" --from-json "${payloadPath}"`);
    }

    console.log('Regenerating blog index...');
    if (!args.dryRun) {
      execSync(`node "${INDEXER}"`, { cwd: REPO_DIR, stdio: 'inherit' });
    } else {
      console.log(`[dry-run] Would run: node "${INDEXER}"`);
    }

    console.log('Regenerating sport index pages...');
    if (!args.dryRun) {
      execSync(`node "${SPORT_INDEXER}"`, { cwd: REPO_DIR, stdio: 'inherit' });
    } else {
      console.log(`[dry-run] Would run: node "${SPORT_INDEXER}"`);
    }

    console.log('Deploying to GitHub Pages...');
    if (!args.dryRun) {
      execSync(`"${DEPLOYER}"`, { cwd: REPO_DIR, stdio: 'inherit' });
    } else {
      console.log(`[dry-run] Would run: "${DEPLOYER}"`);
    }

    console.log(`✓ Published ${slug}.html`);
  } catch (err) {
    console.error('Publishing failed:', err.message);
    process.exit(1);
  } finally {
    try { fs.unlinkSync(payloadPath); } catch {}
  }
}

if (require.main === module) {
  main();
}

module.exports = { markdownToHtml, slugify, formatDate };
