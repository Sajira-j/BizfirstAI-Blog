# Blogifier Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying Blogifier updates to your production server.

---

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Deployment Steps](#deployment-steps)
3. [Post-Deployment Verification](#post-deployment-verification)
4. [Troubleshooting](#troubleshooting)
5. [Database Information](#database-information)
6. [Automated Deployment Script](#automated-deployment-script)

---

## Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] Built and tested the application locally
- [ ] Created a publish folder using `dotnet publish -c Release`
- [ ] Backed up the current server files (optional but recommended)
- [ ] Backed up the database file (`App_Data/blogifier.db`)
- [ ] Access to the server with admin privileges
- [ ] IIS Manager access or ability to restart the application

---

## Deployment Steps

### Step 1: Build and Publish the Application

**On your local machine:**

```bash
# Navigate to project directory
cd D:\BlogBizfirst\BizfirstAI-Blog\src\Blogifier

# Clean previous builds
dotnet clean

# Build in Release mode
dotnet build -c Release

# Publish to output folder
dotnet publish -c Release -o D:\BlogBizfirst\BizfirstAI-Blog\publish_new
```

**Expected Output:**
- All compiled files in `D:\BlogBizfirst\BizfirstAI-Blog\publish_new`
- DLL files including:
  - `Blogifier.dll`
  - `Blogifier.Admin.dll`
  - `Blogifier.Themes.Standard.dll`

---

### Step 2: Stop the Application on Server

**⚠️ CRITICAL: You MUST stop the application before copying files**

#### If using IIS:
1. Open **IIS Manager**
2. Navigate to **Application Pools**
3. Find your Blogifier application pool
4. Click **Stop** in the right panel
5. Wait until status shows "Stopped"

#### If using Windows Service:
```bash
net stop BlogifierService
```

#### If using Kestrel directly:
- Kill the process using Task Manager or:
```bash
taskkill /IM Blogifier.exe /F
```

**Why this is important:**
- Prevents file locks
- Ensures clean deployment
- Avoids "file in use" errors

---

### Step 3: Backup Current Server Files (Optional but Recommended)

**On the server:**

```bash
# Create backup folder with timestamp
mkdir C:\Backups\Blogifier_backup_2026-03-09

# Copy current application files
xcopy /E /Y "C:\inetpub\blogifier\*" "C:\Backups\Blogifier_backup_2026-03-09\"
```

**Important:** Always backup before deploying!

---

### Step 4: Delete Old Application Files

**⚠️ IMPORTANT: Do NOT delete the App_Data folder**

**On the server:**

#### Method A: Manual Deletion
1. Navigate to your server application folder (e.g., `C:\inetpub\blogifier`)
2. Select ALL files and folders **EXCEPT** `App_Data`
3. Press `Delete`
4. Empty Recycle Bin (optional)

#### Method B: Command Line
```bash
# Delete DLL files
del /q "C:\inetpub\blogifier\*.dll"

# Delete EXE files
del /q "C:\inetpub\blogifier\*.exe"

# Delete JSON files (except in App_Data)
del /q "C:\inetpub\blogifier\*.json"

# Delete other folders except App_Data
# Do this manually or with caution
```

**DO NOT DELETE:**
- `App_Data` folder (contains database and uploads)
- Any custom configuration files you've added

---

### Step 5: Copy New Publish Files to Server

**From your local machine to server:**

#### Method A: Network Copy
```bash
# Copy all files from publish folder to server
xcopy /E /Y "D:\BlogBizfirst\BizfirstAI-Blog\publish_new\*" "\\server\c$\inetpub\blogifier\"
```

#### Method B: Manual Copy
1. Open File Explorer
2. Navigate to `D:\BlogBizfirst\BizfirstAI-Blog\publish_new`
3. Select ALL files and folders
4. Copy (Ctrl+C)
5. Navigate to server folder (e.g., `\\server\c$\inetpub\blogifier\`)
6. Paste (Ctrl+V)
7. Wait for copy to complete (may take 2-5 minutes)

**What's being copied:**
- All DLL files (compiled code including your .cshtml changes)
- EXE files
- wwwroot folder (static files, CSS, JS)
- appsettings.json
- web.config
- Other runtime dependencies

---

### Step 6: Preserve App_Data Folder

**⚠️ CRITICAL STEP: Ensure database and uploads are preserved**

**On the server, verify:**

```bash
# Check if App_Data exists
dir C:\inetpub\blogifier\App_Data

# Verify database file exists
dir C:\inetpub\blogifier\App_Data\blogifier.db
```

**If App_Data is missing:**
1. Copy from your local machine:
```bash
xcopy /E /Y "D:\BlogBizfirst\BizfirstAI-Blog\src\Blogifier\App_Data\*" "\\server\c$\inetpub\blogifier\App_Data\"
```

**App_Data contains:**
- `blogifier.db` - SQLite database (login credentials, posts, subscribers)
- `logs/` - Application logs
- Uploaded images/files

---

### Step 7: Set Folder Permissions

**On the server:**

1. Right-click on the application folder (e.g., `C:\inetpub\blogifier`)
2. Select **Properties** → **Security**
3. Ensure these permissions exist:
   - `IIS_IUSRS` - Read & Execute
   - `NETWORK SERVICE` - Read & Execute
   - Application Pool Identity - Modify (for App_Data folder)

**For App_Data folder specifically:**
1. Right-click `C:\inetpub\blogifier\App_Data`
2. Select **Properties** → **Security**
3. Add/Modify permissions:
   - Application Pool Identity - **Full Control**
   - `IIS_IUSRS` - **Modify**

**Why this matters:**
- Application needs to read/write database
- Logs need to be written
- File uploads need write permissions

---

### Step 8: Restart the Application

#### If using IIS:
1. Open **IIS Manager**
2. Navigate to **Application Pools**
3. Select your Blogifier application pool
4. Click **Start** in the right panel
5. Wait 10-15 seconds for application to initialize

#### If using Windows Service:
```bash
net start BlogifierService
```

#### If using Kestrel directly:
```bash
cd C:\inetpub\blogifier
Blogifier.exe
```

**Monitor startup:**
- Check `App_Data\logs\` for any error messages
- First startup may take 15-30 seconds

---

### Step 9: Clear Browser Cache

**On your computer:**

#### Method A: Hard Refresh
- **Chrome/Edge:** Press `Ctrl + Shift + R` or `Ctrl + F5`
- **Firefox:** Press `Ctrl + Shift + R`
- **Safari:** Press `Cmd + Shift + R`

#### Method B: Clear All Cache
1. Press `Ctrl + Shift + Delete`
2. Select "Cached images and files"
3. Select "All time"
4. Click "Clear data"

#### Method C: Use Incognito/Private Mode
- Chrome: `Ctrl + Shift + N`
- Firefox: `Ctrl + Shift + P`
- Edge: `Ctrl + Shift + N`

**Why this is needed:**
- CSS/JS files may be cached
- Old HTML might be cached
- Ensures you see the latest version

---

## Post-Deployment Verification

### Checklist

- [ ] Website loads successfully (http://your-domain.com)
- [ ] Home page displays correctly
- [ ] Navigation links work (Home, Community, Categories)
- [ ] Login page accessible (http://your-domain.com/account)
- [ ] Can login with existing credentials
- [ ] Admin panel accessible (http://your-domain.com/admin)
- [ ] Newsletter subscribers list shows data (http://your-domain.com/admin/newsletter/subscribers/)
- [ ] Verify recent changes:
  - [ ] Home link redirects to main page (not external site)
  - [ ] Author names are clickable (link to LinkedIn)
  - [ ] Newsletter subscribers display without "/ / /" slashes
- [ ] Test creating a new post
- [ ] Test newsletter subscription
- [ ] Check browser console for errors (F12)

### Test the Changes We Made

1. **Newsletter Subscribers Page:**
   - Go to: http://your-domain.com/admin/newsletter/subscribers/
   - Verify: Email addresses show WITHOUT "/ / /" slashes
   - Expected: Clean email display only

2. **Home Link in Navigation:**
   - Click the "Home" link in top navigation
   - Verify: Redirects to your blog homepage (not external site)
   - Expected: Stays on same domain

3. **Author Names Link to LinkedIn:**
   - Go to any blog post
   - Click on author name "Binoy" or "Binoy Jose"
   - Verify: Opens LinkedIn profile in new tab
   - Expected URL: https://www.linkedin.com/in/binoyjose01/

---

## Troubleshooting

### Issue 1: Website Shows Old Version

**Symptoms:** Changes not visible, old content still showing

**Solutions:**
1. Hard refresh browser: `Ctrl + Shift + R`
2. Clear browser cache completely
3. Try incognito/private mode
4. Check if application restarted successfully:
   ```bash
   # In IIS Manager, verify application pool is running
   # Check Task Manager for Blogifier.exe process
   ```
5. Restart application pool again
6. Check `App_Data/logs/` for errors

---

### Issue 2: Cannot Login After Deployment

**Symptoms:** Login credentials don't work, "Invalid username or password"

**Root Cause:** Database file not copied or new database created

**Solutions:**
1. Check if database exists:
   ```bash
   dir C:\inetpub\blogifier\App_Data\blogifier.db
   ```
2. If missing, copy from local machine:
   ```bash
   copy "D:\BlogBizfirst\BizfirstAI-Blog\src\Blogifier\App_Data\blogifier.db" "\\server\c$\inetpub\blogifier\App_Data\"
   ```
3. Restart application
4. Try logging in again

---

### Issue 3: 500 Internal Server Error

**Symptoms:** White page with error 500

**Common Causes:**
- Missing DLL files
- Incorrect permissions on App_Data
- Database connection error
- Missing .NET runtime

**Solutions:**
1. Check Event Viewer for detailed error:
   - Windows → Event Viewer → Application
2. Check application logs:
   ```bash
   notepad C:\inetpub\blogifier\App_Data\logs\orchard-log.txt
   ```
3. Verify all files copied successfully
4. Check App_Data folder permissions
5. Verify .NET 8.0 runtime installed on server:
   ```bash
   dotnet --list-runtimes
   ```

---

### Issue 4: Static Files Not Loading (CSS/JS)

**Symptoms:** Website looks broken, no styling, images missing

**Solutions:**
1. Verify wwwroot folder exists and has files:
   ```bash
   dir C:\inetpub\blogifier\wwwroot
   ```
2. Check IIS Static Content feature is installed
3. Verify web.config exists and is correct
4. Check browser console (F12) for 404 errors
5. Clear browser cache

---

### Issue 5: Newsletter Subscribers Empty

**Symptoms:** Admin panel shows no subscribers, but they existed before

**Root Cause:** Database not copied correctly

**Solutions:**
1. Stop application
2. Replace database file:
   ```bash
   copy "D:\BlogBizfirst\BizfirstAI-Blog\src\Blogifier\App_Data\blogifier.db" "C:\inetpub\blogifier\App_Data\blogifier.db" /Y
   ```
3. Restart application
4. Refresh admin panel

---

### Issue 6: File Upload Errors

**Symptoms:** Cannot upload images, cannot create posts with images

**Root Cause:** Insufficient permissions on App_Data folder

**Solutions:**
1. Right-click `App_Data` folder → Properties → Security
2. Add Application Pool Identity with Full Control
3. Add `IIS_IUSRS` with Modify permission
4. Restart application
5. Try uploading again

---

## Database Information

### Database Location

**Local Development:**
```
D:\BlogBizfirst\BizfirstAI-Blog\src\Blogifier\App_Data\blogifier.db
```

**Production Server:**
```
C:\inetpub\blogifier\App_Data\blogifier.db
(or your custom path)
```

### Database Type
- **Type:** SQLite
- **File:** blogifier.db
- **Provider:** Microsoft.EntityFrameworkCore.Sqlite

### Important Tables

| Table Name | Description | Important Data |
|------------|-------------|----------------|
| `Users` | User accounts | Login credentials, profile info |
| `Posts` | Blog posts | All published content |
| `Subscribers` | Newsletter subscribers | Email addresses, subscription dates |
| `Categories` | Post categories | Category names |
| `Uploads` | File uploads | File metadata |

### Viewing Database Content

**Recommended Tools:**

1. **DB Browser for SQLite** (Free)
   - Download: https://sqlitebrowser.org/
   - Open `blogifier.db` file
   - View/edit all tables

2. **Visual Studio Code**
   - Install "SQLite" extension by alexcvzz
   - Right-click `.db` file → Open Database

3. **Online Viewer** (No installation)
   - https://inloop.github.io/sqlite-viewer/
   - Upload `blogifier.db` file
   - View tables in browser

### Database Backup

**Manual Backup:**
```bash
copy "C:\inetpub\blogifier\App_Data\blogifier.db" "C:\Backups\blogifier_backup_2026-03-09.db"
```

**Automated Backup Script:**
```batch
@echo off
set TIMESTAMP=%date:~-4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
copy "C:\inetpub\blogifier\App_Data\blogifier.db" "C:\Backups\blogifier_%TIMESTAMP%.db"
echo Database backed up successfully
```

---

## Automated Deployment Script

### Windows Batch Script (deploy.bat)

Create `deploy.bat` in your local machine:

```batch
@echo off
echo ========================================
echo Blogifier Deployment Script
echo ========================================
echo.

REM Configuration
set LOCAL_PUBLISH=D:\BlogBizfirst\BizfirstAI-Blog\publish_new
set LOCAL_APPDATA=D:\BlogBizfirst\BizfirstAI-Blog\src\Blogifier\App_Data
set SERVER_PATH=\\your-server\c$\inetpub\blogifier
set BACKUP_PATH=C:\Backups\Blogifier_backup_%date:~-4%%date:~-7,2%%date:~-10,2%

echo Step 1: Creating backup...
if not exist "%BACKUP_PATH%" mkdir "%BACKUP_PATH%"
xcopy /E /Y /I "%SERVER_PATH%\*" "%BACKUP_PATH%\"
echo Backup completed.
echo.

echo Step 2: Stopping application...
REM For IIS - use appcmd
REM %systemroot%\system32\inetsrv\appcmd stop apppool /apppool.name:"BlogifierAppPool"

REM For Windows Service
REM net stop BlogifierService

echo Application stopped.
echo.

echo Step 3: Deleting old files (preserving App_Data)...
pushd "%SERVER_PATH%"
for /d %%D in (*) do (
    if /I not "%%D"=="App_Data" (
        rd /s /q "%%D"
    )
)
for %%F in (*) do (
    del /q "%%F"
)
popd
echo Old files deleted.
echo.

echo Step 4: Copying new files...
xcopy /E /Y /I "%LOCAL_PUBLISH%\*" "%SERVER_PATH%\"
echo New files copied.
echo.

echo Step 5: Preserving database...
if not exist "%SERVER_PATH%\App_Data" mkdir "%SERVER_PATH%\App_Data"
if not exist "%SERVER_PATH%\App_Data\blogifier.db" (
    echo Database not found on server, copying from local...
    copy "%LOCAL_APPDATA%\blogifier.db" "%SERVER_PATH%\App_Data\blogifier.db"
)
echo Database preserved.
echo.

echo Step 6: Starting application...
REM For IIS
REM %systemroot%\system32\inetsrv\appcmd start apppool /apppool.name:"BlogifierAppPool"

REM For Windows Service
REM net start BlogifierService

echo Application started.
echo.

echo ========================================
echo Deployment completed successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Clear your browser cache (Ctrl + Shift + Delete)
echo 2. Visit your website to verify deployment
echo 3. Test login functionality
echo 4. Check admin panel for updates
echo.
pause
```

**Usage:**
1. Update the configuration variables at the top
2. Uncomment the appropriate start/stop commands for your setup
3. Run as Administrator:
   ```bash
   deploy.bat
   ```

---

## PowerShell Script (deploy.ps1)

Create `deploy.ps1` for more advanced deployments:

```powershell
# Blogifier Deployment Script
# Run as Administrator

param(
    [string]$ServerPath = "\\your-server\c$\inetpub\blogifier",
    [string]$LocalPublish = "D:\BlogBizfirst\BizfirstAI-Blog\publish_new",
    [string]$LocalAppData = "D:\BlogBizfirst\BizfirstAI-Blog\src\Blogifier\App_Data",
    [string]$AppPoolName = "BlogifierAppPool"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Blogifier Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Create Backup
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupPath = "C:\Backups\Blogifier_backup_$timestamp"
Write-Host "Step 1: Creating backup to $backupPath..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $backupPath -Force | Out-Null
Copy-Item -Path "$ServerPath\*" -Destination $backupPath -Recurse -Force
Write-Host "Backup completed." -ForegroundColor Green
Write-Host ""

# Step 2: Stop Application
Write-Host "Step 2: Stopping application..." -ForegroundColor Yellow
# For IIS
Import-Module WebAdministration
Stop-WebAppPool -Name $AppPoolName
Start-Sleep -Seconds 5
Write-Host "Application stopped." -ForegroundColor Green
Write-Host ""

# Step 3: Delete Old Files
Write-Host "Step 3: Deleting old files (preserving App_Data)..." -ForegroundColor Yellow
Get-ChildItem -Path $ServerPath | Where-Object { $_.Name -ne "App_Data" } | Remove-Item -Recurse -Force
Write-Host "Old files deleted." -ForegroundColor Green
Write-Host ""

# Step 4: Copy New Files
Write-Host "Step 4: Copying new files..." -ForegroundColor Yellow
Copy-Item -Path "$LocalPublish\*" -Destination $ServerPath -Recurse -Force
Write-Host "New files copied." -ForegroundColor Green
Write-Host ""

# Step 5: Preserve Database
Write-Host "Step 5: Checking database..." -ForegroundColor Yellow
if (!(Test-Path "$ServerPath\App_Data\blogifier.db")) {
    Write-Host "Database not found on server, copying from local..." -ForegroundColor Yellow
    Copy-Item -Path "$LocalAppData\blogifier.db" -Destination "$ServerPath\App_Data\blogifier.db" -Force
}
Write-Host "Database preserved." -ForegroundColor Green
Write-Host ""

# Step 6: Start Application
Write-Host "Step 6: Starting application..." -ForegroundColor Yellow
Start-WebAppPool -Name $AppPoolName
Start-Sleep -Seconds 10
Write-Host "Application started." -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Clear your browser cache (Ctrl + Shift + Delete)"
Write-Host "2. Visit your website to verify deployment"
Write-Host "3. Test login functionality"
Write-Host "4. Check admin panel for updates"
Write-Host ""
```

**Usage:**
```powershell
# Run as Administrator
.\deploy.ps1 -ServerPath "\\server\path" -AppPoolName "YourAppPool"
```

---

## Quick Reference

### Essential Paths

| Item | Local Path | Server Path |
|------|-----------|-------------|
| Publish Folder | `D:\BlogBizfirst\BizfirstAI-Blog\publish_new` | - |
| Database | `D:\BlogBizfirst\BizfirstAI-Blog\src\Blogifier\App_Data\blogifier.db` | `C:\inetpub\blogifier\App_Data\blogifier.db` |
| Logs | - | `C:\inetpub\blogifier\App_Data\logs\` |
| Uploads | - | `C:\inetpub\blogifier\App_Data\` |

### Essential Commands

```bash
# Build & Publish
dotnet clean
dotnet publish -c Release -o D:\BlogBizfirst\BizfirstAI-Blog\publish_new

# Stop/Start IIS App Pool
%systemroot%\system32\inetsrv\appcmd stop apppool /apppool.name:"BlogifierAppPool"
%systemroot%\system32\inetsrv\appcmd start apppool /apppool.name:"BlogifierAppPool"

# Copy to Server
xcopy /E /Y "D:\BlogBizfirst\BizfirstAI-Blog\publish_new\*" "\\server\c$\inetpub\blogifier\"

# Backup Database
copy "C:\inetpub\blogifier\App_Data\blogifier.db" "C:\Backups\blogifier_backup.db"
```

### Browser Shortcuts

| Action | Chrome/Edge | Firefox |
|--------|-------------|---------|
| Hard Refresh | Ctrl + Shift + R | Ctrl + Shift + R |
| Clear Cache | Ctrl + Shift + Delete | Ctrl + Shift + Delete |
| Incognito | Ctrl + Shift + N | Ctrl + Shift + P |
| Dev Tools | F12 | F12 |

---

## Support

### Log Files

Check these logs for errors:

1. **Application Logs:**
   ```
   C:\inetpub\blogifier\App_Data\logs\orchard-log.txt
   ```

2. **IIS Logs:**
   ```
   C:\inetpub\logs\LogFiles\
   ```

3. **Windows Event Viewer:**
   - Windows Key + R → `eventvwr`
   - Navigate to Windows Logs → Application

### Common Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| "File in use" | Application still running | Stop application first |
| "Access denied" | Permission issue | Run as Administrator |
| "Cannot find database" | Database missing | Copy App_Data folder |
| "500 Internal Server Error" | Application crash | Check logs |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-09 | Initial deployment guide |

---

**Document maintained by:** Blogifier Development Team
**Last updated:** 2026-03-09
