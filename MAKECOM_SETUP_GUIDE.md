# Make.com Setup Guide for Airtable Integration

## 🚀 Quick Setup (5 minutes)

### Step 1: Create Make.com Account
1. Go to [make.com](https://make.com) and sign up for a free account
2. Verify your email address

### Step 2: Create New Scenario
1. Click "Create a new scenario"
2. Name it "Hanamal24 Contact Form"
3. Click "Create"

### Step 3: Add Webhook Module
1. Click the "+" button to add first module
2. Search for "Webhooks" and select "Webhooks > Custom webhook"
3. Click "Add"
4. Click "Add webhook" button
5. **Copy the webhook URL** (looks like: `https://hook.eu1.make.com/xxxxxxxxx`)

### Step 4: Add Airtable Module
1. Click the "+" button after the webhook
2. Search for "Airtable" and select "Airtable > Create a Record"
3. Click "Add"
4. Connect your Airtable account (use your Personal Access Token)
5. Select Base: `Hanamal24-events` (appeW41fJAbVdeWoU)
6. Select Table: `Leads` (tblTMBjuWZ8BATqTj)

### Step 5: Map Fields
Map the webhook data to Airtable fields:

| Webhook Field | Airtable Field |
|---------------|----------------|
| `fullName` | `שם מלא` |
| `email` | `אימייל` |
| `phone` | `טלפון` |
| `eventType` | `סוג אירוע` |
| `guestCount` | `מספר אורחים` |
| `eventDate` | `תאריך האירוע` |
| `message` | `הודעה נוספת` |

### Step 6: Add Static Fields
Add these static fields to every lead:
- `תאריך יצירת הליד`: `{{now}}`
- `סטטוס`: `חדש`
- `מקור`: `אתר אינטרנט`

### Step 7: Test and Activate
1. Click "Run once" to test
2. Fill out the contact form on your website
3. Check if the lead appears in Airtable
4. If successful, click "Turn on" to activate

### Step 8: Update Website Configuration
1. Copy your webhook URL from Step 3
2. Open `public/config.js` in your project
3. Replace `YOUR_WEBHOOK_ID_HERE` with your actual webhook URL
4. Change `ENABLE_MAKECOM: false` to `ENABLE_MAKECOM: true`
5. Save and rebuild your site

## 🔧 Detailed Field Mapping

### Webhook Data Structure
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "eventType": "יום הולדת",
  "guestCount": 25,
  "eventDate": "2024-02-15",
  "message": "Looking for a birthday party venue"
}
```

### Airtable Field Mapping
In the Airtable module, set up these mappings:

1. **שם מלא** = `{{fullName}}`
2. **אימייל** = `{{email}}`
3. **טלפון** = `{{phone}}`
4. **סוג אירוע** = `{{eventType}}`
5. **מספר אורחים** = `{{guestCount}}`
6. **תאריך האירוע** = `{{eventDate}}`
7. **הודעה נוספת** = `{{message}}`
8. **תאריך יצירת הליד** = `{{now}}`
9. **סטטוס** = `חדש`
10. **מקור** = `אתר אינטרנט`

## 🛠️ Troubleshooting

### Webhook Not Receiving Data
1. Check webhook URL is correct
2. Verify webhook is active (green status)
3. Test with a simple POST request

### Airtable Not Creating Records
1. Check Airtable connection
2. Verify field names match exactly
3. Check table permissions

### CORS Errors
Make.com webhooks don't have CORS restrictions, so this shouldn't be an issue.

## 📊 Monitoring

### Check Webhook Activity
1. Go to your scenario in Make.com
2. Click on the webhook module
3. View "Logs" to see incoming requests

### Check Airtable Records
1. Go to your Airtable base
2. Open the Leads table
3. Verify new records are being created

## 🔄 Alternative: Manual Processing

If Make.com setup is complex, you can:
1. Keep `ENABLE_MAKECOM: false`
2. Leads will be stored in browser localStorage
3. Access them via `/admin/` page
4. Manually copy leads to Airtable

## 📞 Support

If you need help:
1. Check Make.com documentation
2. Verify Airtable API permissions
3. Test webhook with tools like Postman
4. Check browser console for errors

---

**Next Steps:**
1. Set up Make.com scenario
2. Get webhook URL
3. Update `public/config.js`
4. Test contact form submission
5. Verify leads appear in Airtable
