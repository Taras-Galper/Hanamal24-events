// Simple script to trigger site updates
// Run this when you want to update the site with latest Airtable data

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function triggerUpdate() {
  try {
    console.log('🔄 Triggering site update...');
    
    // Option 1: Direct rebuild
    console.log('Building site locally...');
    await execAsync('node scripts/build.js');
    
    // Option 2: Push to trigger GitHub Actions
    console.log('Pushing changes to trigger GitHub Actions...');
    await execAsync('git add .');
    await execAsync('git commit -m "Auto-update: Airtable data refresh"');
    await execAsync('git push origin main');
    
    console.log('✅ Site update triggered successfully!');
    console.log('🌐 Check your site in 2-3 minutes: https://taras-galper.github.io/Hanamal24-events');
    
  } catch (error) {
    console.error('❌ Error updating site:', error);
  }
}

// Run the update
triggerUpdate();
