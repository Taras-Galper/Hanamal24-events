// Enhanced Airtable Webhook Handler
// Triggers both Render.com and GitHub Actions rebuilds

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔄 Airtable webhook received:', req.body);
    
    const results = {
      github: null,
      render: null,
      timestamp: new Date().toISOString()
    };

    // 1. Trigger GitHub Actions
    try {
      const githubResponse = await fetch('https://api.github.com/repos/Taras-Galper/Hanamal24-events/actions/workflows/build.yml/dispatches', {
        method: 'POST',
        headers: {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ref: 'main',
          inputs: {
            reason: 'Airtable button triggered rebuild'
          }
        })
      });

      results.github = {
        success: githubResponse.ok,
        status: githubResponse.status,
        message: githubResponse.ok ? 'GitHub Actions triggered' : 'GitHub Actions failed'
      };
    } catch (error) {
      results.github = { success: false, error: error.message };
    }

    // 2. Trigger Render.com deployment
    try {
      const renderResponse = await fetch('https://api.render.com/deploy/srv-d1rnnkp5pdvs73ebjcc0?key=h0hONC2Ttt8', {
        method: 'POST'
      });

      results.render = {
        success: renderResponse.ok,
        status: renderResponse.status,
        message: renderResponse.ok ? 'Render.com deployment triggered' : 'Render.com deployment failed'
      };
    } catch (error) {
      results.render = { success: false, error: error.message };
    }

    // 3. Send success response
    const allSuccessful = results.github.success && results.render.success;
    
    res.status(allSuccessful ? 200 : 207).json({
      success: allSuccessful,
      message: allSuccessful ? 'Both platforms triggered successfully' : 'Partial success',
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in webhook handler:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
