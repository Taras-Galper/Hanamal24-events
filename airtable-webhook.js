// Airtable Webhook Integration
// This script can be deployed to Vercel/Netlify to handle Airtable webhooks

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔄 Airtable webhook received:', req.body);
    
    // Trigger GitHub Actions workflow using GitHub API
    const response = await fetch('https://api.github.com/repos/Taras-Galper/Hanamal24-events/actions/workflows/build.yml/dispatches', {
      method: 'POST',
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ref: 'main',
        inputs: {
          reason: 'Airtable webhook triggered'
        }
      })
    });

    if (response.ok) {
      console.log('✅ GitHub Actions triggered successfully');
      res.status(200).json({ 
        success: true, 
        message: 'Site rebuild triggered',
        timestamp: new Date().toISOString()
      });
    } else {
      throw new Error(`GitHub API error: ${response.status}`);
    }

  } catch (error) {
    console.error('❌ Error triggering rebuild:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
