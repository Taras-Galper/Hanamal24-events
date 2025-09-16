# 🚀 Make.com Airtable Button Setup

This guide shows you how to create a button in Airtable that triggers both GitHub Actions and Render.com rebuilds using Make.com.

## 📋 Prerequisites

- Make.com account (free tier available)
- GitHub Personal Access Token
- Render.com Deploy Token (you already have this)
- Airtable base with admin access

## 🔧 Step 1: Create GitHub Personal Access Token

1. Go to [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. Click **"Generate new token (classic)"**
3. Give it a name: "Airtable Button Integration"
4. Select scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
5. Click **"Generate token"**
6. **Copy the token** - you'll need it for Make.com

## 🎯 Step 2: Create Make.com Scenario

### 2.1 Create New Scenario
1. Go to [Make.com](https://www.make.com)
2. Click **"Create a new scenario"**
3. Name it: "Airtable Button → Rebuild Sites"

### 2.2 Add Airtable Trigger
1. Click **"Add a module"**
2. Search for **"Airtable"**
3. Select **"Watch Records"** trigger
4. **Connect your Airtable account**
5. **Select your base**: `Hanamal 24 Events`
6. **Select table**: Choose any table (e.g., Events, Packages)
7. **Set up filter**: 
   - Field: `Rebuild Site` (Button field)
   - Condition: `is not empty`
8. Click **"Save"**

### 2.3 Add GitHub Actions Module
1. Click **"Add a module"** after the Airtable trigger
2. Search for **"GitHub"**
3. Select **"Run a Custom API Call"**
4. **Connect your GitHub account** using the token from Step 1
5. **Configure the API call**:
   - **Method**: `POST`
   - **URL**: `https://api.github.com/repos/Taras-Galper/Hanamal24-events/actions/workflows/build.yml/dispatches`
   - **Headers**:
     ```json
     {
       "Accept": "application/vnd.github.v3+json",
       "Content-Type": "application/json"
     }
     ```
   - **Body**:
     ```json
     {
       "ref": "main",
       "inputs": {
         "reason": "Airtable button triggered via Make.com"
       }
     }
     ```
6. Click **"Save"**

### 2.4 Add Render.com Module
1. Click **"Add a module"** after the GitHub module
2. Search for **"HTTP"**
3. Select **"Make a Request"**
4. **Configure the request**:
   - **Method**: `POST`
   - **URL**: `https://api.render.com/deploy/srv-d1rnnkp5pdvs73ebjcc0?key=h0hONC2Ttt8`
   - **Headers**:
     ```json
     {
       "Content-Type": "application/json"
     }
     ```
   - **Body**: `{}` (empty JSON object)
5. Click **"Save"**

### 2.5 Add Notification Module (Optional)
1. Click **"Add a module"** after the Render.com module
2. Search for **"Email"** or **"Slack"**
3. Configure to send you a notification when the rebuild is triggered
4. **Message template**:
   ```
   🚀 Site Rebuild Triggered!
   
   GitHub Actions: {{1.status}}
   Render.com: {{2.status}}
   
   Your sites will be updated in 2-3 minutes.
   ```

## 🎯 Step 3: Create Airtable Button Field

### 3.1 Add Button Field
1. Go to your Airtable base
2. **Add a new field**:
   - **Field type**: `Button`
   - **Field name**: `Rebuild Site`
   - **Button text**: `🚀 Rebuild Sites`

### 3.2 Configure Button Action
1. **Click the button field settings**
2. **Select action**: `Run a script`
3. **Paste this script**:

```javascript
// Airtable Button Script for Make.com Integration
let table = base.getTable("Events"); // Change to your table name
let record = input.record;

// Update a field to trigger Make.com webhook
// We'll use a timestamp field to trigger the webhook
let timestampField = table.getField("Last Updated"); // You'll need to create this field

// Update the timestamp to trigger Make.com
await table.updateRecordAsync(record, {
  [timestampField.id]: new Date().toISOString()
});

// Show success message
output.markdown(`
✅ **Rebuild Triggered!**

Your sites are being updated:
- 🌐 GitHub Pages: https://taras-galper.github.io/Hanamal24-events
- 🚀 Render.com: https://hanamal24events.onrender.com

**Status**: Both platforms will rebuild in 2-3 minutes.
`);
```

### 3.3 Create Trigger Field
1. **Add a new field** called `Last Updated` (Date field)
2. **Set it to auto-update** when records change
3. **This field will trigger Make.com** when the button updates it

## 🎯 Step 4: Alternative - Direct Webhook Approach

If you prefer a simpler approach without the timestamp field:

### 4.1 Create Webhook URL in Make.com
1. In your Make.com scenario, click **"Add a module"** at the beginning
2. Search for **"Webhooks"**
3. Select **"Custom webhook"**
4. **Copy the webhook URL**

### 4.2 Update Airtable Button Script
```javascript
// Direct webhook approach
let webhookUrl = "YOUR_MAKECOM_WEBHOOK_URL_HERE";

fetch(webhookUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    trigger: 'airtable_button',
    recordId: input.recordId,
    tableName: input.tableName,
    timestamp: new Date().toISOString()
  })
})
.then(response => response.json())
.then(data => {
  output.markdown(`
✅ **Rebuild Triggered!**

GitHub Actions: ${data.githubStatus || 'Triggered'}
Render.com: ${data.renderStatus || 'Triggered'}

Your sites will be updated in 2-3 minutes.
  `);
})
.catch(error => {
  output.markdown(`❌ **Error**: ${error.message}`);
});
```

## 🎯 Step 5: Test the Setup

1. **Activate your Make.com scenario**
2. **Click the "Rebuild Site" button** in Airtable
3. **Check Make.com execution log** to see if it worked
4. **Verify both sites rebuild**:
   - GitHub Pages: https://taras-galper.github.io/Hanamal24-events
   - Render.com: https://hanamal24events.onrender.com

## 🔧 Troubleshooting

### If Make.com doesn't trigger:
- Check the webhook URL is correct
- Verify Airtable connection in Make.com
- Check Make.com execution log for errors

### If GitHub Actions fails:
- Verify GitHub token has `repo` and `workflow` permissions
- Check the repository name is correct: `Taras-Galper/Hanamal24-events`

### If Render.com fails:
- Verify the deploy token is still valid
- Check the service ID: `srv-d1rnnkp5pdvs73ebjcc0`

## 🎉 Benefits of This Setup

- ✅ **Single button** triggers both platforms
- ✅ **Reliable** - Make.com handles retries and errors
- ✅ **Visual feedback** - See status in Airtable
- ✅ **Notifications** - Get notified when rebuilds complete
- ✅ **Logs** - Full execution history in Make.com
- ✅ **Free tier** - Make.com free plan supports this

## 📱 Usage

Once set up, simply:
1. **Click the "Rebuild Site" button** in any Airtable record
2. **Wait 2-3 minutes** for both sites to update
3. **Check the sites** to see your changes live

Your Airtable button will now instantly trigger rebuilds on both GitHub Pages and Render.com! 🚀
