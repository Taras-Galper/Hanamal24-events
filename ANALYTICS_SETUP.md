# 📊 Analytics Setup Guide for Hanamal 24

## 🎯 **What's Included**

Your site now has comprehensive analytics tracking:

- ✅ **Google Analytics 4** integration
- ✅ **Contact form** submission tracking
- ✅ **Package views** and CTA clicks
- ✅ **Gallery interactions** and navigation
- ✅ **Phone and email** click tracking
- ✅ **Scroll depth** tracking
- ✅ **Navigation** and CTA button clicks
- ✅ **Custom events** for business metrics

## 🚀 **Quick Setup (5 minutes)**

### Step 1: Get Google Analytics 4 ID

1. Go to [Google Analytics](https://analytics.google.com/)
2. Create a new property for your website
3. Get your **Measurement ID** (looks like `G-XXXXXXXXXX`)

### Step 2: Update Configuration

1. Open `public/analytics-config.js`
2. Replace `G-XXXXXXXXXX` with your actual Measurement ID:
   ```javascript
   GA4_MEASUREMENT_ID: 'G-YOUR-ACTUAL-ID-HERE',
   ```

### Step 3: Deploy

```bash
npm run deploy
git add .
git commit -m "Add analytics tracking"
git push origin main
```

## 📈 **What Gets Tracked**

### **Page Views**
- Homepage visits
- Package page views
- Menu page views
- Event page views

### **User Interactions**
- Contact form submissions
- Form validation errors
- Package modal opens
- Package CTA clicks ("הזמן עכשיו")
- Gallery image views
- Gallery navigation (next/previous)
- Phone number clicks
- Email address clicks
- Navigation menu clicks
- Scroll depth (25%, 50%, 75%, 90%, 100%)

### **Business Metrics**
- Lead generation (form submissions)
- Package interest (modal views)
- Gallery engagement
- Contact attempts (phone/email clicks)

## 🔧 **Advanced Configuration**

### **Enable Debug Mode**
Set `DEBUG: true` in `analytics-config.js` to see events in browser console.

### **Disable Specific Tracking**
```javascript
const ANALYTICS_CONFIG = {
  TRACK_FORM_SUBMISSIONS: false,  // Disable form tracking
  TRACK_PACKAGE_VIEWS: false,     // Disable package tracking
  TRACK_GALLERY_VIEWS: false,     // Disable gallery tracking
  // ... other settings
};
```

### **Custom Events**
You can track custom events from anywhere:
```javascript
// Track a custom event
window.trackEvent('custom_event', {
  event_category: 'engagement',
  event_label: 'special_action',
  value: 1
});
```

## 📊 **Viewing Analytics Data**

### **Google Analytics Dashboard**
1. Go to [Google Analytics](https://analytics.google.com/)
2. Select your property
3. View real-time and historical data

### **Export Local Data**
```javascript
// In browser console:
window.exportAnalytics();
```

### **Admin Panel**
Visit `/admin/` to see:
- Contact form submissions
- Analytics events (if debug mode is enabled)

## 🎯 **Key Metrics to Monitor**

### **Conversion Metrics**
- **Form Submissions**: How many leads are generated
- **Package CTA Clicks**: Interest in specific packages
- **Phone/Email Clicks**: Direct contact attempts

### **Engagement Metrics**
- **Gallery Views**: How many images are viewed
- **Scroll Depth**: How engaged users are
- **Package Modal Views**: Interest in packages

### **Traffic Metrics**
- **Page Views**: Most popular pages
- **Navigation Clicks**: User journey through site
- **Bounce Rate**: How many users leave quickly

## 🔍 **Troubleshooting**

### **Analytics Not Working?**
1. Check browser console for errors
2. Verify Measurement ID is correct
3. Ensure `analytics-config.js` is loaded
4. Check if ad blockers are blocking GA

### **Events Not Showing?**
1. Enable debug mode: `DEBUG: true`
2. Check browser console for event logs
3. Verify events are being dispatched

### **Data Not in Google Analytics?**
1. Wait 24-48 hours for data to appear
2. Check real-time reports for immediate data
3. Verify Measurement ID is correct

## 📱 **Mobile Analytics**

All tracking works on mobile devices:
- Touch events are tracked
- Mobile-specific interactions
- Responsive design metrics

## 🔒 **Privacy & GDPR**

The analytics implementation:
- ✅ Respects user privacy
- ✅ No personal data collection
- ✅ Anonymous tracking only
- ✅ Can be disabled by users

## 🚀 **Next Steps**

1. **Set up Google Analytics** with your Measurement ID
2. **Deploy the changes** to your live site
3. **Monitor the data** for insights
4. **Optimize based on metrics** to improve conversions

## 📞 **Need Help?**

- Check the browser console for error messages
- Verify all configuration files are correct
- Test with debug mode enabled
- Contact your development team for support

---

**Your restaurant website now has professional analytics tracking! 📊✨**
