# Make.com JSON Export Setup Guide

This guide shows you how to set up Make.com to automatically export Airtable data to JSON files and trigger a site rebuild with one button click.

## What This Does

When you click a button in Airtable:
1. Make.com fetches data from all 7 Airtable tables
2. Converts data to JSON format
3. Commits JSON files to your GitHub repository
4. Triggers GitHub Actions to rebuild the site
5. Site updates automatically (NO Airtable API calls needed!)

## Prerequisites

- Make.com account (free tier works)
- GitHub Personal Access Token with repo and workflow permissions
- Airtable base with a Button field

## Step 1: Create GitHub Personal Access Token

1. Go to [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. Click **"Generate new token (classic)"**
3. Name: "Make.com JSON Export"
4. Select scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
5. Click **"Generate token"**
6. **Copy the token** - you'll need it for Make.com

## Step 2: Create Make.com Scenario

### 2.1 Create New Scenario

1. Go to [Make.com](https://www.make.com)
2. Click **"Create a new scenario"**
3. Name it: "Airtable → JSON Export → Rebuild"
4. Click **"Create scenario"**

### 2.2 Add Airtable Trigger

1. Click the first module (trigger)
2. Search for **"Airtable"**
3. Select **"Watch Records"**
4. **Connect your Airtable account**
5. Configure:
   - **Base**: `Hanamal 24 Events` (appeW41fJAbVdeWoU)
   - **Table**: Any table (e.g., Events)
   - **Filter**: Create a button field called "Rebuild Site"
     - Field: `Rebuild Site`
     - Condition: `is not empty`
6. Click **"OK"**

### 2.3 Get All Records from Each Table

You'll need to add **7 Airtable modules** (one for each table):

#### Module 1: Events
1. Click **"Add module"** after trigger
2. Search for **"Airtable"** → **"Search records"**
3. Configure:
   - Base: `Hanamal 24 Events`
   - Table: `Events`
   - Leave filters empty (get all records)
4. Click **"OK"**

#### Module 2: Menus
1. Add another **"Search records"** module
2. Table: `Menus`
3. Click **"OK"**

#### Module 3: Packages
1. Add another **"Search records"** module
2. Table: `Packages` (or table ID: tbl9C40JxeIkue5So)
3. Click **"OK"**

#### Module 4: Dishes
1. Add another **"Search records"** module
2. Table: `Dishes` (or table ID: tblbi9b9lUjRRrAhW)
3. Click **"OK"**

#### Module 5: About
1. Add another **"Search records"** module
2. Table: `About` (or table ID: tblvhDaSZbzlYP9bh)
3. Click **"OK"**

#### Module 6: Hero
1. Add another **"Search records"** module
2. Table: `Hero` (or table ID: tblOe7ONKtB6A9Q6L)
3. Click **"OK"**

#### Module 7: Gallery
1. Add another **"Search records"** module
2. Table: `Gallery` (or table ID: tblpfVJY9nEb5JDlQ)
3. Click **"OK"**

### 2.4 Add JavaScript Modules (Transform to JSON)

You'll add **7 JavaScript modules** to convert records to JSON:

#### JavaScript 1: Convert Events
1. Add **"JavaScript"** → **"JavaScript"** module after Module 1
2. Add this code:
```javascript
// Convert Airtable records to simple JSON array
const records = [];

// Get data from the Airtable module (change module number as needed)
const airtableModule = {{1}}; // Module 1 (Events)

if (airtableModule && airtableModule.records) {
  airtableModule.records.forEach(record => {
    const data = {
      id: record.id,
      ...record.fields
    };
    records.push(data);
  });
}

return records;
```
3. Click **"OK"**

Repeat for all 7 tables, incrementing the module number ({{2}}, {{3}}, etc.)

### 2.5 Add GitHub Commit Modules

You'll add **7 GitHub modules** to commit each JSON file:

#### GitHub 1: Commit events.json
1. Add **"GitHub"** → **"Create or Update File"** module
2. **Connect** your GitHub account using your Personal Access Token
3. Configure:
   - **Repository**: `Taras-Galper/Hanamal24-events`
   - **Branch**: `main`
   - **Path**: `data/events.json`
   - **File Content**: `{{3}}` (the JavaScript output from Module 3)
   - **Commit Message**: `Update events.json from Airtable`
4. Click **"OK"**

Repeat for all 7 files:
- `data/menus.json`
- `data/packages.json`
- `data/dishes.json`
- `data/about.json`
- `data/hero.json`
- `data/gallery.json`

### 2.6 Trigger GitHub Actions

After the last commit module:

1. Add **"GitHub"** → **"Run a Custom API Call"** module
2. Configure:
   - **Method**: `POST`
   - **URL**: `https://api.github.com/repos/Taras-Galper/Hanamal24-events/actions/workflows/build.yml/dispatches`
   - **Headers**:
     - `Accept`: `application/vnd.github.v3+json`
     - `Content-Type`: `application/json`
   - **Body**:
```json
{
  "ref": "main",
  "inputs": {
    "reason": "Airtable button triggered rebuild"
  }
}
```
3. **Authorization**: Your Personal Access Token
4. Click **"OK"**

### 2.7 Activate the Scenario

1. Click **"Turn on"** in the top right
2. Your scenario is now live!

## Step 3: Add Button to Airtable

1. Open your Airtable base
2. Add a new field to any table (e.g., Events)
3. Field type: **"Button field"**
4. Name it: `Rebuild Site`
5. Button action: Can be anything (just triggers the webhook)

## Step 4: Test It!

1. Go to Airtable
2. Click the **"Rebuild Site"** button
3. Wait 30-60 seconds
4. Check your Make.com scenario - it should show as **"Running"**
5. Wait for it to complete
6. Check your site - it should be updated!

## Troubleshooting

### Make.com doesn't trigger
- Check that the button field is filled
- Verify the filter in the trigger module

### GitHub commit fails
- Check your Personal Access Token has `repo` permission
- Verify the repository path is correct

### Site doesn't rebuild
- Check GitHub Actions tab in your repo
- Verify the workflow dispatch call succeeded

## How It Works

```
┌─────────────────────────────────────┐
│  1. Click Button in Airtable         │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│  2. Make.com Watches Records         │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│  3. Fetch All 7 Tables from Airtable │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│  4. Convert to JSON Format           │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│  5. Commit 7 JSON Files to GitHub   │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│  6. Trigger GitHub Actions           │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│  7. Site Rebuilds with JSON Data    │
│     (NO API CALLS!)                 │
└─────────────────────────────────────┘
```

## Benefits

✅ No Airtable API quota needed
✅ One-click website updates
✅ Version controlled data (JSON files in git)
✅ Automatic rebuilds
✅ Free on Make.com plan

