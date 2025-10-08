// Analytics Tracking Script for Hanamal 24
// Tracks user interactions, form submissions, and business metrics

class AnalyticsTracker {
  constructor() {
    this.config = window.ANALYTICS_CONFIG || {};
    this.isInitialized = false;
    
    if (this.config.ENABLE_GA4) {
      this.initGA4();
    }
    
    if (this.config.ENABLE_GTM) {
      this.initGTM();
    }
    
    if (this.config.ENABLE_CUSTOM_EVENTS) {
      this.initCustomEvents();
    }
  }

  initGA4() {
    if (!this.config.GA4_MEASUREMENT_ID || this.config.GA4_MEASUREMENT_ID === 'G-XXXXXXXXXX') {
      console.warn('GA4 Measurement ID not configured. Please update analytics-config.js');
      return;
    }

    // Load Google Analytics 4
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.config.GA4_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', this.config.GA4_MEASUREMENT_ID, {
      page_title: document.title,
      page_location: window.location.href
    });

    this.isInitialized = true;
    this.log('GA4 initialized');
  }

  initGTM() {
    if (!this.config.GTM_ID || this.config.GTM_ID === 'GTM-XXXXXXX') {
      console.warn('GTM ID not configured. Please update analytics-config.js');
      return;
    }

    // Google Tag Manager
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer',this.config.GTM_ID);

    this.log('GTM initialized');
  }

  initCustomEvents() {
    // Track form submissions
    if (this.config.TRACK_FORM_SUBMISSIONS) {
      this.trackFormSubmissions();
    }

    // Track package views
    if (this.config.TRACK_PACKAGE_VIEWS) {
      this.trackPackageViews();
    }

    // Track gallery interactions
    if (this.config.TRACK_GALLERY_VIEWS) {
      this.trackGalleryViews();
    }

    // Track phone clicks
    if (this.config.TRACK_PHONE_CLICKS) {
      this.trackPhoneClicks();
    }

    // Track email clicks
    if (this.config.TRACK_EMAIL_CLICKS) {
      this.trackEmailClicks();
    }

    // Track navigation clicks
    this.trackNavigation();

    // Track scroll depth
    this.trackScrollDepth();

    this.log('Custom events initialized');
  }

  trackFormSubmissions() {
    // Listen for form submission events
    document.addEventListener('formSubmitted', (event) => {
      this.trackEvent('form_submission', {
        event_category: 'engagement',
        event_label: 'contact_form',
        value: 1
      });
    });

    // Track form validation errors
    document.addEventListener('formValidationError', (event) => {
      this.trackEvent('form_validation_error', {
        event_category: 'engagement',
        event_label: event.detail.field || 'unknown',
        value: 1
      });
    });
  }

  trackPackageViews() {
    // Track package modal opens
    document.addEventListener('packageModalOpened', (event) => {
      this.trackEvent('package_view', {
        event_category: 'engagement',
        event_label: event.detail.packageName || 'unknown',
        value: 1
      });
    });

    // Track package CTA clicks
    document.addEventListener('packageCTAClicked', (event) => {
      this.trackEvent('package_cta_click', {
        event_category: 'conversion',
        event_label: event.detail.packageName || 'unknown',
        value: 1
      });
    });
  }

  trackGalleryViews() {
    // Track gallery image opens
    document.addEventListener('galleryImageOpened', (event) => {
      this.trackEvent('gallery_view', {
        event_category: 'engagement',
        event_label: event.detail.imageTitle || 'unknown',
        value: 1
      });
    });

    // Track gallery navigation
    document.addEventListener('galleryNavigation', (event) => {
      this.trackEvent('gallery_navigation', {
        event_category: 'engagement',
        event_label: event.detail.direction || 'unknown',
        value: 1
      });
    });
  }

  trackPhoneClicks() {
    // Track phone number clicks
    document.addEventListener('click', (event) => {
      if (event.target.matches('a[href^="tel:"]')) {
        this.trackEvent('phone_click', {
          event_category: 'contact',
          event_label: 'phone_number',
          value: 1
        });
      }
    });
  }

  trackEmailClicks() {
    // Track email clicks
    document.addEventListener('click', (event) => {
      if (event.target.matches('a[href^="mailto:"]')) {
        this.trackEvent('email_click', {
          event_category: 'contact',
          event_label: 'email_address',
          value: 1
        });
      }
    });
  }

  trackNavigation() {
    // Track navigation clicks
    document.addEventListener('click', (event) => {
      if (event.target.matches('nav a, .nav a')) {
        this.trackEvent('navigation_click', {
          event_category: 'navigation',
          event_label: event.target.textContent.trim(),
          value: 1
        });
      }
    });

    // Track CTA button clicks
    document.addEventListener('click', (event) => {
      if (event.target.matches('.book-btn, .hero-btn-primary, .hero-btn-secondary, .submit-btn')) {
        this.trackEvent('cta_click', {
          event_category: 'conversion',
          event_label: event.target.textContent.trim(),
          value: 1
        });
      }
    });
  }

  trackScrollDepth() {
    let maxScroll = 0;
    const thresholds = [25, 50, 75, 90, 100];
    const trackedThresholds = new Set();

    window.addEventListener('scroll', () => {
      const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
      
      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;
        
        thresholds.forEach(threshold => {
          if (scrollPercent >= threshold && !trackedThresholds.has(threshold)) {
            trackedThresholds.add(threshold);
            this.trackEvent('scroll_depth', {
              event_category: 'engagement',
              event_label: `${threshold}%`,
              value: threshold
            });
          }
        });
      }
    });
  }

  // Generic event tracking method
  trackEvent(eventName, parameters = {}) {
    if (!this.isInitialized && this.config.ENABLE_GA4) {
      console.warn('Analytics not initialized yet');
      return;
    }

    // Google Analytics 4
    if (this.config.ENABLE_GA4 && window.gtag) {
      window.gtag('event', eventName, parameters);
    }

    // Custom analytics (for debugging or additional tracking)
    if (this.config.DEBUG) {
      console.log('Analytics Event:', eventName, parameters);
    }

    // Store in localStorage for debugging
    this.storeEvent(eventName, parameters);
  }

  // Store events locally for debugging
  storeEvent(eventName, parameters) {
    try {
      const events = JSON.parse(localStorage.getItem('hanamal24_analytics') || '[]');
      events.push({
        timestamp: new Date().toISOString(),
        event: eventName,
        parameters: parameters,
        url: window.location.href,
        userAgent: navigator.userAgent
      });
      
      // Keep only last 100 events
      if (events.length > 100) {
        events.splice(0, events.length - 100);
      }
      
      localStorage.setItem('hanamal24_analytics', JSON.stringify(events));
    } catch (error) {
      console.error('Failed to store analytics event:', error);
    }
  }

  // Page view tracking
  trackPageView(pageTitle, pagePath) {
    if (this.config.ENABLE_GA4 && window.gtag) {
      window.gtag('config', this.config.GA4_MEASUREMENT_ID, {
        page_title: pageTitle,
        page_location: pagePath
      });
    }
  }

  // Export analytics data
  exportAnalytics() {
    try {
      const events = JSON.parse(localStorage.getItem('hanamal24_analytics') || '[]');
      const dataStr = JSON.stringify(events, null, 2);
      const dataBlob = new Blob([dataStr], {type: 'application/json'});
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `hanamal24_analytics_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return events;
    } catch (error) {
      console.error('Failed to export analytics:', error);
      return [];
    }
  }

  log(message) {
    if (this.config.DEBUG) {
      console.log(`[Analytics] ${message}`);
    }
  }
}

// Initialize analytics when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.analytics = new AnalyticsTracker();
});

// Export functions for global use
window.exportAnalytics = () => window.analytics?.exportAnalytics();
window.trackEvent = (eventName, parameters) => window.analytics?.trackEvent(eventName, parameters);
