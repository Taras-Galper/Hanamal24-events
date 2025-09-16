// Image Backup System
// Downloads Airtable images and stores them locally for reliability

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import { promisify } from 'util';

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

// Generate safe filename from URL
function generateFilename(url, index = 0) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const ext = path.extname(pathname) || '.jpg';
    const baseName = path.basename(pathname, ext) || 'image';
    const safeName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
    return `${safeName}_${index}${ext}`;
  } catch (error) {
    return `image_${Date.now()}_${index}.jpg`;
  }
}

// Process and backup images from Airtable data
export async function backupImages(data) {
  ensureImagesDir();
  
  const imageMap = new Map();
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
          if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('http')) {
            const filename = generateFilename(imageUrl, imageIndex++);
            const localPath = `/images/${filename}`;
            
            // Store mapping for later download
            imageMap.set(imageUrl, {
              filename,
              localPath,
              recordType,
              recordId: record.id
            });
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
  
  console.log(`📸 Found ${imageMap.size} images to backup`);
  
  // Download images
  const downloadPromises = Array.from(imageMap.entries()).map(async ([originalUrl, info]) => {
    try {
      const filePath = path.join(imagesDir, info.filename);
      await downloadImage(originalUrl, filePath);
      
      // Also copy to public directory for development
      const publicPath = path.join(publicImagesDir, info.filename);
      fs.copyFileSync(filePath, publicPath);
      
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
  
  console.log(`✅ Successfully backed up ${successful.length} images`);
  if (failed.length > 0) {
    console.log(`⚠️ Failed to backup ${failed.length} images`);
  }
  
  return {
    imageMap: new Map(successful.map(r => [r.originalUrl, r.localPath])),
    failed: failed.length
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
