// Content-based image deduplication
// This prevents duplicates by checking file content, not just filenames
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imagesDir = path.join(__dirname, '..', 'dist', 'images');
const publicImagesDir = path.join(__dirname, '..', 'public', 'images');

// Create content hash map
function createContentHashMap() {
  const contentMap = new Map(); // contentHash -> filename
  
  if (!fs.existsSync(imagesDir)) {
    return contentMap;
  }
  
  const files = fs.readdirSync(imagesDir).filter(file => 
    file.endsWith('.jpg') || file.endsWith('.png') || file.endsWith('.jpeg') || file.endsWith('.gif') || file.endsWith('.webp')
  );
  
  for (const file of files) {
    const filePath = path.join(imagesDir, file);
    try {
      const content = fs.readFileSync(filePath);
      const contentHash = crypto.createHash('md5').update(content).digest('hex');
      contentMap.set(contentHash, file);
    } catch (error) {
      console.warn(`⚠️ Error reading ${file}: ${error.message}`);
    }
  }
  
  return contentMap;
}

// Check if image content already exists
export function imageContentExists(imageUrl) {
  const contentMap = createContentHashMap();
  
  // For now, we can't check content without downloading
  // This is a placeholder for future enhancement
  return false;
}

// Get existing filename for content
export function getExistingFilenameForContent(imageUrl) {
  const contentMap = createContentHashMap();
  
  // For now, we can't check content without downloading
  // This is a placeholder for future enhancement
  return null;
}

// Main function to clean up duplicates
export function cleanupContentDuplicates() {
  console.log('🔍 Scanning for content-based duplicates...');
  
  const contentMap = new Map(); // contentHash -> [filenames]
  const files = fs.readdirSync(imagesDir).filter(file => 
    file.endsWith('.jpg') || file.endsWith('.png') || file.endsWith('.jpeg') || file.endsWith('.gif') || file.endsWith('.webp')
  );
  
  // Group files by content hash
  for (const file of files) {
    const filePath = path.join(imagesDir, file);
    try {
      const content = fs.readFileSync(filePath);
      const contentHash = crypto.createHash('md5').update(content).digest('hex');
      
      if (!contentMap.has(contentHash)) {
        contentMap.set(contentHash, []);
      }
      contentMap.get(contentHash).push(file);
    } catch (error) {
      console.warn(`⚠️ Error reading ${file}: ${error.message}`);
    }
  }
  
  // Find and remove duplicates
  let removedCount = 0;
  for (const [contentHash, filenames] of contentMap) {
    if (filenames.length > 1) {
      // Keep the first file, remove the rest
      const keepFile = filenames[0];
      const removeFiles = filenames.slice(1);
      
      console.log(`📸 Content hash ${contentHash.substring(0, 8)}... has ${filenames.length} files:`);
      console.log(`  ✅ Keeping: ${keepFile}`);
      
      for (const file of removeFiles) {
        const filePath = path.join(imagesDir, file);
        const publicPath = path.join(publicImagesDir, file);
        
        try {
          fs.unlinkSync(filePath);
          if (fs.existsSync(publicPath)) {
            fs.unlinkSync(publicPath);
          }
          console.log(`  🗑️ Removed: ${file}`);
          removedCount++;
        } catch (error) {
          console.warn(`  ⚠️ Error removing ${file}: ${error.message}`);
        }
      }
    }
  }
  
  console.log(`✅ Removed ${removedCount} duplicate files`);
  return removedCount;
}

// Run cleanup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupContentDuplicates();
}
