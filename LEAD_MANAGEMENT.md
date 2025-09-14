# Lead Management System for Hanamal 24

## Overview
This system handles customer leads from the contact form and submits them to your Airtable leads table. The system includes multiple fallback methods to ensure no leads are lost.

## Airtable Integration

### Table Structure
The system submits leads to: `https://airtable.com/appeW41fJAbVdeWoU/tblTMBjuWZ8BATqTj/viwApK9uDE3MjX2iU?blocks=hide`

### Required Fields
- **שם מלא** (Full Name) - Required
- **אימייל** (Email) - Required  
- **טלפון** (Phone) - Required
- **סוג אירוע** (Event Type) - Required
- **מספר אורחים** (Guest Count) - Required
- **תאריך האירוע** (Event Date) - Required
- **הודעה נוספת** (Additional Message) - Optional
- **תאריך יצירת הליד** (Lead Creation Date) - Auto-generated
- **סטטוס** (Status) - Auto-set to "חדש" (New)
- **מקור** (Source) - Auto-set to "אתר אינטרנט" (Website)

## Implementation Methods

### Method 1: Serverless Function (Recommended)
**File:** `api/submit-lead.js`

**Deployment Options:**
- **Vercel:** Deploy to Vercel with environment variable `AIRTABLE_TOKEN`
- **Netlify Functions:** Deploy to Netlify with environment variable `AIRTABLE_TOKEN`
- **AWS Lambda:** Deploy as Lambda function with environment variable `AIRTABLE_TOKEN`

**Setup:**
1. Deploy the `api/submit-lead.js` file to your serverless platform
2. Set the `AIRTABLE_TOKEN` environment variable with your Airtable Personal Access Token
3. The form will automatically submit to `/api/submit-lead`

### Method 2: Email Fallback
If the serverless function fails, the system automatically:
1. Opens the user's email client with pre-filled lead data
2. Sends to: `info@hanamal24.co.il`
3. Subject: "בקשה חדשה לאירוע - [Customer Name]"

### Method 3: Local Storage Backup
All leads are also stored in the browser's localStorage for manual processing:
- **Storage Key:** `hanamal24_leads`
- **Export Function:** `window.exportLeads()` (available in browser console)

## Form Features

### Validation
- **Real-time validation** for all required fields
- **Email format validation**
- **Phone number validation**
- **Guest count minimum validation** (minimum 1)
- **Hebrew error messages**

### User Experience
- **Loading states** during submission
- **Success/error messages** in Hebrew
- **Form reset** after successful submission
- **Responsive design** for mobile and desktop

### Event Types
The form includes a dropdown with these options:
- יום הולדת (Birthday)
- אירוע עסקי (Corporate Event)
- חתונה (Wedding)
- אירוע פרטי (Private Event)
- אחר (Other)

## Testing the System

### 1. Test Form Submission
1. Fill out the contact form on your website
2. Submit the form
3. Check your Airtable leads table for the new record

### 2. Test Fallback Methods
1. Disable JavaScript or block the API endpoint
2. Submit the form
3. Verify email fallback opens with pre-filled data
4. Check localStorage for stored lead data

### 3. Export Stored Leads
```javascript
// In browser console:
const leads = window.exportLeads();
console.log(leads);
```

## Deployment Instructions

### For Vercel:
1. Connect your GitHub repository to Vercel
2. Set environment variable: `AIRTABLE_TOKEN=your_token_here`
3. Deploy - the API endpoint will be available at `/api/submit-lead`

### For Netlify:
1. Deploy to Netlify
2. Go to Site Settings > Environment Variables
3. Add: `AIRTABLE_TOKEN=your_token_here`
4. Redeploy

### For GitHub Pages (Current):
The form currently uses fallback methods since GitHub Pages doesn't support serverless functions. Leads are stored locally and can be exported manually.

## Monitoring and Maintenance

### Check Lead Storage
```javascript
// Check stored leads in browser console
const leads = JSON.parse(localStorage.getItem('hanamal24_leads') || '[]');
console.log('Stored leads:', leads);
```

### Export Leads for Manual Processing
```javascript
// Export leads as JSON file
window.exportLeads();
```

### Airtable Token Security
- Never expose your Airtable token in client-side code
- Use environment variables in serverless functions
- Rotate tokens regularly for security

## Troubleshooting

### Common Issues:

1. **"Failed to submit lead" error**
   - Check if serverless function is deployed correctly
   - Verify Airtable token is set in environment variables
   - Check browser console for detailed error messages

2. **Leads not appearing in Airtable**
   - Verify table ID and field names match exactly
   - Check Airtable token permissions
   - Look for errors in serverless function logs

3. **Form validation not working**
   - Ensure `contact-form.js` is loaded correctly
   - Check browser console for JavaScript errors
   - Verify form HTML structure matches expected format

### Debug Mode:
Add `?debug=true` to your URL to see detailed logging in the browser console.

## Future Enhancements

1. **Email Notifications:** Send email alerts when new leads are submitted
2. **Lead Status Updates:** Allow leads to update their status
3. **Analytics:** Track form conversion rates and popular event types
4. **CRM Integration:** Connect with additional CRM systems
5. **SMS Notifications:** Send SMS alerts for urgent leads

## Support

For technical support or questions about the lead management system, contact your development team or refer to the Airtable API documentation.
