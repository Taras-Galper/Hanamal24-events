// Airtable Webhook Handler
// This file handles automatic updates when Airtable data changes

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Simple webhook server to receive Airtable notifications
const PORT = process.env.PORT || 3000;

// Webhook endpoint that Airtable will call
app.post('/webhook/airtable', async (req, res) => {
  try {
    console.log('🔄 Airtable webhook received - rebuilding site...');
    
    // Trigger GitHub Actions workflow
    const { stdout, stderr } = await execAsync('gh workflow run "Build Site"');
    
    console.log('✅ GitHub Actions triggered successfully');
    res.status(200).json({ success: true, message: 'Site rebuild triggered' });
    
  } catch (error) {
    console.error('❌ Error triggering rebuild:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Webhook server running on port ${PORT}`);
  console.log(`📡 Webhook URL: https://your-domain.com/webhook/airtable`);
});
