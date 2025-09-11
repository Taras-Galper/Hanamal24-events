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
<link rel="stylesheet" href="/styles.css">
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
      <a class="brand" href="/">${escapeHtml(site.name)}</a>
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
  const pic = img ? `<div class="event-image"><img loading="lazy" src="${img}" alt="" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"><div class="placeholder" style="display:none; width:100%; height:100%; background:linear-gradient(45deg, #23232a 25%, #2a2a32 25%, #2a2a32 50%, #23232a 50%, #23232a 75%, #2a2a32 75%); background-size:20px 20px; display:flex; align-items:center; justify-content:center; color:#666;">📷</div></div>` : "";
  return `<a class="event-card" href="${href}">${pic}<div class="event-content"><h3>${escapeHtml(title)}</h3><div class="event-date">${meta ? escapeHtml(meta) : ""}</div><div class="event-link">לפרטים נוספים →</div></div></a>`;
}
