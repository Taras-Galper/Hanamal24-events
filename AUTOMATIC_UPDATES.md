# 🔄 Automatic Airtable Updates

This document explains how to set up automatic site updates when Airtable data changes.

## 🚀 Solution Options

### Option 1: Scheduled Updates (Easiest - Already Configured)

**What it does:** Checks Airtable every 30 minutes and rebuilds if data changed.

**Setup:** ✅ Already configured in `.github/workflows/build.yml`

**Update frequency:** Every 30 minutes

**Pros:**
- ✅ No additional setup required
- ✅ Reliable and consistent
- ✅ Free with GitHub Actions

**Cons:**
- ⚠️ Up to 30-minute delay for updates

---

### Option 2: Airtable Webhooks (Most Responsive)

**What it does:** Airtable notifies your site immediately when data changes.

**Setup Steps:**

1. **Deploy webhook handler** (choose one):
   - **Vercel:** Deploy `airtable-webhook.js` to Vercel
   - **Netlify:** Deploy as serverless function
   - **Railway/Render:** Deploy as Node.js app

2. **Get webhook URL:**
   ```
   https://your-app.vercel.app/api/airtable-webhook
   ```

3. **Configure Airtable webhook:**
   - Go to Airtable → Automations
   - Create new automation
   - Trigger: "When record is created/updated"
   - Action: "Send webhook"
   - URL: Your webhook URL

4. **Add GitHub token to webhook:**
   - Go to GitHub → Settings → Developer settings → Personal access tokens
   - Create token with `repo` permissions
   - Add to webhook environment: `GITHUB_TOKEN=your_token`

**Update frequency:** Immediate (within 1-2 minutes)

**Pros:**
- ✅ Instant updates
- ✅ Only rebuilds when data actually changes
- ✅ Most efficient

**Cons:**
- ⚠️ Requires external hosting
- ⚠️ More complex setup

---

### Option 3: Manual Trigger Script (Quick Updates)

**What it does:** Run a script to immediately update the site.

**Setup:**
```bash
# Make script executable
chmod +x trigger-update.js

# Run when you want to update
node trigger-update.js
```

**Update frequency:** On-demand

**Pros:**
- ✅ Immediate updates
- ✅ Simple to use
- ✅ No external dependencies

**Cons:**
- ⚠️ Manual process
- ⚠️ Requires someone to run the script

---

## 🎯 Recommended Setup

### For Most Users: Option 1 (Scheduled Updates)
- ✅ Already configured
- ✅ Updates every 30 minutes
- ✅ No additional setup needed

### For Real-time Updates: Option 2 (Webhooks)
- ✅ Instant updates
- ✅ Most professional solution
- ⚠️ Requires webhook hosting

### For Occasional Updates: Option 3 (Manual Script)
- ✅ Immediate when needed
- ✅ Simple to use
- ⚠️ Manual process

---

## 🔧 Current Configuration

Your site is currently configured with:

- ✅ **Scheduled updates:** Every 30 minutes
- ✅ **Manual triggers:** Via GitHub Actions UI
- ✅ **Code push triggers:** When you push changes

## 📊 Update Timeline

| Method | Update Time | Setup Required |
|--------|-------------|----------------|
| Scheduled | 0-30 minutes | None (already done) |
| Webhooks | 1-2 minutes | Webhook hosting |
| Manual Script | 2-3 minutes | None |

## 🚨 Troubleshooting

**If updates aren't working:**
1. Check GitHub Actions tab for errors
2. Verify Airtable token is still valid
3. Check if Airtable data actually changed
4. Look at build logs for specific errors

**If webhook isn't working:**
1. Verify webhook URL is accessible
2. Check GitHub token permissions
3. Test webhook with curl or Postman
4. Check webhook hosting logs

---

## 🎉 You're All Set!

Your site will automatically update every 30 minutes with the latest Airtable data. For immediate updates, use the manual trigger in GitHub Actions or run the trigger script.
