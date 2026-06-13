> **Agent instructions for the jasondspooner.github.io website project.**

# jasondspooner.github.io — Agent Guide

## What this project is

A public static site hosted on GitHub Pages for Jason Spooner.

- **Project root:** `/home/theone/Projects/jasondspooner.github.io`
- **Live site:** `https://jasondspooner.github.io`
- **Repo:** `https://github.com/jasondspooner/jasondspooner.github.io.git`
- **Deployment:** GitHub Pages auto-deploys on every push to `main`.

## Sections

| Path | Purpose |
|---|---|
| `index.html` | Main landing page |
| `bluejays.html` | Blue Jays Hub — daily previews, odds, and updates |
| `mlb.html`, `cfl.html`, `fifa.html` | Sport index pages generated from `sports/` data |
| `blog/` | Blog articles and `articles.json` index |
| `sports/` | Generated sports data and article metadata |
| `fred-tools-guide.html` | Tools/services guide page |
| `assets/`, `css/`, `js/`, `images/` | Static assets |

## Your job

When assigned an issue for this site, you:

1. Work in `/home/theone/Projects/jasondspooner.github.io`.
2. Edit the relevant HTML, JS, or data files.
3. Run any local generators if needed (see below).
4. Commit and push to `main`.
5. Verify the live site reflects the change.
6. Update the Paperclip issue with a summary and move it to `in_review`.

## Key scripts

| Script | Purpose |
|---|---|
| `generate-article.js` | Generates a blog article and updates `blog/articles.json` without duplicates |
| `generate-blog-index.js` | Rebuilds the blog index from `blog/articles.json` |
| `generate-bluejays-page.js` | Rebuilds `bluejays.html` from data in `sports/` |
| `generate-sport-index.js` | Rebuilds sport index pages (`mlb.html`, `cfl.html`, `fifa.html`) |
| `publish-sports-article.js` | Publishes a sports article to the site and updates indexes |
| `remove-article.js` | Removes an article from `blog/articles.json` and the filesystem |
| `deploy.sh` | Simple deploy helper (push to `main`) |
| `daily-article.sh` | Daily article generation wrapper |

## Blue Jays Hub workflow

1. Odds and data are collected early (currently 06:00 AM MT).
2. `generate-bluejays-page.js` rebuilds `bluejays.html` with the latest preview and odds.
3. MLB Writer instructions (in Paperclip) require citing **run line** and **total** only — no moneyline/proline.
4. Push the updated `bluejays.html` and any new `sports/` files.
5. Verify at `https://jasondspooner.github.io/bluejays.html`.

## Content rules

- **No duplicate index entries.** `generate-article.js` filters existing slugs before prepending a new entry. If you manually edit `blog/articles.json`, ensure the same slug appears only once.
- **No FlowPace references.** FlowPace has been removed from the site (JAS-71). Do not re-add it.
- **Sports odds:** cite only the data sources configured in the generation scripts. For MLB, use run line and total per the agent instructions.

## Git workflow

Always run from `/home/theone/Projects/jasondspooner.github.io`:

```bash
git pull origin main
git add ...
git commit -m "site: <description>"
git push origin main
```

Use the existing git config. Do not force push.

## Working with Paperclip

This site is managed through the local Paperclip instance. The Web Agent for this site should be assigned to this workspace (`/home/theone/Projects/jasondspooner.github.io`).

Useful IDs (see root `AGENTS.md` for API details):

- **Jason Spooner Corp company:** `0f68a707-dffa-41c7-9380-12eec0159181`
- **Website project:** assign the Web Agent to this workspace path
- **API base:** `http://10.0.0.100:3100`

## What NOT to do

- Do not delete the `config.json` file or expose its contents.
- Do not force push.
- Do not add moneyline/proline betting lines to MLB content unless explicitly asked.
- Do not re-add FlowPace references.
- Do not commit secrets or API keys.

## Need help?

If an issue is unclear, ask for clarification in a comment before making large changes.
