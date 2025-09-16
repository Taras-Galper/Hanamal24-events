// Image Health Check Script
// Checks if Airtable images are still accessible

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import { promisify } from 'util';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Check if image URL is accessible
async function checkImageUrl(url) {
  return new Promise((resolve) => {
    const request = https.get(url, (response) => {
      resolve({
        url,
        status: response.statusCode,
        accessible: response.statusCode === 200,
        contentLength: response.headers['content-length']
      });
    });
    
    request.on('error', (error) => {
      resolve({
        url,
        status: 'ERROR',
        accessible: false,
        error: error.message
      });
    });
    
    request.setTimeout(10000, () => {
      request.destroy();
      resolve({
        url,
        status: 'TIMEOUT',
        accessible: false,
        error: 'Request timeout'
      });
    });
  });
}

// Check all images in the built site
async function checkAllImages() {
  const distDir = path.join(__dirname, '..', 'dist');
  const imageMapFile = path.join(distDir, 'image-map.json');
  
  if (!fs.existsSync(imageMapFile)) {
    console.log('❌ No image map found. Run build first.');
    return;
  }
  
  const imageMap = JSON.parse(fs.readFileSync(imageMapFile, 'utf8'));
  const urls = Object.keys(imageMap);
  
  console.log(`🔍 Checking ${urls.length} images...`);
  
  const results = await Promise.all(urls.map(checkImageUrl));
  
  const accessible = results.filter(r => r.accessible);
  const broken = results.filter(r => !r.accessible);
  
  console.log(`\n📊 Image Health Report:`);
  console.log(`✅ Accessible: ${accessible.length}`);
  console.log(`❌ Broken: ${broken.length}`);
  
  if (broken.length > 0) {
    console.log(`\n🚨 Broken Images:`);
    broken.forEach(result => {
      console.log(`  - ${result.url}`);
      console.log(`    Status: ${result.status}`);
      if (result.error) console.log(`    Error: ${result.error}`);
    });
  }
  
  return { accessible, broken };
}

// Run the check
if (import.meta.url === `file://${process.argv[1]}`) {
  checkAllImages().then(results => {
    if (results.broken.length > 0) {
      process.exit(1);
    }
  });
}

export { checkImageUrl, checkAllImages };
