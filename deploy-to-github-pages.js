#!/usr/bin/env node

// Simple deployment script for GitHub Pages
// This script builds the site and prepares it for GitHub Pages deployment

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🚀 Starting GitHub Pages deployment...');

try {
  // Step 1: Build the site
  console.log('📦 Building the site...');
  execSync('npm run build', { stdio: 'inherit' });

  // Step 2: Check if dist folder exists
  const distPath = path.join(__dirname, 'dist');
  if (!fs.existsSync(distPath)) {
    throw new Error('Build failed - dist folder not found');
  }

  // Step 3: Copy dist contents to root for GitHub Pages
  console.log('📁 Preparing files for GitHub Pages...');
  
  // List all files in dist
  const distFiles = fs.readdirSync(distPath, { withFileTypes: true });
  
  // Copy each file to root
  distFiles.forEach(file => {
    const srcPath = path.join(distPath, file.name);
    const destPath = path.join(__dirname, file.name);
    
    if (file.isDirectory()) {
      if (fs.existsSync(destPath)) {
        fs.rmSync(destPath, { recursive: true, force: true });
      }
      fs.cpSync(srcPath, destPath, { recursive: true });
      console.log(`📁 Copied directory: ${file.name}`);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`📄 Copied file: ${file.name}`);
    }
  });

  // Step 4: Create .nojekyll file for GitHub Pages
  fs.writeFileSync(path.join(__dirname, '.nojekyll'), '');
  console.log('📄 Created .nojekyll file');

  // Step 5: Show next steps
  console.log('\n✅ Deployment preparation complete!');
  console.log('\n📋 Next steps:');
  console.log('1. git add .');
  console.log('2. git commit -m "Deploy to GitHub Pages"');
  console.log('3. git push origin main');
  console.log('\n🌐 Your site will be available at:');
  console.log('https://taras-galper.github.io/Hanamal24-events');

} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}
