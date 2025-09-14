# Deployment Guide - Automatic Airtable Integration

## Overview
This guide will help you deploy the serverless function to automatically submit leads to your Airtable table.

## Quick Deployment to Vercel

### Step 1: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with your GitHub account
3. Click "New Project"
4. Import your repository: `Taras-Galper/Hanamal24-events`
5. Click "Deploy"

### Step 2: Set Environment Variable
1. In your Vercel dashboard, go to your project
2. Go to "Settings" → "Environment Variables"
3. Add new variable:
   - **Name:** `AIRTABLE_TOKEN`
   - **Value:** `patfEh10eMje6sACP.b76a7392aee5a154df6fa1910991097e2eeb0f61984daff39ac15d4f0d4a1ec6`
   - **Environment:** Production, Preview, Development
4. Click "Save"

### Step 3: Redeploy
1. Go to "Deployments" tab
2. Click "Redeploy" on the latest deployment
3. Wait for deployment to complete

### Step 4: Test the Integration
1. Visit your deployed site
2. Fill out the contact form
3. Submit the form
4. Check your Airtable leads table for the new record

## Alternative: Deploy to Netlify

### Step 1: Deploy to Netlify
1. Go to [netlify.com](https://netlify.com)
2. Sign up/Login with your GitHub account
3. Click "New site from Git"
4. Connect your repository: `Taras-Galper/Hanamal24-events`
5. Set build command: `npm run build`
6. Set publish directory: `dist`
7. Click "Deploy site"

### Step 2: Set Environment Variable
1. In your Netlify dashboard, go to "Site settings"
2. Go to "Environment variables"
3. Add new variable:
   - **Key:** `AIRTABLE_TOKEN`
   - **Value:** `patfEh10eMje6sACP.b76a7392aee5a154df6fa1910991097e2eeb0f61984daff39ac15d4f0d4a1ec6`
4. Click "Save"

### Step 3: Redeploy
1. Go to "Deployments" tab
2. Click "Trigger deploy" → "Deploy site"
3. Wait for deployment to complete

## Testing the Integration

### Test 1: Form Submission
1. Visit your deployed website
2. Scroll to the contact form
3. Fill out all required fields:
   - שם מלא (Full Name)
   - אימייל (Email)
   - טלפון (Phone)
   - סוג אירוע (Event Type)
   - מספר אורחים (Guest Count)
   - תאריך האירוע (Event Date)
4. Click "שלח בקשה" (Send Request)
5. You should see: "הבקשה נשלחה בהצלחה! נחזור אליכם בהקדם."

### Test 2: Check Airtable
1. Go to your Airtable leads table
2. Look for the new record with:
   - All form data properly filled
   - Status: "חדש" (New)
   - Source: "אתר אינטרנט" (Website)
   - Creation date: Today's date

### Test 3: Check Browser Console
1. Open browser developer tools (F12)
2. Go to Console tab
3. Submit the form
4. Look for success message: "Lead submitted successfully to Airtable"

## Troubleshooting

### Issue: "Server configuration error"
**Solution:** The AIRTABLE_TOKEN environment variable is not set correctly.

### Issue: "Airtable API error: 401"
**Solution:** The Airtable token is invalid or expired. Generate a new one.

### Issue: "Airtable API error: 403"
**Solution:** The token doesn't have access to the leads table. Check permissions.

### Issue: Form shows fallback message
**Solution:** The serverless function is not deployed or not accessible. Check deployment status.

## Manual Testing

### Test the API directly:
```bash
curl -X POST https://your-site.vercel.app/api/submit-lead \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "phone": "050-1234567",
    "eventType": "יום הולדת",
    "guestCount": 20,
    "eventDate": "2024-12-31",
    "message": "Test message"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Lead submitted successfully to Airtable",
  "leadId": "recXXXXXXXXXXXXXX",
  "airtableRecord": { ... }
}
```

## Security Notes

- The Airtable token is stored securely in environment variables
- Never commit the token to your repository
- The token has limited permissions (only to your specific base)
- Consider rotating the token periodically

## Support

If you encounter any issues:
1. Check the Vercel/Netlify deployment logs
2. Check the browser console for error messages
3. Verify the Airtable token permissions
4. Test the API endpoint directly

## Success Indicators

✅ **Form submits successfully** - No error messages
✅ **Success message appears** - "הבקשה נשלחה בהצלחה! נחזור אליכם בהקדם."
✅ **Record appears in Airtable** - New lead with all data
✅ **Console shows success** - "Lead submitted successfully to Airtable"
✅ **No fallback methods triggered** - Form works directly with Airtable
