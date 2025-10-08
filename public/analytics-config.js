// Analytics Configuration
// Update these values with your actual tracking IDs

const ANALYTICS_CONFIG = {
  // Google Analytics 4 Measurement ID
  // Get this from: https://analytics.google.com/
  GA4_MEASUREMENT_ID: 'G-WYN0CWD8ZC', // Your actual GA4 Measurement ID
  
  // Google Tag Manager ID (optional)
  // Get this from: https://tagmanager.google.com/
  GTM_ID: 'GTM-XXXXXXX', // Replace with your GTM ID
  
  // Enable/disable different analytics
  ENABLE_GA4: true,        // Google Analytics 4
  ENABLE_GTM: false,       // Google Tag Manager
  ENABLE_CUSTOM_EVENTS: true, // Custom event tracking
  
  // Custom event settings
  TRACK_FORM_SUBMISSIONS: true,
  TRACK_PACKAGE_VIEWS: true,
  TRACK_GALLERY_VIEWS: true,
  TRACK_PHONE_CLICKS: true,
  TRACK_EMAIL_CLICKS: true,
  
  // Debug mode (set to false in production)
  DEBUG: false
};

// Export for use in analytics.js
window.ANALYTICS_CONFIG = ANALYTICS_CONFIG;
