// scripts/build.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { layout, card } from "../src/templates.js";
import { slugify, iso, money, first } from "../src/normalize.js";
// Image processing imports removed - images no longer pulled from Airtable

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
const dataDir = path.join(__dirname, "..", "data");

function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }
function writeFile(p, content) { ensureDir(path.dirname(p)); fs.writeFileSync(p, content, "utf8"); }
function copyStatic() {
  ensureDir(outDir);
  // copy public assets flat into dist
  fs.cpSync(publicDir, outDir, { recursive: true });
}

// Load data from local JSON files (NO API CALLS)
function loadJsonData(filename) {
  try {
    const dataPath = path.join(dataDir, filename);
    if (fs.existsSync(dataPath)) {
      const data = fs.readFileSync(dataPath, 'utf8');
      const parsed = JSON.parse(data);
      console.log(`✅ Loaded ${filename}: ${Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length} items`);
      return parsed;
    } else {
      console.log(`⚠️  ${filename} not found`);
    }
  } catch (error) {
    console.error(`❌ Error loading ${filename}:`, error.message);
  }
  return null;
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

function firstImageFrom(record, cloudinaryImageMap = null, localImageMap = null) {
  // Extract image from record
  const imageFields = [
    "תמונה (Image)", "Image", "תמונה", "Picture", "Photo", 
    "תמונה של המנה", "Event Photos"
  ];
  
  for (const field of imageFields) {
    if (record[field]) {
      let imageUrl = null;
      
      if (Array.isArray(record[field])) {
        imageUrl = record[field][0]?.url || record[field][0];
      } else if (typeof record[field] === 'string') {
        imageUrl = record[field];
      } else if (record[field]?.url) {
        imageUrl = record[field].url;
      }
      
      if (imageUrl && typeof imageUrl === 'string') {
        // Priority 1: If it's already a local path (from downloaded images), use it directly
        if (imageUrl.startsWith('/images/')) {
          return imageUrl;
        }
        
        // Priority 2: Use Cloudinary URL if available (for optimization)
        if (cloudinaryImageMap && cloudinaryImageMap.has(imageUrl)) {
          return cloudinaryImageMap.get(imageUrl);
        }
        
        // Priority 3: Use local image map if available
        if (localImageMap && localImageMap.has(imageUrl)) {
          const localPath = localImageMap.get(imageUrl);
          return typeof localPath === 'string' ? localPath : localPath.localPath || imageUrl;
        }
        
        // Priority 4: Return original URL (may be expired Airtable URL - not ideal)
        // This should rarely happen if sync worked correctly
        if (imageUrl.startsWith('http')) {
          console.warn(`⚠️ Using Airtable URL (may expire): ${imageUrl.substring(0, 50)}...`);
        }
        return imageUrl;
      }
    }
  }
  
  // No image found - return null (don't use placeholder)
  return null;
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

  console.log("📂 Loading data from cached JSON files (no API calls)...");
  
  // Use cached JSON files by default to avoid unnecessary API calls
  // Only fetch from Airtable when explicitly triggered via webhook/button
  // This saves API credits and makes builds faster
  let events, menus, packages, dishes, about, hero, gallery;
  
  // Check if we should force fresh fetch (set via environment variable)
  const FORCE_FRESH_FETCH = process.env.FORCE_FRESH_FETCH === 'true' || process.env.FORCE_FRESH_FETCH === '1';
  
  if (FORCE_FRESH_FETCH && hasAirtableCredentials) {
    console.log("🔄 FORCE_FRESH_FETCH enabled - fetching fresh data from Airtable API...");
    [events, menus, packages, dishes, about, hero, gallery] = await Promise.all([
      fetchAll("Events"),
      fetchAll("Menus").catch(err => {
        console.warn("⚠️  Could not fetch Menus table - using fallback content");
        return [];
      }),
      fetchAll("tbl9C40JxeIkue5So"), // Correct Packages table ID
      fetchAll("tblbi9b9lUjRRrAhW"), // Correct Dishes table ID
      fetchAll("tblvhDaSZbzlYP9bh"), // Correct About table ID
      fetchAll("tblOe7ONKtB6A9Q6L"), // Hero table ID
      fetchAll("tblpfVJY9nEb5JDlQ") // Gallery table ID
    ]);
    console.log("✅ Successfully fetched fresh data from Airtable");
    
    // Download images IMMEDIATELY while URLs are fresh
    console.log("📸 Downloading images immediately (while URLs are fresh)...");
    try {
      const { downloadAirtableImages } = await import('./airtable-image-downloader.js');
      const rawData = { events, menus, packages, dishes, gallery, hero, about };
      const { data: processedData } = await downloadAirtableImages(rawData);
      
      // Use processed data with local image paths
      events = processedData.events || events;
      menus = processedData.menus || menus;
      packages = processedData.packages || packages;
      dishes = processedData.dishes || dishes;
      gallery = processedData.gallery || gallery;
      hero = processedData.hero || hero;
      about = processedData.about || about;
      
      console.log("✅ Images downloaded and data updated with local paths");
    } catch (error) {
      console.warn("⚠️ Image download failed, using original URLs:", error.message);
    }
  } else {
    // Load from cached JSON files (preferred method)
    console.log("📁 Loading from cached JSON files in data/ folder...");
    events = loadJsonData("events.json");
    menus = loadJsonData("menus.json");
    packages = loadJsonData("packages.json");
    dishes = loadJsonData("dishes.json");
    about = loadJsonData("about.json");
    hero = loadJsonData("hero.json");
    gallery = loadJsonData("gallery.json");
    
    // Check if cached data has Airtable URLs that need to be downloaded
    const hasAirtableUrls = (records) => {
      if (!records || records.length === 0) return false;
      for (const record of records) {
        const imageFields = ["תמונה (Image)", "Image", "תמונה", "Picture", "Photo", "תמונה של המנה", "Event Photos"];
        for (const field of imageFields) {
          if (record[field]) {
            const images = Array.isArray(record[field]) ? record[field] : [record[field]];
            for (const img of images) {
              const url = img?.url || img;
              if (url && typeof url === 'string' && url.startsWith('http') && !url.startsWith('/images/')) {
                return true; // Found Airtable URL
              }
            }
          }
        }
      }
      return false;
    };
    
    const needsImageDownload = hasAirtableUrls(events) || hasAirtableUrls(packages) || 
                               hasAirtableUrls(dishes) || hasAirtableUrls(gallery) || 
                               hasAirtableUrls(hero) || hasAirtableUrls(about) || hasAirtableUrls(menus);
    
    // If cached data has Airtable URLs, fetch fresh data and download images immediately
    // This ensures we get fresh URLs before they expire
    // Note: If sync was just run (workflow_dispatch), images may already be downloaded
    // but we still need to fetch fresh data to get updated content
    if (needsImageDownload && hasAirtableCredentials) {
      console.log("📸 Cached data contains Airtable URLs - fetching fresh data and downloading images...");
      try {
        // Fetch fresh data from Airtable to get fresh URLs
        console.log("🔄 Fetching fresh data from Airtable...");
        [events, menus, packages, dishes, about, hero, gallery] = await Promise.all([
          fetchAll("Events"),
          fetchAll("Menus").catch(err => {
            console.warn("⚠️  Could not fetch Menus table - using cached data");
            return menus || [];
          }),
          fetchAll("tbl9C40JxeIkue5So"),
          fetchAll("tblbi9b9lUjRRrAhW"),
          fetchAll("tblvhDaSZbzlYP9bh"),
          fetchAll("tblOe7ONKtB6A9Q6L"),
          fetchAll("tblpfVJY9nEb5JDlQ")
        ]);
        console.log("✅ Fetched fresh data from Airtable");
        
        // Download images IMMEDIATELY while URLs are fresh
        console.log("📸 Downloading images immediately (while URLs are fresh)...");
        const { downloadAirtableImages } = await import('./airtable-image-downloader.js');
        const rawData = { events, menus, packages, dishes, gallery, hero, about };
        const { data: processedData } = await downloadAirtableImages(rawData);
        
        // Use processed data with local image paths
        events = processedData.events || events;
        menus = processedData.menus || menus;
        packages = processedData.packages || packages;
        dishes = processedData.dishes || dishes;
        gallery = processedData.gallery || gallery;
        hero = processedData.hero || hero;
        about = processedData.about || about;
        
        console.log("✅ Images downloaded and data updated with local paths");
        
        // Save updated data back to JSON files for next time (if data directory exists)
        try {
          const dataDir = path.join(__dirname, "..", "data");
          if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
          }
          if (events) fs.writeFileSync(path.join(dataDir, "events.json"), JSON.stringify(events, null, 2));
          if (menus) fs.writeFileSync(path.join(dataDir, "menus.json"), JSON.stringify(menus, null, 2));
          if (packages) fs.writeFileSync(path.join(dataDir, "packages.json"), JSON.stringify(packages, null, 2));
          if (dishes) fs.writeFileSync(path.join(dataDir, "dishes.json"), JSON.stringify(dishes, null, 2));
          if (gallery) fs.writeFileSync(path.join(dataDir, "gallery.json"), JSON.stringify(gallery, null, 2));
          if (hero) fs.writeFileSync(path.join(dataDir, "hero.json"), JSON.stringify(hero, null, 2));
          if (about) fs.writeFileSync(path.join(dataDir, "about.json"), JSON.stringify(about, null, 2));
          console.log("💾 Updated JSON files with local image paths");
        } catch (saveError) {
          console.warn("⚠️ Could not save updated JSON files (non-critical):", saveError.message);
          // Continue with build - this is not critical
        }
      } catch (error) {
        console.warn("⚠️ Failed to fetch fresh data/download images, using cached data:", error.message);
        // Continue with cached data if fetch fails
      }
    }
    
    // If JSON files don't exist and we have Airtable credentials, fetch once as fallback
    const hasAnyJsonData = events !== null || menus !== null || packages !== null || 
                          dishes !== null || about !== null || hero !== null || gallery !== null;
    
    if (!hasAnyJsonData && hasAirtableCredentials) {
      console.log("⚠️  No cached JSON files found - fetching from Airtable (one-time setup)...");
      [events, menus, packages, dishes, about, hero, gallery] = await Promise.all([
        fetchAll("Events"),
        fetchAll("Menus").catch(err => {
          console.warn("⚠️  Could not fetch Menus table - using fallback content");
          return [];
        }),
        fetchAll("tbl9C40JxeIkue5So"),
        fetchAll("tblbi9b9lUjRRrAhW"),
        fetchAll("tblvhDaSZbzlYP9bh"),
        fetchAll("tblOe7ONKtB6A9Q6L"),
        fetchAll("tblpfVJY9nEb5JDlQ")
      ]);
      console.log("✅ Fetched initial data from Airtable");
      
      // Download images IMMEDIATELY while URLs are fresh
      console.log("📸 Downloading images immediately (while URLs are fresh)...");
      try {
        const { downloadAirtableImages } = await import('./airtable-image-downloader.js');
        const rawData = { events, menus, packages, dishes, gallery, hero, about };
        const { data: processedData } = await downloadAirtableImages(rawData);
        
        // Use processed data with local image paths
        events = processedData.events || events;
        menus = processedData.menus || menus;
        packages = processedData.packages || packages;
        dishes = processedData.dishes || dishes;
        gallery = processedData.gallery || gallery;
        hero = processedData.hero || hero;
        about = processedData.about || about;
        
        console.log("✅ Images downloaded and data updated with local paths");
      } catch (error) {
        console.warn("⚠️ Image download failed, using original URLs:", error.message);
      }
    } else if (!hasAnyJsonData) {
      console.log("⚠️  No cached data and no Airtable credentials - using fallback content");
    }
    
    // Use empty arrays if data is null
    events = events || [];
    menus = menus || [];
    packages = packages || [];
    dishes = dishes || [];
    about = about || [];
    hero = hero || [];
    gallery = gallery || [];
  }

  console.log(`Found ${events?.length || 0} events, ${menus?.length || 0} menus, ${packages?.length || 0} packages, ${dishes?.length || 0} dishes, ${about?.length || 0} about records, ${hero?.length || 0} hero records, ${gallery?.length || 0} gallery items`);
  
  // Debug: Show actual field names from Airtable data
  if (about && about.length > 0) {
    console.log("📋 About fields:", Object.keys(about[0]).join(", "));
  }
  if (hero && hero.length > 0) {
    console.log("📋 Hero fields:", Object.keys(hero[0]).join(", "));
  }
  if (packages && packages.length > 0) {
    console.log("📋 Package fields:", Object.keys(packages[0]).join(", "));
  }
  
  // Process images - prioritize local images from downloaded data
  // Images should already be downloaded and have local paths in the data
  let cloudinaryImageMap = new Map();
  let imageMap = new Map();
  
  // Count local vs remote images
  let localImageCount = 0;
  let remoteImageCount = 0;
  
  const checkImageSource = (records) => {
    records?.forEach(record => {
      const imageFields = ["תמונה (Image)", "Image", "תמונה", "Picture", "Photo", "תמונה של המנה", "Event Photos"];
      for (const field of imageFields) {
        if (record[field]) {
          const images = Array.isArray(record[field]) ? record[field] : [record[field]];
          images.forEach(img => {
            const url = img?.url || img;
            if (url && typeof url === 'string') {
              if (url.startsWith('/images/')) {
                localImageCount++;
              } else if (url.startsWith('http')) {
                remoteImageCount++;
              }
            }
          });
        }
      }
    });
  };
  
  checkImageSource(events);
  checkImageSource(packages);
  checkImageSource(dishes);
  checkImageSource(gallery);
  checkImageSource(hero);
  checkImageSource(about);
  checkImageSource(menus);
  
  console.log(`📸 Images: ${localImageCount} local, ${remoteImageCount} remote URLs`);
  
  // Optional: Try to sync remote images to Cloudinary for optimization
  // But don't fail if Cloudinary is not configured - local images are primary
  if (remoteImageCount > 0) {
    try {
      const { syncImagesToCloudinary } = await import('./cloudinary-sync.js');
      const data = { events, menus, packages, dishes, gallery, hero, about };
      const cloudinaryResult = await syncImagesToCloudinary(data);
      cloudinaryImageMap = cloudinaryResult.imageMap || new Map();
      console.log(`☁️ Cloudinary sync: ${cloudinaryResult.uploaded || 0} uploaded, ${cloudinaryResult.skipped || 0} existing`);
    } catch (error) {
      console.log('📸 Cloudinary sync skipped (using local images):', error.message);
    }
  } else {
    console.log('✅ All images are local - no Cloudinary sync needed');
  }
  
  // Only use Airtable data when FORCE_FRESH_FETCH is enabled
  // Otherwise, provide fallback content for development
  let finalHero, finalAbout, finalPackages, finalMenus, finalGallery;
  
  if (FORCE_FRESH_FETCH) {
    // When forcing fresh fetch, only use Airtable data - no fallbacks
    finalHero = hero;
    finalAbout = about;
    finalPackages = packages;
    finalMenus = menus;
    finalGallery = gallery;
    
    if (hero.length === 0) console.warn("⚠️  No hero data from Airtable");
    if (about.length === 0) console.warn("⚠️  No about data from Airtable");
    if (packages.length === 0) console.warn("⚠️  No packages from Airtable");
    if (menus.length === 0) console.warn("⚠️  No menus from Airtable");
    if (gallery.length === 0) console.warn("⚠️  No gallery data from Airtable");
  } else {
    // Use fallback content only when not forcing fresh fetch (for development)
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
    
    const fallbackMenus = [
      {
        "Title": "תפריט ערב",
        "Description": "תפריט ערב מגוון עם מנות צרפתיות קלאסיות",
        "slug": "evening-menu",
        "Dishes": []
      },
      {
        "Title": "תפריט אירועים",
        "Description": "תפריט מיוחד לאירועים וחגיגות",
        "slug": "events-menu", 
        "Dishes": []
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
    
    // Use fallback data if no Airtable data available (only when not forcing fresh fetch)
    finalHero = hero.length > 0 ? hero : fallbackHero;
    finalAbout = about.length > 0 ? about : fallbackAbout;
    finalPackages = packages.length > 0 ? packages : fallbackPackages;
    finalMenus = menus.length > 0 ? menus : fallbackMenus;
    finalGallery = gallery.length > 0 ? gallery : fallbackGallery;
  }

  const dishMap = Object.fromEntries(dishes.map(d => [d.id, d]));
  const menuMap = Object.fromEntries(
    finalMenus.map((m, index) => {
      const slug = m.slug || slugify(m.Title || m.Name);
      const items = (m.Dishes || []).map(id => dishMap[id]).filter(Boolean);
      return [m.id || `fallback-menu-${index}`, { ...m, slug, items }];
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
    const activeHeroes = finalHero.filter(h => {
      const active = h["פעיל (Active)"] || h["Active"] || h.active !== false;
      return active !== false;
    });
    const heroSlides = activeHeroes.map((heroData, index) => {
      const heroImage = firstImageFrom(heroData, cloudinaryImageMap, imageMap);
      const heroVideo = firstVideoFrom(heroData);
      // Try multiple possible field names
      const heroTitle = heroData["כותרת ראשית (Main Heading)"] || heroData["Main Heading"] || heroData["כותרת"] || heroData.Title || heroData.Name || SITE_NAME;
      const heroSubtitle = heroData["כותרת משנה (Subheading)"] || heroData["Subheading"] || heroData["כותרת משנה"] || heroData.Subtitle || heroData.Description || "חוויה קולינרית ייחודית לאירועים בלתי נשכחים";
      
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
    // Try multiple possible field names from Airtable
    const aboutTitle = aboutData?.["Section Title"] || aboutData?.["כותרת (Title)"] || aboutData?.Title || aboutData?.Name || SITE_NAME;
    const aboutContent = aboutData?.Description || aboutData?.["תיאור (Description)"] || aboutData?.Content || aboutData?.["תוכן (Content)"] || aboutData?.Text || 
      (finalAbout.length > 0 ? "תוכן מאירוטבל" : "מסעדת הנמל 24 מציעה חוויה קולינרית ייחודית באווירה אלגנטית וחמימה. אנו מתמחים באירועים פרטיים ועסקיים, ומציעים תפריטים מותאמים אישית לכל אירוע.");
    const aboutImage = firstImageFrom(aboutData, cloudinaryImageMap, imageMap);
    const aboutSection = `
      <section class="about-section" id="about">
        <div class="about-container">
          <h2 class="about-title">אודותינו</h2>
          <div class="about-content">
            <div class="about-text">
              <h3>${aboutTitle}</h3>
              <p>${aboutContent}</p>
              ${aboutData?.Additional_Info || aboutData?.["מידע נוסף"] ? `<p class="additional-info">${aboutData.Additional_Info || aboutData["מידע נוסף"]}</p>` : ""}
            </div>
            <div class="about-image">
              ${aboutImage ? `<img src="${aboutImage}" alt="אודות ${SITE_NAME}">` : `<div class="about-placeholder">🍽️</div>`}
            </div>
          </div>
        </div>
      </section>
    `;
    
    // Gallery section
    const activeGalleryItems = finalGallery.filter(item => item["פעיל (Active)"] !== false);
    // Filter out items without images
    const galleryItemsWithImages = activeGalleryItems.filter(item => {
      const imageUrl = firstImageFrom(item, cloudinaryImageMap, imageMap);
      return imageUrl !== null;
    });
    const totalImages = galleryItemsWithImages.length;
    const initialImages = 6;
    
    const gallerySection = `
      <section class="gallery-section" id="gallery">
        <div class="gallery-container">
          <h2 class="gallery-title">גלריית תמונות</h2>
          <div class="gallery-grid" id="gallery-grid">
            ${galleryItemsWithImages.slice(0, initialImages).map((item, index) => {
              const imageUrl = firstImageFrom(item, cloudinaryImageMap, imageMap);
              const title = item["כותרת (Title)"] || item.Title || item.Name || "תמונה";
              const description = item["תיאור (Description)"] || item.Description || "";
              
              return `
                <div class="gallery-item" onclick="openGalleryModal('${imageUrl}', '${title.replace(/'/g, "\\'")}', '${description.replace(/'/g, "\\'")}', ${index})">
                  <div class="gallery-image-container">
                    <img src="${imageUrl}" alt="${title}" class="gallery-image" loading="eager" fetchpriority="high" onerror="this.classList.add('hidden'); this.nextElementSibling.classList.add('show');">
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
            ${finalPackages.map((pkg, index) => {
              const packageImage = firstImageFrom(pkg, cloudinaryImageMap, imageMap);
              return `
              <div class="package-card" data-package-id="${pkg.id || `package-${index}`}" onclick="openPackageModal('${pkg.id || `package-${index}`}')">
                <div class="package-image-container">
                  ${packageImage ? `<img src="${packageImage}" alt="${pkg["שם חבילה (Package Name)"] || pkg.Title || pkg.Name}" class="package-image" loading="lazy" onerror="this.classList.add('hidden'); this.nextElementSibling.classList.add('show');"><div class="image-placeholder">📦</div>` : `<div class="image-placeholder show">📦</div>`}
                </div>
                <div class="package-content">
                  <h3 class="package-title">${pkg["שם חבילה (Package Name)"] || pkg.Title || pkg.Name || "חבילה"}</h3>
                  ${pkg["מחיר (Price)"] || pkg.Price ? `<div class="package-price">${money(pkg["מחיר (Price)"] || pkg.Price)}</div>` : ""}
                  ${pkg["תיאור (Description)"] || pkg.Description ? `<p class="package-description">${pkg["תיאור (Description)"] || pkg.Description}</p>` : ""}
                  <button class="package-link" onclick="event.stopPropagation(); openPackageModal('${pkg.id || `package-${index}`}')">לפרטים נוספים</button>
                </div>
              </div>
            `;
            }).join("")}
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
      <div id="package-modal" class="package-modal">
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
            <button class="package-modal-cta" onclick="scrollToContact(); document.dispatchEvent(new CustomEvent('packageCTAClicked', {detail: {packageName: document.getElementById('modal-package-title')?.textContent}}))">הזמן עכשיו</button>
          </div>
        </div>
      </div>
    `;
    
    // Gallery modal HTML
    const galleryModal = `
      <div id="gallery-modal" class="gallery-modal">
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
      // Create gallery data with Cloudinary URLs mapped
      const galleryDataWithCloudinaryUrls = galleryItemsWithImages.map(item => {
        const cloudinaryUrl = firstImageFrom(item, cloudinaryImageMap, imageMap);
        // Clone item and update Image field with Cloudinary URL
        const itemCopy = JSON.parse(JSON.stringify(item)); // Deep clone
        if (cloudinaryUrl) {
          // Replace the Image field entirely with Cloudinary URL
          if (Array.isArray(itemCopy.Image)) {
            // Replace first image in array with Cloudinary URL
            itemCopy.Image = [{
              url: cloudinaryUrl,
              id: itemCopy.Image[0]?.id || 'cloudinary',
              width: itemCopy.Image[0]?.width || 800,
              height: itemCopy.Image[0]?.height || 600,
              filename: itemCopy.Image[0]?.filename || 'image.jpg',
              type: itemCopy.Image[0]?.type || 'image/jpeg'
            }];
          } else if (itemCopy.Image) {
            // Single image object
            itemCopy.Image = {
              url: cloudinaryUrl,
              id: itemCopy.Image.id || 'cloudinary',
              width: itemCopy.Image.width || 800,
              height: itemCopy.Image.height || 600,
              filename: itemCopy.Image.filename || 'image.jpg',
              type: itemCopy.Image.type || 'image/jpeg'
            };
          } else {
            // No Image field, add one
            itemCopy.Image = [{ url: cloudinaryUrl }];
          }
        }
        return itemCopy;
      });
      
      // Update package data with Cloudinary URLs
      const packageDataWithCloudinaryUrls = finalPackages.map(pkg => {
        const cloudinaryUrl = firstImageFrom(pkg, cloudinaryImageMap, imageMap);
        if (!cloudinaryUrl) return pkg; // No image, return as-is
        
        const pkgCopy = JSON.parse(JSON.stringify(pkg)); // Deep clone
        if (Array.isArray(pkgCopy["תמונה (Image)"])) {
          // Replace first image in array with Cloudinary URL
          pkgCopy["תמונה (Image)"] = [{
            url: cloudinaryUrl,
            id: pkgCopy["תמונה (Image)"][0]?.id || 'cloudinary',
            width: pkgCopy["תמונה (Image)"][0]?.width || 800,
            height: pkgCopy["תמונה (Image)"][0]?.height || 600,
            filename: pkgCopy["תמונה (Image)"][0]?.filename || 'image.jpg',
            type: pkgCopy["תמונה (Image)"][0]?.type || 'image/jpeg'
          }];
        } else if (pkgCopy["תמונה (Image)"]) {
          // Single image object
          pkgCopy["תמונה (Image)"] = [{
            url: cloudinaryUrl,
            id: pkgCopy["תמונה (Image)"].id || 'cloudinary',
            width: pkgCopy["תמונה (Image)"].width || 800,
            height: pkgCopy["תמונה (Image)"].height || 600,
            filename: pkgCopy["תמונה (Image)"].filename || 'image.jpg',
            type: pkgCopy["תמונה (Image)"].type || 'image/jpeg'
          }];
        } else {
          // No Image field, add one
          pkgCopy["תמונה (Image)"] = [{ url: cloudinaryUrl }];
        }
        return pkgCopy;
      });
      
      const packageDataScript = `
        <script>
          window.PACKAGE_DATA = ${JSON.stringify(packageDataWithCloudinaryUrls)};
          window.DISH_DATA = ${JSON.stringify(dishes)};
          window.PACKAGE_DISH_MAP = ${JSON.stringify(packageDishMap)};
          window.GALLERY_DATA = ${JSON.stringify(galleryDataWithCloudinaryUrls)};
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
    const heroImg = firstImageFrom(e, cloudinaryImageMap, imageMap) ? `<img src="${firstImageFrom(e, cloudinaryImageMap, imageMap)}" alt="${e["Event Name"] || e.Title || e.Name}" class="hero-img">` : "";
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
      image: firstImageFrom(e, cloudinaryImageMap, imageMap),
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
        image: firstImageFrom(e, cloudinaryImageMap, imageMap) ? [firstImageFrom(e, cloudinaryImageMap, imageMap)] : undefined
      },
      site
    });
    writeHtml(`/events/${e.slug}/index.html`, html);
  }

  // menus list
  {
    const list = Object.values(menuMap).map(m => card(`/menus/${m.slug}/`, m.Title || m.Name, "", firstImageFrom(m, cloudinaryImageMap, imageMap))).join("");
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
      image: firstImageFrom(m, cloudinaryImageMap, imageMap),
      site
    });
    writeHtml(`/menus/${m.slug}/index.html`, html);
  }

  // packages list
  {
    const list = Object.values(pkgMap).map(p => card(`/packages/${p.slug}/`, p["שם חבילה (Package Name)"] || p.Title || p.Name, p["מחיר (Price)"] ? money(p["מחיר (Price)"]) : "", firstImageFrom(p, cloudinaryImageMap, imageMap))).join("");
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
    const packageImage = firstImageFrom(p, cloudinaryImageMap, imageMap);
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

