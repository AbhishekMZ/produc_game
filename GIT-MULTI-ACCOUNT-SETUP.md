# Git Multi-Account Setup Guide

This guide helps you manage multiple GitHub accounts and switch between them easily.

## 🔧 Method 1: Using Git Credential Manager (Recommended)

Windows Git Credential Manager allows you to store multiple credentials and switch automatically.

### Setup

1. **Check if Git Credential Manager is installed:**
```powershell
git credential-manager --version
```

If not installed, download from: https://github.com/git-ecosystem/git-credential-manager/releases

2. **Configure credential storage:**
```powershell
git config --global credential.helper manager
```

### How It Works

When you push to a repository:
- Git Credential Manager will prompt for credentials
- It stores them securely in Windows Credential Manager
- Next time, it uses the stored credentials automatically
- Different repos can use different accounts

### Switching Accounts

To use a different account for a specific push:
```powershell
# Remove stored credentials for GitHub
git credential-manager delete https://github.com

# Next push will prompt for new credentials
git push
```

---

## 🎯 Method 2: SSH Keys (Most Flexible)

Use different SSH keys for different accounts.

### Setup Account 1 (e.g., Personal - AbhishekMZ)

```powershell
# Generate SSH key for account 1
ssh-keygen -t ed25519 -C "your-personal-email@example.com" -f ~/.ssh/id_ed25519_personal

# Start SSH agent
Start-Service ssh-agent

# Add key to SSH agent
ssh-add ~/.ssh/id_ed25519_personal

# Copy public key to clipboard
Get-Content ~/.ssh/id_ed25519_personal.pub | Set-Clipboard
```

Go to GitHub (Account 1):
1. Settings → SSH and GPG keys
2. New SSH key
3. Paste and save

### Setup Account 2 (e.g., Work - mabhishekz-metaz)

```powershell
# Generate SSH key for account 2
ssh-keygen -t ed25519 -C "work-email@example.com" -f ~/.ssh/id_ed25519_work

# Add key to SSH agent
ssh-add ~/.ssh/id_ed25519_work

# Copy public key to clipboard
Get-Content ~/.ssh/id_ed25519_work.pub | Set-Clipboard
```

Go to GitHub (Account 2):
1. Settings → SSH and GPG keys
2. New SSH key
3. Paste and save

### Configure SSH Config File

Create/edit `~/.ssh/config`:

```powershell
# Create config file
New-Item -ItemType File -Path ~/.ssh/config -Force
notepad ~/.ssh/config
```

Add this content:

```
# Personal GitHub account
Host github.com-personal
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_personal
    IdentitiesOnly yes

# Work GitHub account
Host github.com-work
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_work
    IdentitiesOnly yes
```

### Using SSH with Different Accounts

**For Personal Account (AbhishekMZ):**
```powershell
# Clone with personal account
git clone git@github.com-personal:AbhishekMZ/produc_game.git

# Or change existing repo
git remote set-url origin git@github.com-personal:AbhishekMZ/produc_game.git
```

**For Work Account (mabhishekz-metaz):**
```powershell
# Clone with work account
git clone git@github.com-work:mabhishekz-metaz/some-repo.git

# Or change existing repo
git remote set-url origin git@github.com-work:mabhishekz-metaz/some-repo.git
```

**Set local Git config for each repo:**
```powershell
# In personal repo
git config user.name "AbhishekMZ"
git config user.email "personal@example.com"

# In work repo
git config user.name "mabhishekz-metaz"
git config user.email "mabhishekz.ai22@rvce.edu.in"
```

---

## 🚀 Method 3: GitHub CLI with Multiple Accounts

GitHub CLI supports multiple accounts.

### Setup

```powershell
# Install GitHub CLI
winget install --id GitHub.cli

# Login to first account
gh auth login
# Follow prompts, choose account 1

# Login to second account (adds to existing)
gh auth login --hostname github.com
# Follow prompts, choose account 2
```

### Switch Between Accounts

```powershell
# List logged-in accounts
gh auth status

# Switch account for current operation
gh auth switch

# Or specify account explicitly
gh repo clone AbhishekMZ/produc_game --auth-token YOUR_TOKEN
```

---

## 📋 Quick Reference: Current Project Setup

For your `produc_game` repository:

### Option A: Use SSH (Recommended for you)

```powershell
# Change to SSH URL with personal account
git remote set-url origin git@github.com-personal:AbhishekMZ/produc_game.git

# Set local config
git config user.name "AbhishekMZ"
git config user.email "your-github-email@example.com"

# Push (will use SSH key automatically)
git push -u origin main
```

### Option B: Use HTTPS with Credential Manager

```powershell
# Keep HTTPS URL
git remote -v
# origin  https://github.com/AbhishekMZ/produc_game.git

# Clear any cached credentials
git credential-manager delete https://github.com

# Push (will prompt for credentials)
git push -u origin main
# Enter: Username: AbhishekMZ
# Enter: Password: [your personal access token]
```

---

## 🎨 Best Practices

### Per-Repository Configuration

Always set user info per repository:

```powershell
# Navigate to repo
cd path/to/repo

# Set for this repo only (no --global flag)
git config user.name "Your Name"
git config user.email "your.email@example.com"

# Verify
git config user.name
git config user.email
```

### Global vs Local Config

```powershell
# Global (applies to all repos)
git config --global user.name "Default Name"

# Local (applies only to current repo)
git config user.name "Specific Name"

# Local config overrides global
```

### Check Current Configuration

```powershell
# See all config (global + local)
git config --list

# See where each config comes from
git config --list --show-origin

# See specific value
git config user.name
git config user.email
```

---

## 🔍 Troubleshooting

### "Permission denied" when pushing

**Problem**: Wrong account credentials cached

**Solution**:
```powershell
# Clear cached credentials
git credential-manager delete https://github.com

# Or for SSH
ssh-add -D  # Remove all keys
ssh-add ~/.ssh/id_ed25519_personal  # Add correct key
```

### "Author identity unknown"

**Problem**: Git user not configured for repo

**Solution**:
```powershell
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

### Check which account will be used

```powershell
# For HTTPS
git credential-manager get https://github.com

# For SSH
ssh -T git@github.com-personal
ssh -T git@github.com-work
```

---

## 💡 Recommended Setup for You

Based on your two accounts:

1. **Account 1 (Personal)**: AbhishekMZ
2. **Account 2 (Work/School)**: mabhishekz-metaz

**I recommend Method 2 (SSH Keys)** because:
- ✅ Most secure
- ✅ No password prompts
- ✅ Easy to switch between accounts
- ✅ Works automatically once set up
- ✅ No credential management needed

**Quick Start:**
1. Generate two SSH keys (5 minutes)
2. Add to respective GitHub accounts (2 minutes)
3. Create SSH config file (2 minutes)
4. Change remote URL for each repo (1 minute)

**Total setup time: ~10 minutes**
**Future benefit: Zero friction switching!**
