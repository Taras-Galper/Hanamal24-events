# Deployment Setup

## GitHub Actions Automatic Rebuilds

This repository is configured with GitHub Actions to automatically rebuild and deploy your site.

### Features:
- **Manual rebuilds** - Trigger builds from GitHub UI when needed
- **Code-triggered rebuilds** - Rebuilds when you push changes to main branch
- **GitHub Pages deployment** - Automatically deploys to `https://taras-galper.github.io/Hanamal24-events`

## Quick Setup (5 minutes):

### Step 1: Add Airtable Secrets
1. Go to: https://github.com/Taras-Galper/Hanamal24-events/settings/secrets/actions
2. Click **"New repository secret"** and add these two secrets:

**Secret 1:**
- Name: `AIRTABLE_TOKEN`
- Value: `patfEh10eMje6sACP.b76a7392aee5a154df6fa1910991097e2eeb0f61984daff39ac15d4f0d4a1ec6`

**Secret 2:**
- Name: `AIRTABLE_BASE`
- Value: `appeW41fJAbVdeWoU`

### Step 2: Enable GitHub Pages
1. Go to: https://github.com/Taras-Galper/Hanamal24-events/settings/pages
2. Under **Source**, select **"GitHub Actions"**
3. Click **Save**

### Step 3: Test the Setup
1. Go to: https://github.com/Taras-Galper/Hanamal24-events/actions
2. Click **"Build and Deploy Site"**
3. Click **"Run workflow"** → **"Run workflow"**
4. Wait for it to complete (2-3 minutes)
5. Your site will be live at: **https://taras-galper.github.io/Hanamal24-events**

## How It Works:

1. **On code changes**: When you push to main branch, it rebuilds and deploys
2. **Manual trigger**: Go to Actions → "Build and Deploy Site" → "Run workflow"
3. **Airtable data**: Fetches fresh data from your Airtable on every build

## Troubleshooting:

**If the workflow fails:**
1. Check the **Actions** tab for error details
2. Make sure both secrets are added correctly
3. Ensure GitHub Pages is enabled

**If the site doesn't update:**
1. Go to Actions → "Build and Deploy Site" → "Run workflow"
2. Wait for completion
3. Check the site URL

## Benefits:
- ✅ **Always up-to-date** - Site refreshes with latest Airtable data
- ✅ **Zero maintenance** - Runs automatically
- ✅ **Fast deployment** - Static files deploy in seconds
- ✅ **SEO optimized** - Perfect for search engines
- ✅ **Free hosting** - GitHub Pages is free
