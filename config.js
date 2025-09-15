// Configuration for contact form webhooks
// Update these URLs as needed

const CONFIG = {
  // Make.com webhook URL (recommended)
  // Get this from your Make.com scenario webhook module
  // Replace with your actual Make.com webhook URL
  MAKECOM_WEBHOOK: 'https://hook.eu1.make.com/YOUR_WEBHOOK_ID_HERE',
  
  // Vercel serverless function (fallback)
  VERCEL_FUNCTION: 'https://hanamal24-events.vercel.app/api/submit-lead',
  
  // Local development (fallback)
  LOCAL_FUNCTION: '/api/submit-lead',
  
  // Enable/disable different submission methods
  ENABLE_MAKECOM: false, // Disabled until Make.com webhook is configured
  ENABLE_VERCEL: false,  // Disabled due to CORS issues
  ENABLE_LOCAL: false    // Disabled - GitHub Pages doesn't support POST
};

// Export for use in contact form
window.CONTACT_FORM_CONFIG = CONFIG;
