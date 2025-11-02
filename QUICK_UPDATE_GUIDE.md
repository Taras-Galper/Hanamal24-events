# 🚀 Quick Guide: Update Site with Fresh Airtable Data

## ✅ Current Status:
- ✅ Build script now fetches fresh data from Airtable
- ✅ .env file created with your Airtable credentials
- ✅ Local build is working (found 5 events, 5 packages, 21 dishes, etc.)

## 🔄 To Update Your Live Site:

### Option 1: Push to GitHub (Recommended)
This will trigger GitHub Actions to rebuild and deploy:

```bash
git add .
git commit -m "Update: fresh Airtable data fetch"
git push origin main
```

Then:
1. Go to: https://github.com/Taras-Galper/Hanamal24-events/actions
2. Wait for the workflow to complete (~2-3 minutes)
3. Your site will auto-update at: https://taras-galper.github.io/Hanamal24-events

### Option 2: Manual GitHub Actions Trigger
1. Go to: https://github.com/Taras-Galper/Hanamal24-events/actions
2. Click **"Build Site"** workflow
3. Click **"Run workflow"** button
4. Wait for completion

### Option 3: Local Preview First
Test locally before deploying:
```bash
npm run build
npm run dev
```
Visit: http://localhost:3000

## ✅ Verify It's Working:
After deployment, check that your site shows:
- Latest events from Airtable
- Updated packages
- Current dishes
- Fresh gallery items

## 🔧 Troubleshooting:

**If site still shows old data:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Check GitHub Actions logs for errors
3. Verify Airtable secrets are set in GitHub Settings → Secrets

**If build fails:**
1. Check `.env` file has correct Airtable credentials
2. Verify Airtable token has access to all tables
3. Check GitHub Actions workflow logs

## 📝 What Changed:
- Build script now **always** fetches from Airtable when credentials are available
- No more stale JSON files blocking updates
- Site will reflect Airtable changes immediately after rebuild

