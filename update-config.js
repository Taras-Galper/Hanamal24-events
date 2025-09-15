#!/usr/bin/env node

// Script to update the Make.com webhook configuration
// Usage: node update-config.js YOUR_WEBHOOK_URL

const fs = require('fs');
const path = require('path');

const webhookUrl = process.argv[2];

if (!webhookUrl) {
    console.log('❌ Please provide your Make.com webhook URL');
    console.log('Usage: node update-config.js https://hook.eu1.make.com/YOUR_WEBHOOK_ID');
    process.exit(1);
}

if (!webhookUrl.includes('hook.eu1.make.com')) {
    console.log('❌ Invalid webhook URL. Make sure it starts with https://hook.eu1.make.com/');
    process.exit(1);
}

const configPath = path.join(__dirname, 'public', 'config.js');

try {
    let configContent = fs.readFileSync(configPath, 'utf8');
    
    // Update the webhook URL
    configContent = configContent.replace(
        /MAKECOM_WEBHOOK: 'https:\/\/hook\.eu1\.make\.com\/YOUR_WEBHOOK_ID_HERE'/,
        `MAKECOM_WEBHOOK: '${webhookUrl}'`
    );
    
    // Enable Make.com
    configContent = configContent.replace(
        /ENABLE_MAKECOM: false/,
        'ENABLE_MAKECOM: true'
    );
    
    fs.writeFileSync(configPath, configContent);
    
    console.log('✅ Configuration updated successfully!');
    console.log(`   Webhook URL: ${webhookUrl}`);
    console.log('   Make.com enabled: true');
    console.log('');
    console.log('Next steps:');
    console.log('1. Run: node scripts/build.js');
    console.log('2. Run: Copy-Item dist\\* . -Recurse -Force');
    console.log('3. Run: git add . && git commit -m "Enable Make.com webhook" && git push origin main');
    
} catch (error) {
    console.log('❌ Error updating configuration:', error.message);
    process.exit(1);
}
