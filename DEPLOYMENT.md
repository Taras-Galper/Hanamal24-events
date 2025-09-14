# Deployment Setup

## GitHub Actions Automatic Rebuilds

This repository is configured with GitHub Actions to automatically rebuild and deploy your site.

### Features:
- **Automatic rebuilds every 6 hours** - Keeps your site updated with latest Airtable data
- **Manual rebuilds** - Trigger builds from GitHub UI when needed
- **Code-triggered rebuilds** - Rebuilds when you push changes to main branch
- **GitHub Pages deployment** - Automatically deploys to `https://taras-galper.github.io/Hanamal24-events`

### Setup Instructions:

#### 1. Enable GitHub Pages
1. Go to your repository: `https://github.com/Taras-Galper/Hanamal24-events`
2. Click **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**
4. Save the settings

#### 2. Add Required Secrets
Go to **Settings** → **Secrets and variables** → **Actions** and add:

**Required:**
- `AIRTABLE_TOKEN` - Your Airtable Personal Access Token
- `AIRTABLE_BASE` - Your Airtable Base ID

**Optional (will use defaults if not set):**
- `BASE_URL` - Your site URL (default: `https://taras-galper.github.io/Hanamal24-events`)
- `SITE_NAME` - Site name (default: `Hanamal 24`)
- `SITE_CITY` - City (default: `Haifa`)
- `SITE_COUNTRY` - Country (default: `IL`)
- `CUISINE` - Cuisine type (default: `French`)
- `CUSTOM_DOMAIN` - Custom domain (if you have one)

#### 3. Test the Setup
1. Push these changes to GitHub
2. Go to **Actions** tab in your repository
3. You should see the workflow running
4. Once complete, your site will be live at: `https://taras-galper.github.io/Hanamal24-events`

### How It Works:

1. **Every 6 hours**: GitHub Actions fetches fresh data from Airtable and rebuilds the site
2. **On code changes**: When you push to main branch, it rebuilds and deploys
3. **Manual trigger**: Go to Actions → "Build and Deploy Site" → "Run workflow"

### Monitoring:
- Check the **Actions** tab to see build status
- Build logs will show if Airtable data was fetched successfully
- Failed builds will send email notifications (if configured)

### Benefits:
- ✅ **Always up-to-date** - Site refreshes with latest Airtable data
- ✅ **Zero maintenance** - Runs automatically
- ✅ **Fast deployment** - Static files deploy in seconds
- ✅ **SEO optimized** - Perfect for search engines
- ✅ **Free hosting** - GitHub Pages is free
