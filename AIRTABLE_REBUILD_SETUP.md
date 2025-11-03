# 🔄 Airtable Rebuild Setup

## How It Works:

1. **Default behavior**: Site uses cached JSON files (no API calls, fast builds)
2. **When Airtable button triggers**: Webhook → GitHub Actions → Fetches fresh data → Rebuilds site

## Setup Steps:

### Step 1: Initial Data Sync
Run once to create initial cache:
```bash
npm run sync
git add data/*.json
git commit -m "Initial Airtable data sync"
git push
```

### Step 2: Set Up Airtable Button/Webhook

#### Option A: Airtable Button + Make.com (Recommended)
1. In Make.com, create a scenario that watches for button clicks
2. When button is clicked → Trigger GitHub Actions workflow
3. See `makecom-scenario-template.json` for example

#### Option B: Airtable Webhook
1. Deploy `airtable-webhook.js` to Vercel/Netlify
2. Add webhook URL to Airtable automation
3. Webhook triggers GitHub Actions rebuild

### Step 3: Configure GitHub Secrets
Make sure these are set in GitHub:
- `AIRTABLE_TOKEN` - Your Airtable personal access token
- `AIRTABLE_BASE` - Your Airtable base ID
- `GITHUB_TOKEN` - Personal access token with `repo` scope (for webhook)

## Workflow:

### Normal Builds (Code Changes):
- ✅ Uses cached `data/*.json` files
- ✅ No Airtable API calls
- ✅ Fast and saves API credits
- ✅ Shows latest cached content

### Triggered Builds (Airtable Button):
1. Airtable button/webhook → GitHub Actions
2. ✅ Syncs fresh data: `npm run sync`
3. ✅ Builds with fresh data: `FORCE_FRESH_FETCH=true`
4. ✅ Commits updated JSON files
5. ✅ Deploys updated site

## Manual Trigger:

To manually rebuild with fresh data:
```bash
# Local
npm run sync
npm run build

# GitHub Actions
Go to Actions → "Build Site" → "Run workflow"
```

## Benefits:

- ✅ **Saves API credits**: Only fetches when needed
- ✅ **Faster builds**: Uses cached data by default
- ✅ **On-demand updates**: Airtable button triggers fresh rebuild
- ✅ **Always up-to-date**: When triggered, always gets latest data

