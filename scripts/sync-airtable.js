// scripts/sync-airtable.js
// One-time sync from Airtable to local JSON files in /data to minimize API usage at runtime
// Downloads images IMMEDIATELY while URLs are fresh
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { downloadAirtableImages } from './airtable-image-downloader.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE = process.env.AIRTABLE_BASE;

if (!AIRTABLE_TOKEN || !AIRTABLE_BASE) {
  console.error("AIRTABLE_TOKEN or AIRTABLE_BASE missing. Aborting sync.");
  process.exit(1);
}

const headers = { Authorization: `Bearer ${AIRTABLE_TOKEN}` };
const dataDir = path.join(__dirname, "..", "data");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function fetchAll(table, { view = "Grid view", filterByFormula, fields } = {}) {
  const base = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(table)}`;
  let records = [];
  let offset;

  do {
    const url = new URL(base);
    url.searchParams.set("pageSize", "100");
    url.searchParams.set("view", view);
    if (offset) url.searchParams.set("offset", offset);
    if (filterByFormula) url.searchParams.set("filterByFormula", filterByFormula);
    if (Array.isArray(fields) && fields.length > 0) {
      fields.forEach(f => url.searchParams.append("fields[]", f));
    }

    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`Airtable ${table} ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    records = records.concat(data.records || []);
    offset = data.offset;
  } while (offset);

  return records.map(r => ({ id: r.id, ...r.fields }));
}

async function main() {
  ensureDir(dataDir);

  // Map logical dataset -> Airtable table id/name
  const tables = [
    { key: "events", table: "Events" },
    { key: "menus", table: "Menus" },
    { key: "packages", table: "tbl9C40JxeIkue5So" },
    { key: "dishes", table: "tblbi9b9lUjRRrAhW" },
    { key: "about", table: "tblvhDaSZbzlYP9bh" },
    { key: "hero", table: "tblOe7ONKtB6A9Q6L" },
    { key: "gallery", table: "tblpfVJY9nEb5JDlQ" }
  ];

  console.log("🔁 Syncing Airtable -> data/*.json (minimize runtime API calls)");

  // First, fetch all data from Airtable
  const rawData = {};
  for (const t of tables) {
    try {
      console.log(`→ Fetching ${t.table}...`);
      rawData[t.key] = await fetchAll(t.table, { view: "Grid view" });
      console.log(`✅ ${t.key}: ${rawData[t.key].length} records`);
    } catch (err) {
      console.error(`❌ Failed to sync ${t.key}:`, err.message);
      rawData[t.key] = [];
    }
  }

  // Now download all images IMMEDIATELY (while URLs are fresh)
  console.log("\n📸 Downloading images from Airtable (while URLs are fresh)...");
  const { data: processedData, stats } = await downloadAirtableImages(rawData);

  // Save processed data (with local image paths) to JSON files
  for (const t of tables) {
    const outFile = path.join(dataDir, `${t.key}.json`);
    const dataToSave = processedData[t.key] || rawData[t.key] || [];
    fs.writeFileSync(outFile, JSON.stringify(dataToSave, null, 2), "utf8");
    console.log(`💾 Saved ${t.key}.json with ${dataToSave.length} records (images downloaded)`);
  }

  console.log("\n🏁 Sync complete.");
  console.log("📊 Image download stats:");
  Object.entries(stats).forEach(([type, typeStats]) => {
    if (typeStats.downloaded > 0 || typeStats.skipped > 0 || typeStats.failed > 0) {
      console.log(`  ${type}: ${typeStats.downloaded} new, ${typeStats.skipped} reused, ${typeStats.failed} failed`);
    }
  });
}

main().catch(err => {
  console.error("Unexpected error:", err);
  process.exit(1);
});


