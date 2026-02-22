# FocusFlow - Simple Deployment Guide

This guide will help you deploy FocusFlow so you can access it as a website without keeping a terminal running.

## 🚀 Quick Deployment (Recommended)

We'll use **Vercel** for the complete app - it's free, easy, and handles everything automatically.

### Option 1: Deploy with Vercel (Easiest - All-in-One)

**Step 1: Create a GitHub Repository**

1. Go to https://github.com/new
2. Create a new repository called `focusflow`
3. Make it private (since it's just for you)
4. Don't initialize with README

**Step 2: Push Your Code to GitHub**

Open PowerShell in your project folder and run:

```powershell
git init
git add .
git commit -m "Initial commit - FocusFlow app"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/focusflow.git
git push -u origin main
```

**Step 3: Deploy to Vercel**

1. Go to https://vercel.com/signup
2. Sign up with your GitHub account (it's free)
3. Click "Add New Project"
4. Import your `focusflow` repository
5. Vercel will auto-detect Next.js settings
6. Click "Deploy"

**That's it!** Vercel will give you a URL like `https://focusflow-xyz.vercel.app`

You can now:
- ✅ Open it in any browser
- ✅ Access it from any device
- ✅ No terminal needed
- ✅ Auto-updates when you push to GitHub

---

## 🗄️ Database Setup (Required)

Your app needs a database. Use **Supabase** (free tier):

**Step 1: Create Supabase Project**

1. Go to https://supabase.com/dashboard
2. Sign up (free)
3. Click "New Project"
4. Name it `focusflow`
5. Set a database password (save this!)
6. Choose a region close to you
7. Click "Create new project"

**Step 2: Run Database Schema**

1. In Supabase dashboard, go to "SQL Editor"
2. Click "New Query"
3. Copy the contents of `database-schema.sql`
4. Paste and click "Run"
5. Copy the contents of `gamification-schema.sql`
6. Paste and click "Run"

**Step 3: Get Connection String**

1. In Supabase, go to "Settings" → "Database"
2. Find "Connection string" → "URI"
3. Copy the connection string
4. Replace `[YOUR-PASSWORD]` with your actual password

**Step 4: Add to Vercel**

1. Go to your Vercel project
2. Click "Settings" → "Environment Variables"
3. Add these variables:

```
DATABASE_URL = your-supabase-connection-string
JWT_SECRET = any-random-string-here-make-it-long
NEXT_PUBLIC_API_URL = https://your-vercel-url.vercel.app
```

4. Click "Save"
5. Go to "Deployments" → Click "..." → "Redeploy"

---

## 🎯 Alternative: Simple Local Access (No Deployment)

If you just want to access it on your computer without deployment:

**Option A: Use ngrok (Temporary URL)**

1. Download ngrok: https://ngrok.com/download
2. Run your app locally:
   ```powershell
   npm run dev
   ```
3. In another terminal:
   ```powershell
   ngrok http 3000
   ```
4. ngrok gives you a URL like `https://abc123.ngrok.io`
5. Access from any device on that URL

**Option B: Run as Windows Service (Always Running)**

1. Install `node-windows`:
   ```powershell
   npm install -g node-windows
   ```

2. Create `service.js`:
   ```javascript
   var Service = require('node-windows').Service;
   var svc = new Service({
     name: 'FocusFlow',
     description: 'FocusFlow Productivity Tracker',
     script: 'C:\\path\\to\\your\\project\\server.js'
   });
   svc.on('install', function(){ svc.start(); });
   svc.install();
   ```

3. Run:
   ```powershell
   node service.js
   ```

4. Access at `http://localhost:3000`

---

## 📱 Access Your Deployed App

Once deployed to Vercel:

1. **On Computer**: Open `https://your-app.vercel.app`
2. **On Phone**: Same URL works on mobile
3. **Bookmark it**: Add to home screen for app-like experience

### Add to Phone Home Screen

**iPhone:**
1. Open in Safari
2. Tap Share button
3. Tap "Add to Home Screen"
4. Name it "FocusFlow"

**Android:**
1. Open in Chrome
2. Tap menu (3 dots)
3. Tap "Add to Home screen"
4. Name it "FocusFlow"

---

## 🔧 Troubleshooting

### "Build Failed" on Vercel

**Issue**: Missing dependencies

**Fix**: Make sure `package.json` has all dependencies:
```powershell
npm install
```

Then push to GitHub again.

### "Database Connection Failed"

**Issue**: Wrong connection string

**Fix**: 
1. Check your Supabase connection string
2. Make sure password is correct
3. Update in Vercel environment variables
4. Redeploy

### "Page Not Found"

**Issue**: App not built correctly

**Fix**:
1. Check Vercel deployment logs
2. Make sure all files are pushed to GitHub
3. Try redeploying

---

## 💰 Cost Breakdown

**Completely Free Setup:**
- ✅ Vercel: Free tier (100GB bandwidth/month)
- ✅ Supabase: Free tier (500MB database, 2GB bandwidth)
- ✅ GitHub: Free for private repos
- ✅ Domain: Uses Vercel subdomain (free)

**Optional Upgrades (if you need more):**
- Custom domain: $10-15/year
- Vercel Pro: $20/month (if you exceed free tier)
- Supabase Pro: $25/month (if you need more storage)

For personal use, **free tier is more than enough!**

---

## 🎉 Quick Start Checklist

- [ ] Create GitHub account
- [ ] Push code to GitHub
- [ ] Sign up for Vercel
- [ ] Deploy to Vercel
- [ ] Sign up for Supabase
- [ ] Create database project
- [ ] Run database schemas
- [ ] Add environment variables to Vercel
- [ ] Redeploy
- [ ] Access your app!
- [ ] Bookmark the URL
- [ ] Add to phone home screen

---

## 🔄 Updating Your App

When you make changes:

1. Edit your code locally
2. Commit and push to GitHub:
   ```powershell
   git add .
   git commit -m "Updated feature X"
   git push
   ```
3. Vercel automatically redeploys!
4. Refresh your browser to see changes

---

## 📞 Need Help?

**Common Issues:**

1. **Can't access the URL**: Check if deployment succeeded in Vercel dashboard
2. **Database errors**: Verify connection string in environment variables
3. **Changes not showing**: Clear browser cache or hard refresh (Ctrl+F5)
4. **Slow loading**: Free tier has cold starts, first load may be slow

**Vercel Dashboard**: https://vercel.com/dashboard
**Supabase Dashboard**: https://supabase.com/dashboard

---

## 🎯 Recommended Setup for You

Since you want:
- ✅ No terminal running
- ✅ Access as a website
- ✅ Just for personal use

**I recommend: Vercel + Supabase**

**Time to deploy**: ~15 minutes
**Monthly cost**: $0
**Maintenance**: Automatic updates
**Access**: From anywhere, any device

This is the simplest, most reliable option that requires zero maintenance once set up!
