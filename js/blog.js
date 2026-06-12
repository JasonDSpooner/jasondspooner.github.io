// Blog index loader - fetches articles.json and renders the article list
document.addEventListener('DOMContentLoaded', async () => {
  const list = document.getElementById('article-list');
  if (!list) return;

  try {
    const resp = await fetch('/blog/articles.json');
    if (!resp.ok) return;
    const articles = await resp.json();
    
    if (!articles.length) return;
    
    list.innerHTML = articles.map(a => `
      <li>
        <span class="blog-date">${a.date}</span>
        <h3><a href="articles/${a.slug}.html">${a.title}</a></h3>
        <p class="blog-excerpt">${a.excerpt}</p>
      </li>
    `).join('');
  } catch (e) {
    // articles.json not found or invalid, keep static content
  }
});
