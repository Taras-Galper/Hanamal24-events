// Image Database System
// Provides stable, constant naming for images regardless of Airtable URL changes
// Uses content-based identification to prevent duplicates

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import https from 'https';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imagesDir = path.join(__dirname, '..', 'dist', 'images');
const publicImagesDir = path.join(__dirname, '..', 'public', 'images');
const databasePath = path.join(__dirname, '..', 'dist', 'image-database.json');

// Ensure directories exist
function ensureDirectories() {
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }
  if (!fs.existsSync(publicImagesDir)) {
    fs.mkdirSync(publicImagesDir, { recursive: true });
  }
}

// Load image database
function loadDatabase() {
  if (fs.existsSync(databasePath)) {
    try {
      const data = fs.readFileSync(databasePath, 'utf8');
      const database = JSON.parse(data);
      console.log(`📂 Database file found: ${Object.keys(database.images || {}).length} images`);
      return database;
    } catch (error) {
      console.warn('⚠️ Could not load image database:', error.message);
      return { images: {}, contentMap: {} };
    }
  }
  console.log('📂 No database file found, starting fresh');
  return { images: {}, contentMap: {} };
}

// Save image database
function saveDatabase(database) {
  try {
    fs.writeFileSync(databasePath, JSON.stringify(database, null, 2));
  } catch (error) {
    console.warn('⚠️ Could not save image database:', error.message);
  }
}

// Generate stable image ID based on content
function generateStableId(imageUrl, recordType, recordId, fieldName) {
  // Create a stable identifier that doesn't change with Airtable URLs
  const stableKey = `${recordType}-${recordId}-${fieldName}`;
  return crypto.createHash('md5').update(stableKey).digest('hex').substring(0, 12);
}

// Download image and get content hash
async function downloadAndHashImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const contentHash = crypto.createHash('md5').update(buffer).digest('hex');
        resolve({ buffer, contentHash });
      });
    }).on('error', reject);
  });
}

// Check if image exists by content hash
function findImageByContent(contentHash, database) {
  return database.contentMap[contentHash] || null;
}

// Check if image exists by stable ID
function findImageByStableId(stableId, database) {
  return database.images[stableId] || null;
}

// Add image to database
function addImageToDatabase(stableId, contentHash, filename, metadata, database) {
  database.images[stableId] = {
    filename,
    contentHash,
    ...metadata,
    addedAt: new Date().toISOString()
  };
  
  database.contentMap[contentHash] = {
    stableId,
    filename,
    ...metadata
  };
}

// Main function to process images
export async function processImages(data) {
  ensureDirectories();
  const database = loadDatabase();
  
  console.log('🔄 Processing images with stable naming system...');
  console.log(`📊 Database loaded: ${Object.keys(database.images).length} existing images`);
  
  const imageMap = new Map();
  let processedCount = 0;
  let reusedCount = 0;
  let newCount = 0;
  
  // Process all records for images
  const processRecord = async (record, recordType) => {
    const imageFields = [
      "תמונה (Image)", "Image", "תמונה", "Picture", "Photo",
      "תמונה של המנה", "Event Photos"
    ];
    
    for (const field of imageFields) {
      if (record[field]) {
        const images = Array.isArray(record[field]) ? record[field] : [record[field]];
        
        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          const imageUrl = img.url || img;
          
          if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('http')) {
            const stableId = generateStableId(imageUrl, recordType, record.id, field);
            const fieldIndex = i > 0 ? `-${i}` : '';
            const fullStableId = `${stableId}${fieldIndex}`;
            
            // Check if we already have this image by stable ID
            let existingImage = findImageByStableId(fullStableId, database);
            
            if (existingImage) {
              // Image already exists, reuse it
              imageMap.set(imageUrl, `/images/${existingImage.filename}`);
              console.log(`♻️ Reusing stable image: ${existingImage.filename} (${fullStableId})`);
              reusedCount++;
            } else {
              console.log(`🔍 Stable ID not found: ${fullStableId} for URL: ${imageUrl.substring(0, 50)}...`);
              // New image, download and process
              try {
                console.log(`⬇️ Downloading new image: ${imageUrl.substring(0, 50)}...`);
                const { buffer, contentHash } = await downloadAndHashImage(imageUrl);
                
                // Check if we have this content already
                const existingByContent = findImageByContent(contentHash, database);
                
                if (existingByContent) {
                  // Same content, different stable ID - reuse the existing file
                  imageMap.set(imageUrl, `/images/${existingByContent.filename}`);
                  console.log(`♻️ Reusing by content: ${existingByContent.filename} (${contentHash.substring(0, 8)})`);
                  reusedCount++;
                } else {
                  // Truly new image
                  const ext = path.extname(new URL(imageUrl).pathname) || '.jpg';
                  const filename = `${fullStableId}${ext}`;
                  const filePath = path.join(imagesDir, filename);
                  const publicPath = path.join(publicImagesDir, filename);
                  
                  // Save file
                  fs.writeFileSync(filePath, buffer);
                  fs.writeFileSync(publicPath, buffer);
                  
                  // Add to database
                  addImageToDatabase(fullStableId, contentHash, filename, {
                    recordType,
                    recordId: record.id,
                    fieldName: field,
                    originalUrl: imageUrl,
                    size: buffer.length
                  }, database);
                  
                  imageMap.set(imageUrl, `/images/${filename}`);
                  console.log(`✅ New image saved: ${filename} (${contentHash.substring(0, 8)})`);
                  newCount++;
                }
                
                processedCount++;
              } catch (error) {
                console.warn(`⚠️ Failed to process image: ${error.message}`);
                // Fallback to original URL
                imageMap.set(imageUrl, imageUrl);
              }
            }
          }
        }
      }
    }
  };
  
  // Process all data types
  if (data.events) {
    for (const record of data.events) {
      await processRecord(record, 'events');
    }
  }
  if (data.packages) {
    for (const record of data.packages) {
      await processRecord(record, 'packages');
    }
  }
  if (data.dishes) {
    for (const record of data.dishes) {
      await processRecord(record, 'dishes');
    }
  }
  if (data.gallery) {
    for (const record of data.gallery) {
      await processRecord(record, 'gallery');
    }
  }
  if (data.hero) {
    for (const record of data.hero) {
      await processRecord(record, 'hero');
    }
  }
  if (data.about) {
    for (const record of data.about) {
      await processRecord(record, 'about');
    }
  }
  
  // Save updated database
  saveDatabase(database);
  
  console.log(`📊 Image processing complete:`);
  console.log(`   📸 Processed: ${processedCount} images`);
  console.log(`   ♻️ Reused: ${reusedCount} images`);
  console.log(`   🆕 New: ${newCount} images`);
  console.log(`   💾 Database: ${Object.keys(database.images).length} total images`);
  
  return {
    imageMap,
    processed: processedCount,
    reused: reusedCount,
    new: newCount,
    total: Object.keys(database.images).length
  };
}

// Clean up orphaned images (images in database but not in current data)
export function cleanupOrphanedImages(currentImageMap) {
  const database = loadDatabase();
  const currentUrls = new Set(currentImageMap.keys());
  const currentStableIds = new Set();
  
  // Get stable IDs from current data
  for (const [url, localPath] of currentImageMap) {
    const filename = path.basename(localPath);
    const stableId = filename.split('.')[0]; // Remove extension
    currentStableIds.add(stableId);
  }
  
  let removedCount = 0;
  const imagesToRemove = [];
  
  // Find orphaned images
  for (const [stableId, imageData] of Object.entries(database.images)) {
    if (!currentStableIds.has(stableId)) {
      imagesToRemove.push({ stableId, imageData });
    }
  }
  
  // Remove orphaned images
  for (const { stableId, imageData } of imagesToRemove) {
    const filePath = path.join(imagesDir, imageData.filename);
    const publicPath = path.join(publicImagesDir, imageData.filename);
    
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      if (fs.existsSync(publicPath)) {
        fs.unlinkSync(publicPath);
      }
      
      delete database.images[stableId];
      delete database.contentMap[imageData.contentHash];
      removedCount++;
      
      console.log(`🗑️ Removed orphaned image: ${imageData.filename}`);
    } catch (error) {
      console.warn(`⚠️ Error removing ${imageData.filename}: ${error.message}`);
    }
  }
  
  if (removedCount > 0) {
    saveDatabase(database);
    console.log(`🧹 Cleaned up ${removedCount} orphaned images`);
  }
  
  return removedCount;
}

// Get image statistics
export function getImageStats() {
  const database = loadDatabase();
  const totalImages = Object.keys(database.images).length;
  const totalContentHashes = Object.keys(database.contentMap).length;
  
  return {
    totalImages,
    totalContentHashes,
    databaseSize: fs.existsSync(databasePath) ? fs.statSync(databasePath).size : 0
  };
}
