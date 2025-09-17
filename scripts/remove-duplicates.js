// Remove duplicate images based on content hash
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imagesDir = path.join(__dirname, '..', 'dist', 'images');
const publicImagesDir = path.join(__dirname, '..', 'public', 'images');

// Calculate file hash
function getFileHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(fileBuffer).digest('hex');
}

// Remove duplicates
function removeDuplicates() {
  console.log('🔍 Scanning for duplicate images...');
  
  const files = fs.readdirSync(imagesDir);
  const fileHashes = new Map();
  const duplicates = [];
  
  // Group files by content hash
  for (const file of files) {
    if (file.endsWith('.jpg')) {
      const filePath = path.join(imagesDir, file);
      const hash = getFileHash(filePath);
      
      if (fileHashes.has(hash)) {
        // This is a duplicate
        duplicates.push({
          file,
          hash,
          original: fileHashes.get(hash)
        });
      } else {
        fileHashes.set(hash, file);
      }
    }
  }
  
  console.log(`📊 Found ${fileHashes.size} unique images`);
  console.log(`🗑️ Found ${duplicates.length} duplicate files`);
  
  // Remove duplicates (keep the first occurrence)
  let removedCount = 0;
  for (const duplicate of duplicates) {
    const filePath = path.join(imagesDir, duplicate.file);
    const publicPath = path.join(publicImagesDir, duplicate.file);
    
    try {
      fs.unlinkSync(filePath);
      if (fs.existsSync(publicPath)) {
        fs.unlinkSync(publicPath);
      }
      console.log(`🗑️ Removed duplicate: ${duplicate.file}`);
      removedCount++;
    } catch (error) {
      console.warn(`⚠️ Could not remove ${duplicate.file}: ${error.message}`);
    }
  }
  
  console.log(`✅ Removed ${removedCount} duplicate files`);
  console.log(`📊 Final count: ${fileHashes.size} unique images`);
  
  return { removed: removedCount, unique: fileHashes.size };
}

// Run the cleanup
const result = removeDuplicates();
console.log('🎉 Duplicate removal complete!');
