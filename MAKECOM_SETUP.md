# Make.com Setup Guide - Airtable Integration

## Overview
This guide will help you set up Make.com to automatically submit leads from your contact form to Airtable. This is much easier and more reliable than serverless functions.

## Step 1: Create Make.com Account
1. Go to [make.com](https://make.com)
2. Sign up for a free account
3. Verify your email address

## Step 2: Create New Scenario
1. Click "Create a new scenario"
2. Name it: "Hanamal 24 Contact Form to Airtable"
3. Click "Create"

## Step 3: Add Webhook Trigger
1. Search for "Webhooks" in the modules
2. Select "Webhooks" → "Custom webhook"
3. Click "Add"
4. Click "Add webhook" to create a new webhook
5. Copy the webhook URL (you'll need this for the form)

## Step 4: Add Airtable Module
1. Click the "+" button after the webhook
2. Search for "Airtable"
3. Select "Airtable" → "Create a record"
4. Click "Add"

## Step 5: Configure Airtable Connection
1. Click on the Airtable module
2. Click "Add" next to "Connection"
3. Enter your Airtable Personal Access Token:
   `patfEh10eMje6sACP.b76a7392aee5a154df6fa1910991097e2eeb0f61984daff39ac15d4f0d4a1ec6`
4. Click "Continue"
5. Select your base: "Hanamal 24 Events"
6. Select your table: "Leads" (or the correct table name)
7. Click "Continue"

## Step 6: Map Form Fields to Airtable
1. In the Airtable module, map the fields:
   - **שם מלא**: `{{1.fullName}}`
   - **אימייל**: `{{1.email}}`
   - **טלפון**: `{{1.phone}}`
   - **סוג אירוע**: `{{1.eventType}}`
   - **מספר אורחים**: `{{1.guestCount}}`
   - **תאריך האירוע**: `{{1.eventDate}}`
   - **הודעה נוספת**: `{{1.message}}`
   - **תאריך יצירת הליד**: `{{now}}`
   - **סטטוס**: `חדש`
   - **מקור**: `אתר אינטרנט`

## Step 7: Test the Scenario
1. Click "Run once" to test
2. Check if the record appears in your Airtable table
3. If successful, click "OK"

## Step 8: Activate the Scenario
1. Toggle the "Inactive" switch to "Active"
2. Your webhook is now live and ready to receive form submissions

## Step 9: Update Your Contact Form
Replace the serverless function URL with your Make.com webhook URL in the contact form.

## Benefits of Make.com vs Serverless Functions

### Make.com Advantages:
- ✅ **No coding required** - visual interface
- ✅ **Built-in Airtable integration** - native support
- ✅ **Automatic error handling** - retries and monitoring
- ✅ **Easy field mapping** - drag and drop
- ✅ **Real-time monitoring** - see every submission
- ✅ **No deployment** - works immediately
- ✅ **Free tier available** - 1000 operations/month

### Serverless Function Disadvantages:
- ❌ **Requires coding knowledge**
- ❌ **Complex deployment process**
- ❌ **Environment variable management**
- ❌ **Manual error handling**
- ❌ **No visual monitoring**

## Testing Your Setup

### Test 1: Manual Webhook Test
1. Go to your Make.com scenario
2. Click "Run once"
3. Check your Airtable table for the test record

### Test 2: Form Submission Test
1. Visit your website
2. Fill out the contact form
3. Submit the form
4. Check Make.com execution history
5. Check Airtable for the new record

## Monitoring and Maintenance

### Check Execution History:
1. Go to your Make.com scenario
2. Click "Execution history"
3. See all form submissions and their status

### Check Airtable:
1. Go to your Airtable leads table
2. Look for new records with:
   - Status: "חדש"
   - Source: "אתר אינטרנט"
   - All form data properly filled

## Troubleshooting

### Issue: Webhook not receiving data
- Check the webhook URL in your form
- Verify the scenario is active
- Check Make.com execution history

### Issue: Data not appearing in Airtable
- Check field mapping in Make.com
- Verify Airtable connection
- Check execution history for errors

### Issue: Form shows error
- Check browser console for error messages
- Verify webhook URL is correct
- Test webhook manually in Make.com

## Cost Comparison

### Make.com:
- **Free tier**: 1,000 operations/month
- **Paid plans**: Starting at $9/month for 10,000 operations
- **No additional costs** for Airtable integration

### Vercel + Serverless:
- **Free tier**: 100GB bandwidth, 100 serverless function invocations
- **Paid plans**: Starting at $20/month
- **Additional complexity** for maintenance

## Recommendation

**Use Make.com** for this project because:
1. **Easier setup** - 5 minutes vs 30 minutes
2. **More reliable** - built for integrations
3. **Better monitoring** - visual execution history
4. **No maintenance** - Make.com handles everything
5. **Cost effective** - free tier covers most needs

## Next Steps

1. Set up Make.com scenario (follow steps above)
2. Get your webhook URL
3. Update the contact form with the webhook URL
4. Test the integration
5. Monitor submissions in Make.com dashboard
