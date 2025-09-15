# Render.com Deployment Guide

## 🚀 Current Issue: Airtable Content Not Showing

The site is building successfully but not showing Airtable content on Render.com. Here are the steps to fix this:

## ✅ Step 1: Verify Environment Variables

1. **Go to Render.com Dashboard**
2. **Select your Hanamal24-events service**
3. **Go to "Environment" tab**
4. **Verify these variables are set:**
   - `AIRTABLE_TOKEN` = `patfEh10eMje6sACP.b76a7392aee5a154df6fa1910991097e2eeb0f61984daff39ac15d4f0d4a1ec6`
   - `AIRTABLE_BASE` = `appeW41fJAbVdeWoU`
   - `BASE_URL` = `https://your-actual-render-url.onrender.com` (replace with your actual URL)
   - `SITE_NAME` = `Hanamal 24`
   - `SITE_CITY` = `Haifa`
   - `SITE_COUNTRY` = `IL`
   - `CUISINE` = `French`

## ✅ Step 2: Manual Redeploy

1. **Go to your service dashboard**
2. **Click "Manual Deploy"**
3. **Select "Deploy latest commit"**
4. **Wait for deployment to complete**

## ✅ Step 3: Check Build Logs

During deployment, look for these messages in the logs:
- ✅ "Fetching data from Airtable..."
- ✅ "Found X events, X packages, X about records, X hero records"
- ❌ If you see "Using static fallback content" - environment variables are missing

## ✅ Step 4: Alternative - Use render.yaml

If manual environment variables don't work:

1. **Delete the current service**
2. **Create new service from GitHub**
3. **Select "render.yaml" as configuration source**
4. **Deploy**

## 🔧 Troubleshooting

### If Airtable content still doesn't show:

1. **Check the actual Render.com URL** and update BASE_URL in render.yaml
2. **Verify Airtable token has access** to the base
3. **Check if Render.com is using cached content** - try a different service name

### Expected Content:

After successful deployment, you should see:
- **Hero Section**: Airtable images and "הנמל 24" title
- **About Section**: Airtable content about the restaurant
- **Packages Section**: Airtable packages with prices
- **Contact Form**: Working Make.com webhook

## 📞 Need Help?

If the issue persists:
1. Share your actual Render.com URL
2. Check the deployment logs for any errors
3. Verify environment variables are set correctly
