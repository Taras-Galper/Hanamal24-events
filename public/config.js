// Configuration for contact form webhooks
// Update these URLs as needed

const CONFIG = {
  // Make.com webhook URL (recommended)
  // Get this from your Make.com scenario webhook module
  MAKECOM_WEBHOOK: 'https://hook.eu1.make.com/YOUR_WEBHOOK_ID_HERE',
  
  // Vercel serverless function (fallback)
  VERCEL_FUNCTION: 'https://hanamal24-events.vercel.app/api/submit-lead',
  
  // Local development (fallback)
  LOCAL_FUNCTION: '/api/submit-lead',
  
  // Enable/disable different submission methods
  ENABLE_MAKECOM: true,
  ENABLE_VERCEL: true,
  ENABLE_LOCAL: true
};

// Export for use in contact form
window.CONTACT_FORM_CONFIG = CONFIG;
