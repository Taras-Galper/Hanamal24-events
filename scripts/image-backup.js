// Image Backup System
// Downloads Airtable images and stores them locally for reliability

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import { promisify } from 'util';
import crypto from 'crypto';
import { isUrlProcessed, registerUrl, getFilenameForUrl, getLocalPathForUrl, cleanupRegistry } from './image-registry.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imagesDir = path.join(__dirname, '..', 'dist', 'images');
const publicImagesDir = path.join(__dirname, '..', 'public', 'images');

// Ensure images directory exists
function ensureImagesDir() {
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }
  if (!fs.existsSync(publicImagesDir)) {
    fs.mkdirSync(publicImagesDir, { recursive: true });
  }
}

// Download image from URL
async function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filename);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve(filename);
      });
      
      file.on('error', (err) => {
        fs.unlink(filename, () => {}); // Delete the file on error
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Generate content-based hash filename to prevent duplicates
function generateFilename(url) {
  try {
    // Create a hash of the URL to ensure consistent naming
    const hash = crypto.createHash('md5').update(url).digest('hex').substring(0, 12);
    
    // Extract file extension from URL
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const ext = path.extname(pathname) || '.jpg';
    
    return `${hash}${ext}`;
  } catch (error) {
    // Fallback to timestamp if URL parsing fails
    return `img_${Date.now()}.jpg`;
  }
}

// Check if image already exists
function imageExists(filename) {
  const distPath = path.join(imagesDir, filename);
  const publicPath = path.join(publicImagesDir, filename);
  const distExists = fs.existsSync(distPath);
  const publicExists = fs.existsSync(publicPath);
  const exists = distExists || publicExists;
  
  if (exists) {
    console.log(`✅ Image exists: ${filename} (dist: ${distExists}, public: ${publicExists})`);
  } else {
    console.log(`❌ Image not found: ${filename}`);
  }
  return exists;
}

// Clean up old duplicate images (optional cleanup function)
export function cleanupOldImages() {
  try {
    const files = fs.readdirSync(imagesDir);
    const publicFiles = fs.readdirSync(publicImagesDir);
    
    // Find files that match old naming pattern (with underscores and numbers)
    const oldPattern = /^[a-zA-Z0-9_]+_\d+\.(jpg|jpeg|png|gif|webp)$/;
    const oldFiles = files.filter(file => oldPattern.test(file));
    const oldPublicFiles = publicFiles.filter(file => oldPattern.test(file));
    
    console.log(`🧹 Found ${oldFiles.length} old image files to clean up`);
    
    // Remove old files
    oldFiles.forEach(file => {
      const filePath = path.join(imagesDir, file);
      try {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Removed old image: ${file}`);
      } catch (error) {
        console.warn(`⚠️ Could not remove ${file}: ${error.message}`);
      }
    });
    
    oldPublicFiles.forEach(file => {
      const filePath = path.join(publicImagesDir, file);
      try {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Removed old public image: ${file}`);
      } catch (error) {
        console.warn(`⚠️ Could not remove ${file}: ${error.message}`);
      }
    });
    
    return { removed: oldFiles.length + oldPublicFiles.length };
  } catch (error) {
    console.warn(`⚠️ Cleanup failed: ${error.message}`);
    return { removed: 0, error: error.message };
  }
}

// Process and backup images from Airtable data
export async function backupImages(data) {
  ensureImagesDir();
  
  const imageMap = new Map();
  const processedUrls = new Set(); // Track processed URLs to prevent duplicates
  const allUrls = []; // Collect all URLs for registry cleanup
  let imageIndex = 0;
  
  // Process all records for images
  const processRecord = (record, recordType) => {
    const imageFields = [
      "תמונה (Image)",
      "Image", 
      "תמונה",
      "Picture",
      "Photo",
      "תמונה של המנה",
      "Event Photos"
    ];
    
    for (const field of imageFields) {
      if (record[field]) {
        let images = Array.isArray(record[field]) ? record[field] : [record[field]];
        
        for (const img of images) {
          const imageUrl = img.url || img;
          if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('http') && !processedUrls.has(imageUrl)) {
            processedUrls.add(imageUrl); // Mark URL as processed
            allUrls.push(imageUrl); // Add to cleanup list
            
            const filename = generateFilename(imageUrl);
            const localPath = `/images/${filename}`;
            
            // Check if file already exists (more reliable than URL registry for Airtable)
            if (imageExists(filename)) {
              imageMap.set(imageUrl, {
                filename,
                localPath,
                recordType,
                recordId: record.id,
                exists: true
              });
              console.log(`♻️ Reusing existing file: ${filename}`);
            } else {
              console.log(`🆕 New image URL: ${imageUrl.substring(0, 50)}...`);
              
            // Store mapping for later download
            imageMap.set(imageUrl, {
              filename,
              localPath,
              recordType,
              recordId: record.id,
              exists: imageExists(filename)
            });
            }
          }
        }
      }
    }
  };
  
  // Process all data types
  if (data.events) data.events.forEach(record => processRecord(record, 'events'));
  if (data.packages) data.packages.forEach(record => processRecord(record, 'packages'));
  if (data.dishes) data.dishes.forEach(record => processRecord(record, 'dishes'));
  if (data.gallery) data.gallery.forEach(record => processRecord(record, 'gallery'));
  if (data.hero) data.hero.forEach(record => processRecord(record, 'hero'));
  if (data.about) data.about.forEach(record => processRecord(record, 'about'));
  
  // Filter out existing images
  const imagesToDownload = Array.from(imageMap.entries()).filter(([url, info]) => !info.exists);
  const existingImages = Array.from(imageMap.entries()).filter(([url, info]) => info.exists);
  
  console.log(`📸 Found ${imageMap.size} total images`);
  console.log(`✅ ${existingImages.length} images already exist (skipping)`);
  console.log(`⬇️ ${imagesToDownload.length} new images to download`);
  
  // Download only new images
  const downloadPromises = imagesToDownload.map(async ([originalUrl, info]) => {
    try {
      const filePath = path.join(imagesDir, info.filename);
      await downloadImage(originalUrl, filePath);
      
      // Also copy to public directory for development
      const publicPath = path.join(publicImagesDir, info.filename);
      fs.copyFileSync(filePath, publicPath);
      
      // Register the URL in the registry
      registerUrl(originalUrl, info.filename);
      
      console.log(`✅ Downloaded: ${info.filename}`);
      return { originalUrl, localPath: info.localPath, success: true };
    } catch (error) {
      console.warn(`⚠️ Failed to download ${originalUrl}: ${error.message}`);
      return { originalUrl, localPath: info.localPath, success: false, error: error.message };
    }
  });
  
  const results = await Promise.all(downloadPromises);
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  // Create final image map including existing images
  const finalImageMap = new Map();
  
  // Add existing images
  existingImages.forEach(([url, info]) => {
    finalImageMap.set(url, info.localPath);
  });
  
  // Add newly downloaded images
  successful.forEach(r => {
    finalImageMap.set(r.originalUrl, r.localPath);
  });
  
  console.log(`✅ Successfully backed up ${successful.length} new images`);
  console.log(`♻️ Reused ${existingImages.length} existing images`);
  if (failed.length > 0) {
    console.log(`⚠️ Failed to backup ${failed.length} images`);
  }

  // Clean up registry (remove entries for URLs that no longer exist)
  cleanupRegistry(allUrls);

  return {
    imageMap: finalImageMap,
    failed: failed.length,
    skipped: existingImages.length,
    downloaded: successful.length
  };
}

// Get local image path or fallback
export function getImagePath(originalUrl, imageMap) {
  if (imageMap && imageMap.has(originalUrl)) {
    return imageMap.get(originalUrl);
  }
  
  // Fallback to original URL if not backed up
  return originalUrl;
}

// Enhanced image URL getter with backup support
export function getImageUrl(item, imageMap = null) {
  const imageFields = [
    "תמונה (Image)",
    "Image", 
    "תמונה",
    "Picture",
    "Photo",
    "תמונה של המנה"
  ];
  
  for (const field of imageFields) {
    if (item[field]) {
      if (Array.isArray(item[field])) {
        const imageUrl = item[field][0]?.url || item[field][0];
        if (imageUrl) {
          return getImagePath(imageUrl, imageMap);
        }
      } else if (typeof item[field] === 'string') {
        return getImagePath(item[field], imageMap);
      }
    }
  }
  
  // Ultimate fallback
  return "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=600&fit=crop";
}
