// src/templates.js
import { escapeHtml } from "./normalize.js";

export function layout({ title, description, body, url, image, jsonld, site }) {
  const canonical = url || site.baseUrl;
  const ogImage = image || `${site.baseUrl}/assets/og-default.jpg`;
  const desc = description || `${site.name} – אירועים, תפריטים וחבילות`;
  return `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(desc)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${ogImage}">
<meta name="twitter:card" content="summary_large_image">
<link rel="stylesheet" href="styles.css">
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-WYN0CWD8ZC"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-WYN0CWD8ZC');
</script>
<script src="config.js" defer></script>
<script src="analytics-config.js" defer></script>
<script src="hero-carousel.js" defer></script>
<script src="contact-form.js" defer></script>
<script src="package-modal.js" defer></script>
<script src="gallery-modal.js" defer></script>
<script src="analytics.js" defer></script>
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ""}
</head>
<body>
<header>
  <div class="header-content">
    <div class="header-left">
      <a href="#contact" class="book-btn">הזמן עכשיו</a>
    </div>
    <div class="header-center">
      <nav class="nav">
        <a href="/">בית</a>
        <a href="#about">אודותינו</a>
        <a href="#categories">סוגי אירועים</a>
        <a href="#packages">חבילות</a>
        <a href="#gallery">גלריה</a>
        <a href="#recommendations">המלצות</a>
      </nav>
    </div>
    <div class="header-right">
      <a class="brand" href="/">
        <img src="/logo.svg" alt="${escapeHtml(site.name)}" class="brand-logo">
      </a>
    </div>
  </div>
</header>
<main>${body}</main>
<footer>
  <p>© ${new Date().getFullYear()} ${escapeHtml(site.name)} - כל הזכויות שמורות</p>
</footer>
</body></html>`;
}

export function card(href, title, meta, img) {
  const pic = img ? `<div class="event-image"><img loading="lazy" src="${img}" alt="" onerror="this.classList.add('hidden'); this.nextElementSibling.classList.add('show');"><div class="image-placeholder">📷</div></div>` : "";
  return `<a class="event-card" href="${href}">${pic}<div class="event-content"><h3>${escapeHtml(title)}</h3><div class="event-date">${meta ? escapeHtml(meta) : ""}</div><div class="event-link">לפרטים נוספים →</div></div></a>`;
}
