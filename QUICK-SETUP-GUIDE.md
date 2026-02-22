# Quick Multi-Account Git Setup

## ✅ What's Already Done

1. ✅ Git Credential Manager is enabled
2. ✅ This repo is configured for your personal account (AbhishekMZ)

## 🎯 Complete Setup in 3 Steps

### Step 1: Generate Personal Access Tokens (One-time setup)

You need tokens for both accounts:

**For AbhishekMZ (Personal Account):**
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Name: "FocusFlow Personal"
4. Select scopes: ✅ **repo** (all sub-options)
5. Click "Generate token"
6. **COPY THE TOKEN** (you won't see it again!)
7. Save it somewhere safe (e.g., password manager)

**For mabhishekz-metaz (Work/School Account):**
1. **Sign out** from GitHub
2. **Sign in** with mabhishekz-metaz account
3. Go to: https://github.com/settings/tokens
4. Click "Generate new token (classic)"
5. Name: "Work Projects"
6. Select scopes: ✅ **repo** (all sub-options)
7. Click "Generate token"
8. **COPY THE TOKEN**
9. Save it somewhere safe

### Step 2: Update Email for This Repo

Run this command with your actual personal email:

```powershell
git config user.email "your-actual-email@gmail.com"
```

Verify it's set:
```powershell
git config user.name   # Should show: AbhishekMZ
git config user.email  # Should show: your email
```

### Step 3: Push to GitHub (First Time)

```powershell
git push -u origin main
```

When prompted:
- **Username**: `AbhishekMZ`
- **Password**: `[paste your personal access token]`

Git Credential Manager will save these credentials automatically!

## 🔄 How to Switch Between Accounts

### For Your Personal Repos (AbhishekMZ)

When you clone or work on a personal repo:

```powershell
# Clone the repo
git clone https://github.com/AbhishekMZ/repo-name.git
cd repo-name

# Set local config (do this once per repo)
git config user.name "AbhishekMZ"
git config user.email "your-personal-email@gmail.com"

# Push/pull will use saved AbhishekMZ credentials automatically
git push
```

### For Your Work/School Repos (mabhishekz-metaz)

When you clone or work on a work repo:

```powershell
# Clone the repo
git clone https://github.com/mabhishekz-metaz/repo-name.git
cd repo-name

# Set local config (do this once per repo)
git config user.name "mabhishekz-metaz"
git config user.email "mabhishekz.ai22@rvce.edu.in"

# First time push will prompt for credentials
git push
# Username: mabhishekz-metaz
# Password: [paste work account token]

# After first time, credentials are saved!
```

## 🎨 How It Works

**Git Credential Manager stores credentials per repository URL:**
- Repos under `github.com/AbhishekMZ/*` → Uses AbhishekMZ token
- Repos under `github.com/mabhishekz-metaz/*` → Uses mabhishekz-metaz token

**No manual switching needed!** Git automatically uses the right credentials based on the repo URL.

## 🔍 Check Which Account Is Active

```powershell
# Check current repo config
git config user.name
git config user.email

# Check remote URL (determines which account is used)
git remote -v
```

## 🔧 Troubleshooting

### "Permission denied" or 403 error

**Problem**: Wrong credentials cached

**Solution**:
```powershell
# Clear all GitHub credentials
git credential-manager delete https://github.com

# Next push will prompt for credentials again
git push
```

### Need to use different account for same repo

**Problem**: Want to switch account for current repo

**Solution**:
```powershell
# Clear credentials for this repo
git credential-manager delete https://github.com

# Update local config
git config user.name "NewAccountName"
git config user.email "new-email@example.com"

# Push (will prompt for new credentials)
git push
```

### Check saved credentials

```powershell
# View all saved credentials
cmdkey /list | Select-String "git"
```

## 📝 Quick Reference

### Current Repo (produc_game)
- **Account**: AbhishekMZ (personal)
- **User**: `git config user.name` → AbhishekMZ
- **Email**: Update with: `git config user.email "your-email@example.com"`
- **Remote**: https://github.com/AbhishekMZ/produc_game.git

### Global Settings
- **Credential Helper**: manager (enabled ✅)
- **Default User**: mabhishekz-metaz (can be overridden per repo)
- **Default Email**: mabhishekz.ai22@rvce.edu.in (can be overridden per repo)

### Commands You'll Use Often

```powershell
# Check current repo settings
git config user.name
git config user.email
git remote -v

# Set for current repo only
git config user.name "YourName"
git config user.email "your@email.com"

# Clear cached credentials
git credential-manager delete https://github.com

# View credential manager
cmdkey /list | Select-String "git"
```

## ✨ Benefits of This Setup

✅ **No SSH keys needed** - Works with HTTPS  
✅ **Automatic switching** - Based on repo URL  
✅ **Secure storage** - Windows Credential Manager  
✅ **One-time setup** - Credentials saved per account  
✅ **Easy to clear** - Simple command to reset  
✅ **Works everywhere** - Any Git client on Windows  

## 🚀 Next Steps

1. **Generate both tokens** (5 minutes)
2. **Update email** for this repo (30 seconds)
3. **Push to GitHub** (will save credentials)
4. **Done!** Future pushes work automatically

**After setup, switching is automatic based on which repo you're working in!**
