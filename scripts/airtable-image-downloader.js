// Airtable Image Downloader
// Downloads images IMMEDIATELY when fetching from Airtable
// Uses record IDs as stable identifiers - never relies on Airtable URLs again

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imagesDir = path.join(__dirname, '..', 'public', 'images');
const imageRegistryPath = path.join(__dirname, '..', 'data', 'image-registry.json');

// Ensure images directory exists
function ensureImagesDir() {
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }
}

// Load image registry (maps record+field -> filename, and contentHash -> filename)
function loadRegistry() {
  if (fs.existsSync(imageRegistryPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(imageRegistryPath, 'utf8'));
      return {
        byKey: data.byKey || data, // Support old format
        byContentHash: data.byContentHash || {}
      };
    } catch (error) {
      console.warn('⚠️ Could not load image registry:', error.message);
    }
  }
  return { byKey: {}, byContentHash: {} };
}

// Save image registry
function saveRegistry(registry) {
  const dataDir = path.dirname(imageRegistryPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(imageRegistryPath, JSON.stringify(registry, null, 2));
}

// Generate stable filename from record ID and field name
function generateStableFilename(recordId, fieldName, index = 0) {
  // Use record ID + field name for stable naming
  const stableKey = `${recordId}-${fieldName}${index > 0 ? `-${index}` : ''}`;
  const hash = crypto.createHash('md5').update(stableKey).digest('hex').substring(0, 12);
  return `${hash}.jpg`; // Always use .jpg for consistency
}

// Download image from URL and return buffer + hash
async function downloadImage(url, filePath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const chunks = [];
    
    protocol.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307 || response.statusCode === 308) {
        const location = response.headers.location;
        if (location) {
          return downloadImage(location, filePath).then(resolve).catch(reject);
        }
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }
      
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const contentHash = crypto.createHash('md5').update(buffer).digest('hex');
        
        // Write file
        fs.writeFileSync(filePath, buffer);
        
        resolve({ filePath, buffer, contentHash });
      });
      
      response.on('error', reject);
    }).on('error', reject);
  });
}

// Process and download images from a record
async function processRecordImages(record, recordType) {
  ensureImagesDir();
  const registry = loadRegistry();
  
  const imageFields = [
    "תמונה (Image)", "Image", "תמונה", "Picture", "Photo", 
    "תמונה של המנה", "Event Photos"
  ];
  
  const updatedRecord = { ...record };
  let downloadedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  
  for (const field of imageFields) {
    if (record[field]) {
      const images = Array.isArray(record[field]) ? record[field] : [record[field]];
      const processedImages = [];
      
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const imageUrl = img?.url || img;
        
        if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.startsWith('http')) {
          // Not a valid URL, keep as-is
          processedImages.push(img);
          continue;
        }
        
        // Generate stable filename based on record ID and field
        const filename = generateStableFilename(record.id, field, i);
        const filePath = path.join(imagesDir, filename);
        const localPath = `/images/${filename}`;
        
        // Check registry to see if we already have this image
        const registryKey = `${record.id}-${field}-${i}`;
        
        // Check 1: Does this exact record+field already have an image?
        if (registry.byKey[registryKey]) {
          const existingEntry = registry.byKey[registryKey];
          const existingFilePath = path.join(imagesDir, existingEntry.filename);
          
          if (fs.existsSync(existingFilePath)) {
            // Image already exists for this record+field, reuse it
            processedImages.push({
              url: existingEntry.localPath,
              id: img?.id || 'local',
              width: img?.width || 800,
              height: img?.height || 600,
              filename: existingEntry.filename,
              type: img?.type || 'image/jpeg',
              local: true
            });
            skippedCount++;
            console.log(`♻️ Reusing existing: ${existingEntry.filename} (${recordType})`);
            continue; // Skip to next image
          }
        }
        
        // Need to download - but first check if we have the same content
        try {
          console.log(`⬇️ Downloading: ${filename} from ${imageUrl.substring(0, 50)}...`);
          const { filePath: downloadedPath, buffer, contentHash } = await downloadImage(imageUrl, filePath);
          
          // Check 2: Do we already have this image content (even if from different record)?
          if (registry.byContentHash[contentHash] && fs.existsSync(registry.byContentHash[contentHash].filePath)) {
            // Same image content exists - reuse the existing file
            const existingEntry = registry.byContentHash[contentHash];
            const existingFilename = path.basename(existingEntry.filePath);
            const existingPath = `/images/${existingFilename}`;
            
            // Delete the duplicate we just downloaded
            if (fs.existsSync(filePath) && filePath !== existingEntry.filePath) {
              fs.unlinkSync(filePath);
            }
            
            // Register this record+field to use the existing image
            registry.byKey[registryKey] = {
              filename: existingFilename,
              localPath: existingPath,
              recordType,
              recordId: record.id,
              fieldName: field,
              index: i,
              downloadedAt: new Date().toISOString(),
              originalUrl: imageUrl,
              contentHash,
              reusedFrom: existingEntry.registryKey
            };
            
            processedImages.push({
              url: existingPath,
              id: img?.id || 'local',
              width: img?.width || 800,
              height: img?.height || 600,
              filename: existingFilename,
              type: img?.type || 'image/jpeg',
              local: true
            });
            
            skippedCount++;
            console.log(`♻️ Reusing by content: ${existingFilename} (same image, different record)`);
          } else {
            // Truly new image - save it
            registry.byKey[registryKey] = {
              filename,
              localPath,
              recordType,
              recordId: record.id,
              fieldName: field,
              index: i,
              downloadedAt: new Date().toISOString(),
              originalUrl: imageUrl,
              contentHash
            };
            
            // Register by content hash for future deduplication
            registry.byContentHash[contentHash] = {
              filePath,
              filename,
              localPath,
              registryKey,
              firstSeenAt: new Date().toISOString()
            };
            
            processedImages.push({
              url: localPath,
              id: img?.id || 'local',
              width: img?.width || 800,
              height: img?.height || 600,
              filename: filename,
              type: img?.type || 'image/jpeg',
              local: true
            });
            
            downloadedCount++;
            console.log(`✅ Downloaded: ${filename}`);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to download ${imageUrl}: ${error.message}`);
          // Keep original URL as fallback (though it may expire)
          processedImages.push(img);
          failedCount++;
        }
      }
      
      // Update record with processed images
      if (Array.isArray(record[field])) {
        updatedRecord[field] = processedImages;
      } else {
        updatedRecord[field] = processedImages[0] || record[field];
      }
    }
  }
  
  // Save registry after processing
  saveRegistry(registry);
  
  return {
    record: updatedRecord,
    stats: { downloaded: downloadedCount, skipped: skippedCount, failed: failedCount }
  };
}

// Process all records in a dataset
export async function downloadAirtableImages(data) {
  console.log('📸 Starting Airtable image download...');
  
  const results = {
    events: { downloaded: 0, skipped: 0, failed: 0 },
    packages: { downloaded: 0, skipped: 0, failed: 0 },
    dishes: { downloaded: 0, skipped: 0, failed: 0 },
    gallery: { downloaded: 0, skipped: 0, failed: 0 },
    hero: { downloaded: 0, skipped: 0, failed: 0 },
    about: { downloaded: 0, skipped: 0, failed: 0 },
    menus: { downloaded: 0, skipped: 0, failed: 0 }
  };
  
  const processedData = {};
  
  // Process each data type
  const processDataset = async (records, type) => {
    if (!records || records.length === 0) {
      processedData[type] = [];
      return;
    }
    
    console.log(`\n📦 Processing ${type} (${records.length} records)...`);
    const processedRecords = [];
    
    for (const record of records) {
      const { record: updated, stats } = await processRecordImages(record, type);
      processedRecords.push(updated);
      
      results[type].downloaded += stats.downloaded;
      results[type].skipped += stats.skipped;
      results[type].failed += stats.failed;
    }
    
    processedData[type] = processedRecords;
  };
  
  // Process all datasets
  if (data.events) await processDataset(data.events, 'events');
  if (data.packages) await processDataset(data.packages, 'packages');
  if (data.dishes) await processDataset(data.dishes, 'dishes');
  if (data.gallery) await processDataset(data.gallery, 'gallery');
  if (data.hero) await processDataset(data.hero, 'hero');
  if (data.about) await processDataset(data.about, 'about');
  if (data.menus) await processDataset(data.menus, 'menus');
  
  // Print summary
  console.log('\n📊 Image Download Summary:');
  Object.entries(results).forEach(([type, stats]) => {
    if (stats.downloaded > 0 || stats.skipped > 0 || stats.failed > 0) {
      console.log(`  ${type}: ${stats.downloaded} downloaded, ${stats.skipped} reused, ${stats.failed} failed`);
    }
  });
  
  return {
    data: processedData,
    stats: results
  };
}

// Get local image path for a record (for use in build process)
export function getLocalImagePath(record, fieldName = null) {
  if (!record || !record.id) return null;
  
  const registry = loadRegistry();
  const imageFields = fieldName 
    ? [fieldName]
    : ["תמונה (Image)", "Image", "תמונה", "Picture", "Photo", "תמונה של המנה", "Event Photos"];
  
  for (const field of imageFields) {
    const registryKey = `${record.id}-${field}-0`;
    if (registry.byKey[registryKey]) {
      return registry.byKey[registryKey].localPath;
    }
  }
  
  return null;
}

