// Cloudinary + Airtable Integration
// Automatically syncs Airtable images to Cloudinary for SEO and performance
// Content managers continue using Airtable - no changes needed!

import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configure Cloudinary function
function configureCloudinary() {
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
    return true;
  }
  return false;
}

// Generate consistent public_id for images
function generatePublicId(imageUrl) {
  const hash = crypto.createHash('md5').update(imageUrl).digest('hex').substring(0, 12);
  return `hanamal24/images/${hash}`;
}

// Check if image exists in Cloudinary
async function imageExistsInCloudinary(publicId) {
  try {
    await cloudinary.api.resource(publicId);
    return true;
  } catch (error) {
    return false;
  }
}

// Upload image from URL to Cloudinary
async function uploadToCloudinary(imageUrl, publicId) {
  try {
    const result = await cloudinary.uploader.upload(imageUrl, {
      public_id: publicId,
      // Don't specify folder - public_id already includes the full path
      transformation: [
        { quality: 'auto', fetch_format: 'auto' }, // Auto optimization
        { width: 1200, height: 800, crop: 'fill' }  // Consistent sizing
      ],
      overwrite: false // Don't overwrite existing images
    });
    
    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height
    };
  } catch (error) {
    console.warn(`⚠️ Failed to upload to Cloudinary: ${error.message}`);
    return {
      success: false,
      error: error.message,
      fallbackUrl: imageUrl // Use original URL as fallback
    };
  }
}

// Main sync function
export async function syncImagesToCloudinary(data) {
  // Configure Cloudinary first
  const isConfigured = configureCloudinary();
  
  if (!isConfigured) {
    console.log('📸 Cloudinary not configured - using local backup system');
    return { imageMap: new Map(), skipped: 'no-config' };
  }

  console.log('☁️ Starting Cloudinary sync...');
  
  const imageMap = new Map();
  const processedUrls = new Set();

  // Extract all images from Airtable data
  const extractImages = (record, recordType) => {
    const imageFields = [
      "תמונה (Image)", "Image", "תמונה", "Picture", "Photo", 
      "תמונה של המנה", "Event Photos"
    ];

    for (const field of imageFields) {
      if (record[field]) {
        const images = Array.isArray(record[field]) ? record[field] : [record[field]];
        
        for (const img of images) {
          const imageUrl = img.url || img;
          if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('http') && !processedUrls.has(imageUrl)) {
            processedUrls.add(imageUrl);
            
            const publicId = generatePublicId(imageUrl);
            imageMap.set(imageUrl, {
              publicId,
              recordType,
              recordId: record.id,
              processed: false
            });
          }
        }
      }
    }
  };

  // Process all data types
  if (data.events) data.events.forEach(record => extractImages(record, 'events'));
  if (data.packages) data.packages.forEach(record => extractImages(record, 'packages'));
  if (data.dishes) data.dishes.forEach(record => extractImages(record, 'dishes'));
  if (data.gallery) data.gallery.forEach(record => extractImages(record, 'gallery'));
  if (data.hero) data.hero.forEach(record => extractImages(record, 'hero'));
  if (data.about) data.about.forEach(record => extractImages(record, 'about'));

  console.log(`📸 Found ${imageMap.size} unique images to process`);

  // Process images in batches to avoid rate limits
  const batchSize = 5;
  const imagesToProcess = Array.from(imageMap.entries());
  const results = { uploaded: 0, skipped: 0, failed: 0 };

  for (let i = 0; i < imagesToProcess.length; i += batchSize) {
    const batch = imagesToProcess.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async ([originalUrl, info]) => {
      // Check if already exists in Cloudinary
      const exists = await imageExistsInCloudinary(info.publicId);
      
      if (exists) {
        // Use existing Cloudinary URL
        const cloudinaryUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/w_800,h_600,c_fill,f_auto,q_auto/${info.publicId}`;
        imageMap.set(originalUrl, cloudinaryUrl);
        results.skipped++;
        console.log(`✅ Using existing: ${info.publicId}`);
        return { success: true, skipped: true };
      } else {
        // Upload to Cloudinary
        const uploadResult = await uploadToCloudinary(originalUrl, info.publicId);
        
        if (uploadResult.success) {
          // Generate optimized URL
          const optimizedUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/w_800,h_600,c_fill,f_auto,q_auto/${uploadResult.publicId}`;
          imageMap.set(originalUrl, optimizedUrl);
          results.uploaded++;
          console.log(`🚀 Uploaded: ${info.publicId}`);
          return { success: true, uploaded: true };
        } else {
          // Keep original URL as fallback
          imageMap.set(originalUrl, uploadResult.fallbackUrl);
          results.failed++;
          return { success: false, error: uploadResult.error };
        }
      }
    });

    await Promise.all(batchPromises);
    
    // Small delay between batches to be respectful to APIs
    if (i + batchSize < imagesToProcess.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`☁️ Cloudinary sync complete:`);
  console.log(`   🚀 Uploaded: ${results.uploaded} new images`);
  console.log(`   ✅ Existing: ${results.skipped} images`);
  console.log(`   ⚠️ Failed: ${results.failed} images`);

  return { imageMap, ...results };
}

// Get optimized image URL with responsive sizing
export function getOptimizedImageUrl(originalUrl, imageMap, options = {}) {
  const {
    width = 800,
    height = 600,
    crop = 'fill',
    quality = 'auto',
    format = 'auto'
  } = options;

  // Check if we have a Cloudinary URL
  if (imageMap && imageMap.has(originalUrl)) {
    const cloudinaryUrl = imageMap.get(originalUrl);
    if (cloudinaryUrl.includes('cloudinary.com')) {
      // Extract public_id and create optimized URL
      const publicIdMatch = cloudinaryUrl.match(/\/image\/upload\/.*?\/(.*?)$/);
      if (publicIdMatch) {
        const publicId = publicIdMatch[1];
        return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/w_${width},h_${height},c_${crop},f_${format},q_${quality}/${publicId}`;
      }
    }
    return cloudinaryUrl;
  }

  // Fallback to original URL
  return originalUrl;
}

// Generate responsive image srcset for better performance
export function generateResponsiveSrcSet(originalUrl, imageMap) {
  const baseUrl = getOptimizedImageUrl(originalUrl, imageMap);
  
  if (!baseUrl.includes('cloudinary.com')) {
    return baseUrl; // Can't generate responsive for non-Cloudinary URLs
  }

  const sizes = [
    { width: 400, suffix: '400w' },
    { width: 800, suffix: '800w' },
    { width: 1200, suffix: '1200w' },
    { width: 1600, suffix: '1600w' }
  ];

  const srcset = sizes.map(size => {
    const responsiveUrl = getOptimizedImageUrl(originalUrl, imageMap, { 
      width: size.width, 
      height: Math.round(size.width * 0.75) // 4:3 aspect ratio
    });
    return `${responsiveUrl} ${size.suffix}`;
  }).join(', ');

  return srcset;
}
