# Airtable Image Solution - Permanent Local Storage

## Problem
Airtable image URLs expire after a certain time, causing images to disappear from the website. The previous solution tried to sync to Cloudinary, but if URLs were already expired, the sync would fail.

## New Solution
**Download images IMMEDIATELY when fetching from Airtable** (while URLs are fresh), store them locally with stable identifiers based on Airtable record IDs, and never rely on Airtable URLs again.

## How It Works

### 1. Image Downloader (`scripts/airtable-image-downloader.js`)
- Downloads images immediately when data is fetched from Airtable
- Uses **Airtable record IDs + field names** as stable identifiers (not URLs)
- Stores images in `/public/images/` with hash-based filenames
- Maintains a registry in `/data/image-registry.json` mapping record+field → filename
- Reuses existing images if already downloaded (checks registry)

### 2. Sync Process (`scripts/sync-airtable.js`)
- Fetches all data from Airtable
- **Immediately downloads all images** (while URLs are fresh)
- Updates data records to use local paths (`/images/abc123.jpg`) instead of Airtable URLs
- Saves updated data to JSON files in `/data/`

### 3. Build Process (`scripts/build.js`)
- Loads data from JSON files (which already have local image paths)
- Prioritizes local images over Cloudinary/remote URLs
- Only attempts Cloudinary sync for optimization (optional, not required)
- If `FORCE_FRESH_FETCH=true`, downloads images immediately after fetching

## Key Features

✅ **No more disappearing images** - Images are stored permanently locally
✅ **Stable identifiers** - Uses record IDs, not URLs, so images persist even if Airtable URLs change
✅ **Automatic reuse** - If an image was already downloaded, it's reused (no duplicates)
✅ **Works offline** - Once downloaded, images work even if Airtable is down
✅ **Fast builds** - Uses cached local images, no need to fetch from Airtable every time

## Usage

### Initial Setup / Sync
```bash
node scripts/sync-airtable.js
```
This will:
1. Fetch all data from Airtable
2. Download all images immediately
3. Save data with local image paths to `/data/*.json`

### Build
```bash
npm run build
```
Uses local images from JSON files. No Airtable API calls needed.

### Force Fresh Fetch
```bash
FORCE_FRESH_FETCH=true npm run build
```
Fetches fresh data from Airtable and downloads images immediately.

## File Structure

```
/public/images/          # Downloaded images (permanent storage)
/data/
  image-registry.json    # Maps record+field → filename
  events.json            # Data with local image paths
  packages.json
  gallery.json
  ...
```

## Image Registry Format

```json
{
  "rec123-תמונה (Image)-0": {
    "filename": "abc123def456.jpg",
    "localPath": "/images/abc123def456.jpg",
    "recordType": "packages",
    "recordId": "rec123",
    "fieldName": "תמונה (Image)",
    "index": 0,
    "downloadedAt": "2024-01-15T10:30:00.000Z",
    "originalUrl": "https://dl.airtable.com/..."
  }
}
```

## Migration Notes

- Old Airtable URLs in existing JSON files will be replaced with local paths on next sync
- Images are stored in `/public/images/` so they're included in the build
- The registry tracks which images belong to which records for cleanup/maintenance

## Benefits Over Previous Solution

1. **No dependency on Airtable URLs** - Once downloaded, images are permanent
2. **No Cloudinary required** - Works without Cloudinary (though Cloudinary can still be used for optimization)
3. **Faster builds** - No need to check/upload to Cloudinary every build
4. **More reliable** - Images won't disappear even if Airtable changes URLs

