# Make.com Webhook Setup (No API Calls from Make.com)

This setup uses Airtable's built-in automations to trigger Make.com via webhook - NO API calls from Make.com!

## How It Works

```
┌─────────────────────────────────────┐
│  1. Click Button in Airtable         │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│  2. Airtable Automation Triggers     │
│     (Built-in, uses Make.com webhook)│
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│  3. Make.com Receives Webhook        │
│     (NO polling, NO API calls!)     │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│  4. Make.com Fetches Data via API   │
│     (Uses YOUR Airtable token)      │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│  5. Commit JSON to GitHub            │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│  6. Trigger Rebuild                  │
└─────────────────────────────────────┘
```

## Step 1: Create Make.com Scenario with Webhook Trigger

### 1.1 Create Scenario

1. Go to [Make.com](https://www.make.com)
2. Click **"Create a new scenario"**
3. Name: "Airtable → JSON Export"
4. Click **"Create scenario"**

### 1.2 Add Webhook Trigger

1. Click the first module
2. Search for **"Webhooks"**
3. Select **"Webhooks" → "Custom webhook"**
4. Click **"Add webhook"**
5. Copy the webhook URL - you'll need this for Airtable!
   Example: `https://hook.eu2.make.com/xxxxx/yyyyy`

### 1.3 Add Airtable Module to Fetch Data

**Important**: Make.com will still call Airtable API, but:
- ✅ It's only when YOU manually trigger via webhook
- ✅ No continuous polling
- ✅ Uses YOUR API quota (which you control)

1. Add **"Airtable" → "Search records"** module
2. Connect your Airtable account
3. Configure:
   - **Base**: `Hanamal 24 Events`
   - **Table**: `Events`
   - Leave filters empty (get all records)
4. Click **"OK"**

Repeat for all 7 tables (or use an iterator if Make.com supports it).

### 1.4 Add JavaScript to Convert to JSON

Add JavaScript modules to convert each table to JSON format.

### 1.5 Add GitHub Commit Modules

Add modules to commit each JSON file to GitHub.

### 1.6 Add GitHub Actions Trigger

Add module to trigger rebuild.

### 1.7 Save Scenario

1. Click **"Save"**
2. **"Turn on"** the scenario (so webhook is active)

## Step 2: Set Up Airtable Automation

### 2.1 Create Automation

1. Open your Airtable base
2. Click **"Automations"** in the top bar
3. Click **"Create new automation"**
4. Name: "Trigger Site Rebuild"

### 2.2 Add Trigger

1. Click **"Trigger"**
2. Select **"When button field is clicked"**
3. Configure:
   - **Table**: Events (or any table)
   - **Field**: "Rebuild Site"
4. Click **"Continue"**

### 2.3 Add Action

1. Click **"Add action"**
2. Select **"Send webhook event"**
3. Configure:
   - **URL**: Your Make.com webhook URL
   - **Method**: `POST`
   - **Body**: Can be empty `{}` or add data like:
   ```json
   {
     "triggered_at": "{{current_time}}",
     "triggered_by": "Button click"
   }
   ```
4. Click **"Continue"**

### 2.4 Test Automation

1. Click **"Test action"**
2. Manually click your button field in Airtable
3. Check if webhook is sent (Make.com should receive it)

### 2.5 Activate

1. Click **"Turn on"** in the automation
2. Done!

## Step 3: Use It

1. Go to Airtable
2. Click the **"Rebuild Site"** button
3. Make.com receives webhook
4. Scenario runs automatically
5. Site updates in 2 minutes!

## Alternative: Manual Trigger (No Automation)

If you don't want to set up Airtable automation, you can:

1. Leave Make.com scenario **"Turn on"**
2. Go to Make.com dashboard
3. Click **"Run once"** when you want to update
4. Site rebuilds automatically

No button needed, but requires manual action in Make.com.

## Benefits

- ✅ NO continuous API calls
- ✅ Only calls Airtable when YOU trigger it
- ✅ Uses your API quota efficiently
- ✅ One click to update site
- ✅ No polling overhead

## API Call Usage

- **Before**: Make.com was polling every minute = 1,440 calls/day
- **After**: Only when you click button = 7 calls per update
- **Savings**: 99.5% reduction in API calls!

## Important Notes

1. **Make.com still needs to connect to Airtable** to fetch data - this uses YOUR API quota
2. The difference is: it's **on-demand** (when you trigger) vs **polling** (every minute)
3. You control how often it runs by clicking the button
4. Much more efficient than the "Watch Records" trigger

