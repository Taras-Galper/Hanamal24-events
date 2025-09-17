// Image Registry - Persistent tracking of processed images
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const registryPath = path.join(__dirname, '..', 'dist', 'image-registry.json');

// Load existing registry
function loadRegistry() {
  if (fs.existsSync(registryPath)) {
    try {
      const data = fs.readFileSync(registryPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.warn('⚠️ Could not load image registry:', error.message);
      return {};
    }
  }
  return {};
}

// Save registry
function saveRegistry(registry) {
  try {
    fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
  } catch (error) {
    console.warn('⚠️ Could not save image registry:', error.message);
  }
}

// Generate consistent filename for URL
function generateFilename(url) {
  try {
    const hash = crypto.createHash('md5').update(url).digest('hex').substring(0, 12);
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const ext = path.extname(pathname) || '.jpg';
    return `${hash}${ext}`;
  } catch (error) {
    return `img_${Date.now()}.jpg`;
  }
}

// Check if URL has been processed
export function isUrlProcessed(url) {
  const registry = loadRegistry();
  const isProcessed = registry[url] !== undefined;
  if (!isProcessed) {
    console.log(`🔍 URL not in registry: ${url.substring(0, 50)}...`);
  } else {
    console.log(`✅ URL found in registry: ${url.substring(0, 50)}...`);
  }
  return isProcessed;
}

// Register a processed URL
export function registerUrl(url, filename) {
  const registry = loadRegistry();
  registry[url] = {
    filename,
    processedAt: new Date().toISOString(),
    localPath: `/images/${filename}`
  };
  saveRegistry(registry);
}

// Get filename for URL
export function getFilenameForUrl(url) {
  const registry = loadRegistry();
  return registry[url]?.filename;
}

// Get local path for URL
export function getLocalPathForUrl(url) {
  const registry = loadRegistry();
  return registry[url]?.localPath;
}

// Clean up registry (remove entries for URLs that no longer exist in data)
export function cleanupRegistry(currentUrls) {
  const registry = loadRegistry();
  const currentUrlSet = new Set(currentUrls);
  
  let removedCount = 0;
  for (const url in registry) {
    if (!currentUrlSet.has(url)) {
      delete registry[url];
      removedCount++;
    }
  }
  
  if (removedCount > 0) {
    saveRegistry(registry);
    console.log(`🧹 Cleaned up ${removedCount} unused registry entries`);
  }
  
  return removedCount;
}
