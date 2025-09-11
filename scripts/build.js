// scripts/build.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { layout, card } from "../src/templates.js";
import { slugify, iso, money, first } from "../src/normalize.js";

// Load environment variables from .env file
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE  = process.env.AIRTABLE_BASE;
const BASE_URL       = process.env.BASE_URL || "https://example.com";
const SITE_NAME      = process.env.SITE_NAME || "Hanamal 24";
const SITE_CITY      = process.env.SITE_CITY || "Haifa";
const SITE_COUNTRY   = process.env.SITE_COUNTRY || "IL";
const CUISINE        = process.env.CUISINE || "Mediterranean";

if (!AIRTABLE_TOKEN || !AIRTABLE_BASE) {
  console.error("Missing AIRTABLE_TOKEN or AIRTABLE_BASE env vars");
  process.exit(1);
}

const outDir = path.join(__dirname, "..", "dist");
const publicDir = path.join(__dirname, "..", "public");

function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }
function writeFile(p, content) { ensureDir(path.dirname(p)); fs.writeFileSync(p, content, "utf8"); }
function copyStatic() {
  ensureDir(outDir);
  // copy public assets flat into dist
  fs.cpSync(publicDir, outDir, { recursive: true });
}

async function fetchAll(table, view = "Grid view") {
  const headers = { Authorization: `Bearer ${AIRTABLE_TOKEN}` };
  const base = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(table)}`;
  let records = [];
  let offset;

  do {
    const url = new URL(base);
    url.searchParams.set("pageSize", "100");
    url.searchParams.set("view", view);
    if (offset) url.searchParams.set("offset", offset);

    const res = await fetch(url, { headers });
    if (!res.ok) {
      console.error(`Error fetching ${table}: ${res.status} ${res.statusText}`);
      if (res.status === 403) {
        console.error(`Access denied to table "${table}". Check if the table exists and your token has access.`);
      }
      return []; // Return empty array instead of throwing
    }
    const data = await res.json();
    records = records.concat(data.records || []);
    offset = data.offset;
  } while (offset);

  return records.map(r => ({ id: r.id, ...r.fields }));
}

function siteMeta() {
  return { baseUrl: BASE_URL, name: SITE_NAME, city: SITE_CITY, country: SITE_COUNTRY, cuisine: CUISINE };
}

function firstImageFrom(record) {
  const imgs = record.Image || record.Images || record.Photos || record["Event Photos"];
  const url = Array.isArray(imgs) ? first(imgs.map(x => x.url || x).filter(Boolean)) : null;
  return url || null;
}

function writeHtml(relPath, html) {
  const full = path.join(outDir, relPath.replace(/^\//, ""));
  writeFile(full, html);
}

function sitemap(urls) {
  const items = urls.map(u => `<url><loc>${u}</loc></url>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${items}</urlset>`;
}

async function build() {
  if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true, force: true });
  copyStatic();

  console.log("Fetching data from Airtable...");
  const [events, menus, packages, dishes, about] = await Promise.all([
    fetchAll("Events"),
    fetchAll("Menus"),
    fetchAll("tbl9C40JxeIkue5So"), // Correct Packages table ID
    fetchAll("Dishes"),
    fetchAll("tblvhDaSZbzlYP9bh") // Correct About table ID
  ]);

  console.log(`Found ${events.length} events, ${menus.length} menus, ${packages.length} packages, ${dishes.length} dishes, ${about.length} about records`);

  const dishMap = Object.fromEntries(dishes.map(d => [d.id, d]));
  const menuMap = Object.fromEntries(
    menus.map(m => {
      const slug = m.slug || slugify(m.Title || m.Name);
      const items = (m.Dishes || []).map(id => dishMap[id]).filter(Boolean);
      return [m.id, { ...m, slug, items }];
    })
  );
  const pkgMap = Object.fromEntries(
    packages.map(p => {
      const slug = p.slug || slugify(p["שם חבילה"] || p.Title || p.Name);
      return [p.id, { ...p, slug }];
    })
  );

  const normalizedEvents = events
    .filter(e => {
      // Show all events, or only published ones if Status field exists and is not empty
      const status = String(e.Status || "").toLowerCase();
      return status === "" || status.startsWith("publish") || status.startsWith("active") || status.startsWith("live") || status.startsWith("scheduled");
    })
    .map(e => {
      const slug = e.slug || slugify(e["Event Name"] || e["Event Name"] || e.Title || e.Name);
      const start = iso(e["Event Date"] || e.Start || e.Date);
      const end = iso(e.End || e["End Time"]) || start;
      const linkedMenus = (e.Menus || []).map(id => menuMap[id]).filter(Boolean);
      const linkedPkgs = (e.Packages || []).map(id => pkgMap[id]).filter(Boolean);
      return { ...e, slug, start, end, linkedMenus, linkedPkgs };
    });

  console.log(`After filtering: ${normalizedEvents.length} events will be included`);

  const site = siteMeta();

  // home
  {
    const heroImage = normalizedEvents.length > 0 ? firstImageFrom(normalizedEvents[0]) : null;
    const hero = `
      <section class="hero">
        <div class="hero-content">
          <div class="hero-text">
            <h1>${SITE_NAME}</h1>
            <p>חוויה קולינרית ייחודית לאירועים בלתי נשכחים</p>
            <div class="hero-buttons">
              <a href="#categories" class="hero-btn-primary">גלה את התפריט</a>
              <a href="#contact" class="hero-btn-secondary">צור קשר</a>
            </div>
          </div>
          <div class="hero-image">
            ${heroImage ? `<img src="${heroImage}" alt="מסעדת ${SITE_NAME}">` : `<div style="width:400px;height:400px;border-radius:20px;background:linear-gradient(45deg, #23232a 25%, #2a2a32 25%, #2a2a32 50%, #23232a 50%, #23232a 75%, #2a2a32 75%);background-size:20px 20px;display:flex;align-items:center;justify-content:center;color:#666;font-size:48px;">🍽️</div>`}
          </div>
        </div>
      </section>
    `;
    
    // Event categories instead of individual events
    const eventCategories = [
      { name: "יום הולדת", description: "חגיגות יום הולדת מיוחדות וזכורות" },
      { name: "אירועי חברה", description: "אירועים עסקיים וצוותי עבודה" },
      { name: "חתונה", description: "חתונות קסומות ואירועי נישואין" },
      { name: "מסיבה פרטית", description: "מסיבות פרטיות ואירועים אישיים" },
      { name: "אחר", description: "אירועים מיוחדים ומותאמים אישית" }
    ];
    
    const categoriesSection = `
      <section class="event-categories" id="categories">
        <h2>סוגי האירועים שלנו</h2>
        <div class="categories-grid">
          ${eventCategories.map(category => `
            <div class="category-card">
              <h3>${category.name}</h3>
              <p>${category.description}</p>
            </div>
          `).join("")}
        </div>
      </section>
    `;
    
    // About section - use Airtable data if available, otherwise fallback
    const aboutData = about.length > 0 ? about[0] : null;
    const aboutSection = `
      <section class="about-section" id="about" style="padding: 100px 40px; background: rgba(255,255,255,0.05); margin: 60px 0;">
        <div style="max-width: 1200px; margin: 0 auto;">
          <h2 style="font-size: 3rem; color: var(--fg); text-align: center; margin-bottom: 60px; font-weight: 700;">אודותינו</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center;">
            <div>
              <h3 style="font-size: 2rem; color: var(--gold); margin-bottom: 30px;">${aboutData?.["Section Title"] || SITE_NAME}</h3>
              <p style="font-size: 1.2rem; line-height: 1.8; color: var(--fg); margin-bottom: 20px;">
                ${aboutData?.Description || aboutData?.Content || "מסעדת הנמל 24 מציעה חוויה קולינרית ייחודית באווירה אלגנטית וחמימה. אנו מתמחים באירועים פרטיים ועסקיים, ומציעים תפריטים מותאמים אישית לכל אירוע."}
              </p>
              ${aboutData?.Additional_Info ? `<p style="font-size: 1.1rem; line-height: 1.8; color: var(--muted);">${aboutData.Additional_Info}</p>` : ""}
            </div>
            <div style="text-align: center;">
              ${aboutData?.Image ? `<img src="${aboutData.Image}" alt="אודות ${SITE_NAME}" style="width: 100%; max-width: 500px; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.3);">` : `<div style="width: 100%; height: 400px; background: linear-gradient(45deg, #23232a 25%, #2a2a32 25%, #2a2a32 50%, #23232a 50%, #23232a 75%, #2a2a32 75%); background-size: 20px 20px; border-radius: 20px; display: flex; align-items: center; justify-content: center; color: #666; font-size: 48px;">🍽️</div>`}
            </div>
          </div>
        </div>
      </section>
    `;
    
    const html = layout({
      title: SITE_NAME,
      description: `${SITE_NAME} – אירועים וחוויות קולינריות בחיפה`,
      body: `${hero}${categoriesSection}${aboutSection}`,
      url: `${BASE_URL}/`,
      jsonld: {
        "@context": "https://schema.org",
        "@type": "Restaurant",
        name: SITE_NAME,
        url: BASE_URL,
        servesCuisine: CUISINE,
        address: { "@type": "PostalAddress", addressLocality: SITE_CITY, addressCountry: SITE_COUNTRY }
      },
      site
    });
    writeHtml("/index.html", html);
  }

  // events list (now categories)
  {
    const eventCategories = [
      { name: "יום הולדת", description: "חגיגות יום הולדת מיוחדות וזכורות", icon: "🎂" },
      { name: "אירועי חברה", description: "אירועים עסקיים וצוותי עבודה", icon: "💼" },
      { name: "חתונה", description: "חתונות קסומות ואירועי נישואין", icon: "💒" },
      { name: "מסיבה פרטית", description: "מסיבות פרטיות ואירועים אישיים", icon: "🎉" },
      { name: "אחר", description: "אירועים מיוחדים ומותאמים אישית", icon: "⭐" }
    ];
    
    const categoriesSection = `
      <section class="event-categories" style="margin-top: 0; padding-top: 120px;">
        <h2>סוגי האירועים שלנו</h2>
        <div class="categories-grid">
          ${eventCategories.map(category => `
            <div class="category-card">
              <div style="font-size: 3rem; margin-bottom: 20px;">${category.icon}</div>
              <h3>${category.name}</h3>
              <p>${category.description}</p>
            </div>
          `).join("")}
        </div>
      </section>
    `;
    
    const html = layout({
      title: "סוגי אירועים",
      description: "סוגי האירועים והצעות במסעדה",
      body: categoriesSection,
      url: `${BASE_URL}/events/`,
      site
    });
    writeHtml("/events/index.html", html);
  }

  // per-event
  for (const e of normalizedEvents) {
    const heroImg = firstImageFrom(e) ? `<img src="${firstImageFrom(e)}" alt="${e["Event Name"] || e.Title || e.Name}" style="width:100%;height:400px;object-fit:cover;border-radius:20px;margin-bottom:40px;">` : "";
    const menuLinks = e.linkedMenus.map(m => `<li><a href="/menus/${m.slug}/" style="color:var(--gold);text-decoration:none;">${m.Title || m.Name}</a></li>`).join("");
    const pkgList = e.linkedPkgs.map(p => `<li style="padding:10px 0;border-bottom:1px solid rgba(212,175,55,0.2);">${p.Title || p.Name}${p.Price ? ` · ${money(p.Price)}` : ""}</li>`).join("");
    const body = `
      <section class="events-section" style="margin-top: 0; padding-top: 120px;">
        <div style="max-width:800px;margin:0 auto;">
          <h1 style="font-size:3rem;color:var(--gold);margin-bottom:20px;text-align:center;">${e["Event Name"] || e.Title || e.Name}</h1>
          <div class="event-date" style="text-align:center;margin-bottom:40px;font-size:1.2rem;">${e.start ? `תאריך: ${e.start.slice(0,10)}` : ""}</div>
          ${heroImg}
          <div style="background:var(--card);padding:40px;border-radius:20px;margin-bottom:40px;">
            ${e.Description || (typeof e["Event Summary (AI)"] === 'string' ? e["Event Summary (AI)"] : '') ? `<p style="font-size:1.1rem;line-height:1.8;color:var(--muted);margin-bottom:30px;">${e.Description || (typeof e["Event Summary (AI)"] === 'string' ? e["Event Summary (AI)"] : '')}</p>` : ""}
            ${menuLinks ? `<h2 style="color:var(--gold);margin-bottom:20px;">תפריטים</h2><ul style="list-style:none;padding:0;">${menuLinks}</ul>` : ""}
            ${pkgList ? `<h2 style="color:var(--gold);margin:30px 0 20px 0;">חבילות</h2><ul style="list-style:none;padding:0;">${pkgList}</ul>` : ""}
          </div>
        </div>
      </section>
    `;
    const html = layout({
      title: e["Event Name"] || e.Title || e.Name,
      description: e.SEO_Description || e.Description || (typeof e["Event Summary (AI)"] === 'string' ? e["Event Summary (AI)"] : '') || `${SITE_NAME} אירוע`,
      body,
      url: `${BASE_URL}/events/${e.slug}/`,
      image: firstImageFrom(e),
      jsonld: {
        "@context": "https://schema.org",
        "@type": "Event",
        name: e["Event Name"] || e.Title || e.Name,
        startDate: e.start,
        endDate: e.end || e.start,
        eventStatus: "https://schema.org/EventScheduled",
        location: {
          "@type": "Place",
          name: SITE_NAME,
          address: { "@type": "PostalAddress", addressLocality: SITE_CITY, addressCountry: SITE_COUNTRY }
        },
        image: firstImageFrom(e) ? [firstImageFrom(e)] : undefined
      },
      site
    });
    writeHtml(`/events/${e.slug}/index.html`, html);
  }

  // menus list
  {
    const list = Object.values(menuMap).map(m => card(`/menus/${m.slug}/`, m.Title || m.Name, "", firstImageFrom(m))).join("");
    const html = layout({
      title: "תפריטים",
      description: "תפריטים עונתיים וחבילות",
      body: `<h1>תפריטים</h1><section class="grid">${list}</section>`,
      url: `${BASE_URL}/menus/`,
      site
    });
    writeHtml("/menus/index.html", html);
  }

  // per-menu
  for (const m of Object.values(menuMap)) {
    const items = m.items.map(d => `<li>${d.Title || d.Name}${d.Price ? ` · ${money(d.Price)}` : ""}</li>`).join("");
    const body = `<article><h1>${m.Title || m.Name}</h1>${items ? `<ul class="list">${items}</ul>` : ""}</article>`;
    const html = layout({
      title: m.Title || m.Name,
      description: m.SEO_Description || m.Description || "תפריט",
      body,
      url: `${BASE_URL}/menus/${m.slug}/`,
      image: firstImageFrom(m),
      site
    });
    writeHtml(`/menus/${m.slug}/index.html`, html);
  }

  // packages list
  {
    const list = Object.values(pkgMap).map(p => card(`/packages/${p.slug}/`, p["שם חבילה"] || p.Title || p.Name, p["מחיר"] ? money(p["מחיר"]) : "", firstImageFrom(p))).join("");
    const html = layout({
      title: "חבילות",
      description: "חבילות לאירועים",
      body: `<h1>חבילות</h1><section class="grid">${list}</section>`,
      url: `${BASE_URL}/packages/`,
      site
    });
    writeHtml("/packages/index.html", html);
  }

  // per-package
  for (const p of Object.values(pkgMap)) {
    const body = `<article><h1>${p["שם חבילה"] || p.Title || p.Name}</h1>${p["מחיר"] ? `<p class="meta">${money(p["מחיר"])}</p>` : ""}${p["תיאור"] ? `<p>${p["תיאור"]}</p>` : ""}</article>`;
    const html = layout({
      title: p["שם חבילה"] || p.Title || p.Name,
      description: p.SEO_Description || p["תיאור"] || "חבילת אירוע",
      body,
      url: `${BASE_URL}/packages/${p.slug}/`,
      image: firstImageFrom(p),
      site
    });
    writeHtml(`/packages/${p.slug}/index.html`, html);
  }

  // robots
  writeHtml("/robots.txt", `User-agent: *\nAllow: /\nSitemap: ${BASE_URL}/sitemap.xml\n`);

  // sitemap
  const urls = [
    `${BASE_URL}/`,
    `${BASE_URL}/events/`,
    `${BASE_URL}/menus/`,
    `${BASE_URL}/packages/`,
    ...normalizedEvents.map(e => `${BASE_URL}/events/${e.slug}/`),
    ...Object.values(menuMap).map(m => `${BASE_URL}/menus/${m.slug}/`),
    ...Object.values(pkgMap).map(p => `${BASE_URL}/packages/${p.slug}/`)
  ];
  writeHtml("/sitemap.xml", sitemap(urls));

  console.log(`Build complete. Pages: ${urls.length}`);
}

await build();
