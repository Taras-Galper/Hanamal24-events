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
const BASE_URL       = process.env.BASE_URL || "https://taras-galper.github.io/Hanamal24-events";
const SITE_NAME      = process.env.SITE_NAME || "Hanamal 24";
const SITE_CITY      = process.env.SITE_CITY || "Haifa";
const SITE_COUNTRY   = process.env.SITE_COUNTRY || "IL";
const CUISINE        = process.env.CUISINE || "Mediterranean";

// Check if Airtable credentials are available
const hasAirtableCredentials = AIRTABLE_TOKEN && AIRTABLE_BASE;
if (!hasAirtableCredentials) {
  console.warn("⚠️  AIRTABLE_TOKEN or AIRTABLE_BASE not found - building with static content only");
  console.warn("   To enable Airtable integration, set these environment variables");
  console.warn("   AIRTABLE_TOKEN:", AIRTABLE_TOKEN ? "SET" : "NOT SET");
  console.warn("   AIRTABLE_BASE:", AIRTABLE_BASE ? "SET" : "NOT SET");
} else {
  console.log("✅ Airtable credentials found - building with live data");
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
  if (!hasAirtableCredentials) {
    console.log(`Skipping ${table} - no Airtable credentials available`);
    return [];
  }
  
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
  const imgs = record.Image || record.Images || record.Photos || record["Event Photos"] || record["תמונה (Image)"];
  const url = Array.isArray(imgs) ? first(imgs.map(x => x.url || x).filter(Boolean)) : null;
  return url || null;
}

function firstVideoFrom(record) {
  const videos = record.Video || record.Videos || record["סרטון (Video)"] || record["תמונה (Image)"]; // Check both video and image fields
  const url = Array.isArray(videos) ? first(videos.map(x => x.url || x).filter(Boolean)) : null;
  return url || null;
}

function isVideoUrl(url) {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
  const videoMimeTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
  
  // Check file extension
  const hasVideoExtension = videoExtensions.some(ext => url.toLowerCase().includes(ext));
  
  // Check if it's a video URL (YouTube, Vimeo, etc.)
  const isVideoPlatform = url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com');
  
  return hasVideoExtension || isVideoPlatform;
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

  if (hasAirtableCredentials) {
    console.log("Fetching data from Airtable...");
  } else {
    console.log("Using static fallback content (no Airtable credentials)");
  }
  
  const [events, menus, packages, dishes, about, hero, gallery] = await Promise.all([
    fetchAll("Events"),
    fetchAll("Menus"),
    fetchAll("tbl9C40JxeIkue5So"), // Correct Packages table ID
    fetchAll("tblbi9b9lUjRRrAhW"), // Correct Dishes table ID
    fetchAll("tblvhDaSZbzlYP9bh"), // Correct About table ID
    fetchAll("tblOe7ONKtB6A9Q6L"), // Hero table ID
    fetchAll("tblpfVJY9nEb5JDlQ") // Gallery table ID
  ]);

  console.log(`Found ${events.length} events, ${menus.length} menus, ${packages.length} packages, ${dishes.length} dishes, ${about.length} about records, ${hero.length} hero records, ${gallery.length} gallery items`);
  
  // Add fallback content if no Airtable data
  const fallbackHero = [{
    "כותרת ראשית (Main Heading)": SITE_NAME,
    "כותרת משנה (Subheading)": "חוויה קולינרית ייחודית לאירועים בלתי נשכחים",
    "פעיל (Active)": true
  }];
  
  const fallbackAbout = [{
    "כותרת (Title)": "אודות הנמל 24",
    "תוכן (Content)": "מסעדת הנמל 24 מציעה חוויה קולינרית ייחודית עם מטבח צרפתי איכותי. אנו מתמחים באירועים פרטיים, חתונות, ימי הולדת ואירועים עסקיים. הצוות המקצועי שלנו מבטיח שכל אירוע יהיה בלתי נשכח.",
    "פעיל (Active)": true
  }];
  
  const fallbackPackages = [
    {
      "שם חבילה (Package Name)": "חבילת VIP",
      "תיאור (Description)": "חבילה יוקרתית הכוללת תפריט מלא, שירות ברמה גבוהה וכל הפרטים הקטנים",
      "מחיר (Price)": "₪500-800 לאדם",
      "פעיל (Active)": true
    },
    {
      "שם חבילה (Package Name)": "חבילת סטנדרט",
      "תיאור (Description)": "חבילה איכותית עם תפריט מגוון ושירות מקצועי",
      "מחיר (Price)": "₪300-500 לאדם",
      "פעיל (Active)": true
    }
  ];
  
  const fallbackGallery = [
    {
      "תמונה (Image)": "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=600&fit=crop",
      "כותרת (Title)": "חלל המסעדה",
      "תיאור (Description)": "אווירה חמה ומזמינה",
      "פעיל (Active)": true
    },
    {
      "תמונה (Image)": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop",
      "כותרת (Title)": "מנות גורמה",
      "תיאור (Description)": "מנות איכותיות וטעימות",
      "פעיל (Active)": true
    },
    {
      "תמונה (Image)": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop",
      "כותרת (Title)": "אירועים מיוחדים",
      "תיאור (Description)": "חוויות בלתי נשכחות",
      "פעיל (Active)": true
    }
  ];
  
  // Use fallback data if no Airtable data available
  const finalHero = hero.length > 0 ? hero : fallbackHero;
  const finalAbout = about.length > 0 ? about : fallbackAbout;
  const finalPackages = packages.length > 0 ? packages : fallbackPackages;
  const finalGallery = gallery.length > 0 ? gallery : fallbackGallery;

  const dishMap = Object.fromEntries(dishes.map(d => [d.id, d]));
  const menuMap = Object.fromEntries(
    menus.map(m => {
      const slug = m.slug || slugify(m.Title || m.Name);
      const items = (m.Dishes || []).map(id => dishMap[id]).filter(Boolean);
      return [m.id, { ...m, slug, items }];
    })
  );

  // Create package-dish relationships
  const packageDishMap = {};
  
  // First, create a map of package IDs to package names
  const packageIdToName = {};
  finalPackages.forEach(pkg => {
    const packageName = pkg["שם חבילה (Package Name)"] || pkg.Title || pkg.Name;
    if (pkg.id) {
      packageIdToName[pkg.id] = packageName;
    }
  });
  
  dishes.forEach(dish => {
    const packageField = dish["חבילות (Packages)"] || dish["חבילה (Package)"] || dish["Package"] || dish["Package Assignment"];
    
    if (packageField) {
      const packageIds = Array.isArray(packageField) ? packageField : [packageField];
      packageIds.forEach(pkgId => {
        const packageName = packageIdToName[pkgId];
        if (packageName) {
          if (!packageDishMap[packageName]) {
            packageDishMap[packageName] = [];
          }
          packageDishMap[packageName].push(dish);
        }
      });
    }
  });
  const pkgMap = Object.fromEntries(
    finalPackages.map((p, index) => {
      const slug = p.slug || slugify(p["שם חבילה (Package Name)"] || p.Title || p.Name) || `package-${index + 1}`;
      return [p.id || `fallback-${index}`, { ...p, slug }];
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
    // Get all hero data from Airtable for carousel
    const activeHeroes = finalHero.filter(h => h["פעיל (Active)"] !== false);
    const heroSlides = activeHeroes.map((heroData, index) => {
      const heroImage = firstImageFrom(heroData);
      const heroVideo = firstVideoFrom(heroData);
      const heroTitle = heroData["כותרת ראשית (Main Heading)"] || SITE_NAME;
      const heroSubtitle = heroData["כותרת משנה (Subheading)"] || "חוויה קולינרית ייחודית לאירועים בלתי נשכחים";
      
      // Determine if we have a video or image
      const mediaUrl = heroVideo || heroImage;
      const isVideo = mediaUrl && isVideoUrl(mediaUrl);
      
      let mediaElement = '';
      if (isVideo) {
        if (mediaUrl.includes('youtube.com') || mediaUrl.includes('youtu.be')) {
          // YouTube video - create embed
          const videoId = mediaUrl.includes('youtu.be') 
            ? mediaUrl.split('youtu.be/')[1]?.split('?')[0]
            : mediaUrl.split('v=')[1]?.split('&')[0];
          mediaElement = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1" class="hero-bg-video" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
        } else if (mediaUrl.includes('vimeo.com')) {
          // Vimeo video - create embed
          const videoId = mediaUrl.split('vimeo.com/')[1]?.split('?')[0];
          mediaElement = `<iframe src="https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1&loop=1&controls=0&background=1" class="hero-bg-video" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
        } else {
          // Direct video file
          mediaElement = `<video class="hero-bg-video" autoplay muted loop playsinline><source src="${mediaUrl}" type="video/mp4">Your browser does not support the video tag.</video>`;
        }
      } else if (mediaUrl) {
        // Image
        mediaElement = `<img src="${mediaUrl}" alt="${heroTitle}" class="hero-bg-image">`;
      }
      
      return `
        <div class="hero-slide ${index === 0 ? 'active' : ''}" data-slide="${index}">
          <div class="hero-background">
            ${mediaElement}
            <div class="hero-overlay"></div>
          </div>
          <div class="hero-content">
            <div class="hero-text">
              <h1>${heroTitle}</h1>
              <p>${heroSubtitle}</p>
              <div class="hero-buttons">
                <a href="#categories" class="hero-btn-primary">גלה את התפריט</a>
                <a href="#contact" class="hero-btn-secondary">צור קשר</a>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    const heroSection = `
      <section class="hero-carousel">
        <div class="hero-slides">
          ${heroSlides}
        </div>
        ${activeHeroes.length > 1 ? `
          <div class="hero-navigation">
            <button class="hero-nav prev" aria-label="Previous slide">‹</button>
            <button class="hero-nav next" aria-label="Next slide">›</button>
          </div>
          <div class="hero-dots">
            ${activeHeroes.map((_, index) => `<button class="hero-dot ${index === 0 ? 'active' : ''}" data-slide="${index}" aria-label="Go to slide ${index + 1}"></button>`).join('')}
          </div>
        ` : ''}
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
    const aboutData = finalAbout.length > 0 ? finalAbout[0] : null;
    const aboutSection = `
      <section class="about-section" id="about">
        <div class="about-container">
          <h2 class="about-title">אודותינו</h2>
          <div class="about-content">
            <div class="about-text">
              <h3>${aboutData?.["Section Title"] || SITE_NAME}</h3>
              <p>
                ${aboutData?.Description || aboutData?.Content || "מסעדת הנמל 24 מציעה חוויה קולינרית ייחודית באווירה אלגנטית וחמימה. אנו מתמחים באירועים פרטיים ועסקיים, ומציעים תפריטים מותאמים אישית לכל אירוע."}
              </p>
              ${aboutData?.Additional_Info ? `<p class="additional-info">${aboutData.Additional_Info}</p>` : ""}
            </div>
            <div class="about-image">
              ${aboutData?.Image ? `<img src="${aboutData.Image}" alt="אודות ${SITE_NAME}">` : `<div class="about-placeholder">🍽️</div>`}
            </div>
          </div>
        </div>
      </section>
    `;
    
    // Gallery section
    const activeGalleryItems = finalGallery.filter(item => item["פעיל (Active)"] !== false);
    const totalImages = activeGalleryItems.length;
    const initialImages = 6;
    
    const gallerySection = `
      <section class="gallery-section" id="gallery">
        <div class="gallery-container">
          <h2 class="gallery-title">גלריית תמונות</h2>
          <div class="gallery-grid" id="gallery-grid">
            ${activeGalleryItems.slice(0, initialImages).map((item, index) => {
              const imageUrl = firstImageFrom(item);
              const title = item["כותרת (Title)"] || item.Title || item.Name || "תמונה";
              const description = item["תיאור (Description)"] || item.Description || "";
              
              return `
                <div class="gallery-item" onclick="openGalleryModal('${imageUrl}', '${title.replace(/'/g, "\\'")}', '${description.replace(/'/g, "\\'")}', ${index})">
                  <div class="gallery-image-container">
                    <img src="${imageUrl}" alt="${title}" class="gallery-image" loading="lazy" onerror="this.classList.add('hidden'); this.nextElementSibling.classList.add('show');">
                    <div class="image-placeholder">📷</div>
                  </div>
                  <div class="gallery-content">
                    <h3 class="gallery-item-title">${title}</h3>
                    ${description ? `<p class="gallery-item-description">${description}</p>` : ""}
                  </div>
                </div>
              `;
            }).join("")}
          </div>
          ${totalImages > initialImages ? `
            <div class="gallery-actions">
              <button class="gallery-view-more-btn" onclick="loadMoreGalleryImages()">
                <span class="btn-text">צפה בעוד תמונות</span>
                <span class="btn-count">(${totalImages - initialImages} נוספות)</span>
              </button>
            </div>
          ` : ""}
        </div>
      </section>
    `;
    
    // Packages section
    const packagesSection = `
      <section class="packages-section" id="packages">
        <div class="packages-container">
          <h2 class="packages-title">חבילות האירועים שלנו</h2>
          <div class="packages-grid">
            ${finalPackages.map((pkg, index) => `
              <div class="package-card" data-package-id="${pkg.id || `package-${index}`}" onclick="openPackageModal('${pkg.id || `package-${index}`}')">
                <h3 class="package-title">${pkg["שם חבילה (Package Name)"] || pkg.Title || pkg.Name || "חבילה"}</h3>
                ${pkg["מחיר (Price)"] || pkg.Price ? `<div class="package-price">${money(pkg["מחיר (Price)"] || pkg.Price)}</div>` : ""}
                ${pkg["תיאור (Description)"] || pkg.Description ? `<p class="package-description">${pkg["תיאור (Description)"] || pkg.Description}</p>` : ""}
                ${pkg["תמונה (Image)"] ? `<img src="${Array.isArray(pkg["תמונה (Image)"]) ? pkg["תמונה (Image)"][0].url : pkg["תמונה (Image)"]}" alt="${pkg["שם חבילה (Package Name)"] || pkg.Title || pkg.Name}" class="package-image">` : ""}
                <button class="package-link" onclick="event.stopPropagation(); openPackageModal('${pkg.id || `package-${index}`}')">לפרטים נוספים</button>
              </div>
            `).join("")}
          </div>
        </div>
      </section>
    `;
    
    // Contact section
    const contactSection = `
      <section id="contact" class="contact">
        <div class="container">
          <div class="contact-content">
            <div class="contact-info">
              <h2>בואו נתכנן את האירוע שלכם</h2>
              <p>הצוות המקצועי שלנו כאן לעזור לכם לתכנן את האירוע המושלם. מלאו את הטופס ונחזור אליכם בהקדם.</p>
              <div class="contact-details">
                <div class="contact-item">
                  <strong>טלפון:</strong> 04-8628899
                </div>
                <div class="contact-item">
                  <strong>אימייל:</strong> info@hanamal24.co.il
                </div>
                <div class="contact-item">
                  <strong>כתובת:</strong> רחוב חסן שוקרי 7, חיפה
                </div>
              </div>
            </div>
            <div class="contact-form-container">
              <form id="contact-form" class="contact-form">
                <div class="form-group">
                  <label for="full-name">שם מלא *</label>
                  <input type="text" id="full-name" name="fullName" required>
                </div>
                <div class="form-group">
                  <label for="email">אימייל *</label>
                  <input type="email" id="email" name="email" required>
                </div>
                <div class="form-group">
                  <label for="phone">טלפון *</label>
                  <input type="tel" id="phone" name="phone" required>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label for="event-type">סוג אירוע *</label>
                    <select id="event-type" name="eventType" required>
                      <option value="">בחר סוג אירוע</option>
                      <option value="יום הולדת">יום הולדת</option>
                      <option value="חתונה">חתונה</option>
                      <option value="אירוע פרטי">אירוע פרטי</option>
                      <option value="אחר">אחר</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="guest-count">מספר אורחים *</label>
                    <input type="number" id="guest-count" name="guestCount" min="1" required>
                  </div>
                </div>
                <div class="form-group">
                  <label for="event-date">תאריך האירוע *</label>
                  <input type="date" id="event-date" name="eventDate" required>
                </div>
                <div class="form-group">
                  <label for="message">הודעה נוספת</label>
                  <textarea id="message" name="message" rows="4"></textarea>
                </div>
                <button type="submit" class="submit-btn">שלח בקשה</button>
              </form>
            </div>
          </div>
        </div>
      </section>
    `;
    
    // Package modal HTML
    const packageModal = `
      <div id="package-modal" class="package-modal" style="display: none;">
        <div class="package-modal-overlay" onclick="closePackageModal()"></div>
        <div class="package-modal-content">
          <button class="package-modal-close" onclick="closePackageModal()">&times;</button>
          <div class="package-modal-header">
            <h2 id="modal-package-title"></h2>
            <div id="modal-package-price" class="modal-package-price"></div>
          </div>
          <div class="package-modal-body">
            <div class="package-modal-section">
              <h3>תיאור החבילה</h3>
              <p id="modal-package-description"></p>
            </div>
            <div class="package-modal-section">
              <h3>יתרונות החבילה</h3>
              <ul id="modal-package-benefits"></ul>
            </div>
            <div class="package-modal-section">
              <h3>תפריט החבילה</h3>
              <div id="modal-package-menu" class="package-menu-grid"></div>
            </div>
          </div>
          <div class="package-modal-footer">
            <button class="package-modal-cta" onclick="scrollToContact()">הזמן עכשיו</button>
          </div>
        </div>
      </div>
    `;
    
    // Gallery modal HTML
    const galleryModal = `
      <div id="gallery-modal" class="gallery-modal" style="display: none;">
        <div class="gallery-modal-content">
          <button class="gallery-modal-close" onclick="closeGalleryModal()">&times;</button>
          
          <!-- Navigation Controls -->
          <button class="gallery-nav gallery-nav-prev" onclick="previousGalleryImage()" id="gallery-prev-btn">
            <span>&#8249;</span>
          </button>
          <button class="gallery-nav gallery-nav-next" onclick="nextGalleryImage()" id="gallery-next-btn">
            <span>&#8250;</span>
          </button>
          
          <!-- Main Image -->
          <div class="gallery-modal-image-container">
            <img id="gallery-modal-image" class="gallery-modal-image" src="" alt="">
            <div class="gallery-image-counter">
              <span id="gallery-current-index">1</span> / <span id="gallery-total-count">1</span>
            </div>
          </div>
          
          <!-- Image Info -->
          <div class="gallery-modal-info">
            <h3 id="gallery-modal-title" class="gallery-modal-title"></h3>
            <p id="gallery-modal-description" class="gallery-modal-description"></p>
          </div>
          
          <!-- Thumbnail Navigation -->
          <div class="gallery-thumbnails" id="gallery-thumbnails">
            <!-- Thumbnails will be populated by JavaScript -->
          </div>
        </div>
      </div>
    `;

    const html = layout({
      title: SITE_NAME,
      description: `${SITE_NAME} – אירועים וחוויות קולינריות בחיפה`,
      body: `${heroSection}${categoriesSection}${aboutSection}${gallerySection}${packagesSection}${contactSection}${packageModal}${galleryModal}`,
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
      // Add package and dish data for JavaScript
      const packageDataScript = `
        <script>
          window.PACKAGE_DATA = ${JSON.stringify(finalPackages)};
          window.DISH_DATA = ${JSON.stringify(dishes)};
          window.PACKAGE_DISH_MAP = ${JSON.stringify(packageDishMap)};
          window.GALLERY_DATA = ${JSON.stringify(activeGalleryItems)};
        </script>
      `;
    
    const htmlWithData = html.replace('</body>', `${packageDataScript}</body>`);
    writeHtml("/index.html", htmlWithData);
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
      <section class="event-categories event-categories-top">
        <h2>סוגי האירועים שלנו</h2>
        <div class="categories-grid">
          ${eventCategories.map(category => `
            <div class="category-card">
              <div class="category-icon">${category.icon}</div>
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
    const heroImg = firstImageFrom(e) ? `<img src="${firstImageFrom(e)}" alt="${e["Event Name"] || e.Title || e.Name}" class="hero-img">` : "";
    const menuLinks = e.linkedMenus.map(m => `<li class="event-link-item"><a href="/menus/${m.slug}/">${m.Title || m.Name}</a></li>`).join("");
    const pkgList = e.linkedPkgs.map(p => `<li class="event-link-item">${p.Title || p.Name}${p.Price ? ` · ${money(p.Price)}` : ""}</li>`).join("");
    const body = `
      <section class="events-section">
        <div class="event-container">
          <h1 class="event-title">${e["Event Name"] || e.Title || e.Name}</h1>
          <div class="event-date">${e.start ? `תאריך: ${e.start.slice(0,10)}` : ""}</div>
          ${heroImg}
          <div class="event-content">
            ${e.Description || (typeof e["Event Summary (AI)"] === 'string' ? e["Event Summary (AI)"] : '') ? `<p class="event-description">${e.Description || (typeof e["Event Summary (AI)"] === 'string' ? e["Event Summary (AI)"] : '')}</p>` : ""}
            ${menuLinks ? `<h2 class="event-section-title">תפריטים</h2><ul class="event-links">${menuLinks}</ul>` : ""}
            ${pkgList ? `<h2 class="event-section-title packages">חבילות</h2><ul class="event-links">${pkgList}</ul>` : ""}
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
    const list = Object.values(pkgMap).map(p => card(`/packages/${p.slug}/`, p["שם חבילה (Package Name)"] || p.Title || p.Name, p["מחיר (Price)"] ? money(p["מחיר (Price)"]) : "", firstImageFrom(p))).join("");
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
    const packageImage = p["תמונה (Image)"] ? (Array.isArray(p["תמונה (Image)"]) ? p["תמונה (Image)"][0].url : p["תמונה (Image)"]) : null;
    const body = `
      <article>
        <h1>${p["שם חבילה (Package Name)"] || p.Title || p.Name}</h1>
        ${p["מחיר (Price)"] ? `<p class="package-detail-price">${money(p["מחיר (Price)"])}</p>` : ""}
        ${packageImage ? `<img src="${packageImage}" alt="${p["שם חבילה (Package Name)"] || p.Title || p.Name}" class="package-detail-image">` : ""}
        ${p["תיאור (Description)"] ? `<p class="package-detail-description">${p["תיאור (Description)"]}</p>` : ""}
      </article>
    `;
    const html = layout({
      title: p["שם חבילה (Package Name)"] || p.Title || p.Name || "חבילת אירוע",
      description: p.SEO_Description || p["תיאור (Description)"] || "חבילת אירוע",
      body,
      url: `${BASE_URL}/packages/${p.slug}/`,
      image: packageImage,
      site
    });
    writeHtml(`/packages/${p.slug}/index.html`, html);
  }

  // admin page for viewing leads
  {
    const adminHtml = layout({
      title: `Admin - ${SITE_NAME}`,
      description: "Admin panel for viewing leads",
      body: `
        <section class="admin-section">
          <div class="container">
            <h1>Admin Panel - Leads Management</h1>
            <div class="admin-actions">
              <button onclick="exportLeads()" class="admin-btn">Export Leads</button>
              <button onclick="clearLeads()" class="admin-btn danger">Clear All Leads</button>
            </div>
            <div id="leads-display" class="leads-display">
              <p>Loading leads...</p>
            </div>
          </div>
        </section>
        <style>
          .admin-section { padding: 40px 0; }
          .admin-actions { margin: 20px 0; }
          .admin-btn { 
            background: var(--accent); 
            color: var(--bg-dark); 
            border: none; 
            padding: 10px 20px; 
            margin: 5px; 
            border-radius: 5px; 
            cursor: pointer; 
          }
          .admin-btn.danger { background: #ef4444; }
          .leads-display { margin-top: 20px; }
          .lead-item { 
            background: var(--card); 
            padding: 15px; 
            margin: 10px 0; 
            border-radius: 8px; 
            border: 1px solid var(--border);
          }
        </style>
        <script>
          function loadLeads() {
            const leads = JSON.parse(localStorage.getItem('hanamal24_leads') || '[]');
            const display = document.getElementById('leads-display');
            
            if (leads.length === 0) {
              display.innerHTML = '<p>No leads found.</p>';
              return;
            }
            
            display.innerHTML = leads.map(lead => \`
              <div class="lead-item">
                <h3>\${lead.fullName}</h3>
                <p><strong>Email:</strong> \${lead.email}</p>
                <p><strong>Phone:</strong> \${lead.phone}</p>
                <p><strong>Event Type:</strong> \${lead.eventType}</p>
                <p><strong>Guest Count:</strong> \${lead.guestCount}</p>
                <p><strong>Event Date:</strong> \${lead.eventDate}</p>
                <p><strong>Message:</strong> \${lead.message || 'None'}</p>
                <p><strong>Created:</strong> \${new Date(lead.createdAt).toLocaleString('he-IL')}</p>
              </div>
            \`).join('');
          }
          
          function clearLeads() {
            if (confirm('Are you sure you want to clear all leads?')) {
              localStorage.removeItem('hanamal24_leads');
              loadLeads();
            }
          }
          
          // Load leads on page load
          document.addEventListener('DOMContentLoaded', loadLeads);
        </script>
      `,
      url: `${BASE_URL}/admin/`,
      site
    });
    writeHtml("/admin/index.html", adminHtml);
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

