# Profile Image Functionality - Complete Analysis & Action Plan

**Date:** March 6, 2026
**Document Purpose:** Analysis of current profile functionality and implementation plan for profile image upload

---

## Table of Contents

1. [Current System Analysis](#1-current-system-analysis)
2. [Component Breakdown](#2-component-breakdown)
3. [Current Profile Image Functionality](#3-current-profile-image-functionality)
4. [Data Flow Analysis](#4-data-flow-analysis)
5. [Issues & Missing Functionality](#5-issues--missing-functionality)
6. [Action Plan: Enable Profile Image Upload](#6-action-plan-enable-profile-image-upload)
7. [Additional Enhancements](#7-additional-enhancements)
8. [Testing Plan](#8-testing-plan)
9. [Implementation Timeline](#9-implementation-timeline)

---

## 1. Current System Analysis

### 1.1 Overview

The BizfirstAI-Blog profile system allows users to:
- ✅ View their profile information
- ✅ Edit nickname, email, and bio
- ⚠️ **Has upload button for avatar but functionality is incomplete**
- ❌ Cannot actually upload/change profile picture from public profile page
- ✅ Profile picture stored in `UserInfo.Avatar` field (max 1024 characters)

---

### 1.2 File Structure

**Related Files:**

#### Frontend Files:
```
src/Blogifier.Themes.Standard/
├── Views/Themes/standard/
│   ├── profile.cshtml                    # Main profile edit page
│   └── layouts/_profile.cshtml           # Profile layout wrapper
└── assets/
    └── js/
        └── profile.js                     # Currently only has copy function
```

#### Backend Files:
```
src/Blogifier/
├── Controllers/
│   ├── AccountController.cs              # Profile GET/POST actions
│   └── StorageController.cs              # File upload handling (public)
├── Interfaces/
│   └── StorageController.cs              # API for storage upload
├── Identity/
│   └── UserInfo.cs                       # User entity with Avatar field
├── Storages/
│   └── StorageManager.cs                 # File upload logic
└── Shared/
    ├── Models/
    │   └── AccountProfileEditModel.cs    # Profile form model
    ├── Enums/
    │   └── UploadType.cs                 # Upload types (includes Avatar)
    └── Helper/
        └── PageHelper.cs                 # Avatar URL helper
```

#### Admin Files:
```
src/Blogifier.Admin/
└── assets/
    └── js/
        └── blogifier.js                  # fileManager with upload logic
```

---

### 1.3 Database Schema

**UserInfo Table (Users):**
```sql
CREATE TABLE Users (
    Id INT PRIMARY KEY IDENTITY(1,1),
    UserName NVARCHAR(256) NOT NULL,
    Email NVARCHAR(256),
    NickName NVARCHAR(256) NOT NULL,
    Avatar NVARCHAR(1024) NULL,           -- Stores avatar URL/path
    Bio NVARCHAR(2048) NULL,
    Gender NVARCHAR(32) NULL,
    Type INT NOT NULL,                     -- UserType enum
    State INT NOT NULL,                    -- UserState enum
    CreatedAt DATETIME2 NOT NULL,
    UpdatedAt DATETIME2 NOT NULL,
    -- ... (other Identity fields)
);
```

**Avatar Field:**
- **Type:** `NVARCHAR(1024)`
- **Nullable:** Yes
- **Purpose:** Stores the URL or file path to the user's profile picture
- **Default:** Falls back to default avatar via `PageHelper.CheckGetAvatarUrl()`

---

## 2. Component Breakdown

### 2.1 Profile View (profile.cshtml)

**Location:** `src/Blogifier.Themes.Standard/Views/Themes/standard/profile.cshtml`

**Purpose:** User profile edit page

**Key Components:**

#### Avatar Section (Lines 24-39)
```html
<div class="form-item">
  <label class="form-label mb-1">Avatar</label>
  <div class="d-flex">
    <!-- Current avatar display -->
    <img src="@PageHelper.CheckGetAvatarUrl(Model.Avatar)"
         width="39"
         height="39"
         class="profilePicture rounded me-3"
         alt="@Model.NickName" />

    <!-- Upload button -->
    <button class="btn btn-link"
            onclick="return fileManager.uploadClick('@UploadType.Avatar');"
            type="button"
            title="Upload">
      <svg><!-- Upload icon --></svg>
    </button>

    <!-- Reset button (currently non-functional) -->
    <button class="btn btn-link" type="button" title="Reset">
      <svg><!-- X icon --></svg>
    </button>
  </div>
</div>
```

**Form Structure:**
```html
<form method="post" asp-controller="account" asp-action="profile">
  <input type="hidden" asp-for="RedirectUri" />
  <input type="hidden" asp-for="IsProfile" />
  <input type="hidden" asp-for="Avatar" />    <!-- Hidden field stores avatar path -->

  <!-- Avatar UI (upload button) -->
  <!-- NickName input -->
  <!-- Email input -->
  <!-- Bio textarea -->

  <button type="submit">Save</button>
</form>
```

**What Works:**
- ✅ Displays current avatar (or default if none)
- ✅ Has upload button with icon
- ✅ Hidden field to store avatar value
- ✅ Form posts to `/account/profile`

**What Doesn't Work:**
- ❌ Upload button calls `fileManager.uploadClick()` which is from admin panel
- ❌ `fileManager` is NOT included in profile.js
- ❌ Reset button has no functionality
- ❌ No file input element in the page
- ❌ No actual upload mechanism on this page

---

### 2.2 Account Controller

**Location:** `src/Blogifier/Controllers/AccountController.cs`

**Relevant Methods:**

#### GET /account/profile (Lines 140-156)
```csharp
[Authorize]
[HttpGet("profile")]
public async Task<IActionResult> Profile([FromQuery] AccountModel parameter)
{
    var userId = User.FirstUserId();
    var user = await _userManager.FindByIdAsync(userId.ToString());

    var model = new AccountProfileEditModel
    {
        RedirectUri = parameter.RedirectUri,
        IsProfile = true,
        Email = user.Email,
        NickName = user.NickName,
        Avatar = user.Avatar,      // Gets current avatar
        Bio = user.Bio,
    };

    var data = await _blogManager.GetAsync();
    return View($"~/Views/Themes/{data.Theme}/profile.cshtml", model);
}
```

**What it does:**
1. Gets current user ID from claims
2. Loads user from database
3. Populates model with user data
4. Returns profile view

---

#### POST /account/profile (Lines 159-185)
```csharp
[Authorize]
[HttpPost("profile")]
public async Task<IActionResult> ProfileForm([FromForm] AccountProfileEditModel model)
{
    if (ModelState.IsValid)
    {
        var userId = User.FirstUserId();
        var user = await _userManager.FindByIdAsync(userId.ToString());

        if (user != null)
        {
            user.Email = model.Email;
            user.NickName = model.NickName;
            user.Avatar = model.Avatar;      // Updates avatar from hidden field
            user.Bio = model.Bio;

            var result = await _userManager.UpdateAsync(user);

            if (result.Succeeded)
            {
                await _signInManager.SignInAsync(user, isPersistent: true);
            }
            else
            {
                model.Error = result.Errors.FirstOrDefault()?.Description;
            }
        }
    }

    var data = await _blogManager.GetAsync();
    return View($"~/Views/Themes/{data.Theme}/profile.cshtml", model);
}
```

**What it does:**
1. Validates form data
2. Gets user from database
3. Updates user fields (including Avatar)
4. Saves to database
5. Re-signs in user (updates claims)
6. Returns view with result

**Important Note:** This method WILL save the avatar if the hidden field has a value, but there's no way for users to populate that field on the public profile page.

---

### 2.3 Profile Model

**Location:** `src/Blogifier.Shared/Models/AccountProfileEditModel.cs`

```csharp
public class AccountProfileEditModel : AccountProfileModel
{
    public string? Error { get; set; }

    [Required]
    [EmailAddress]
    public string? Email { get; set; }

    [Required]
    public string NickName { get; set; }

    public string? Avatar { get; set; }      // Avatar URL/path (nullable)

    public string? Bio { get; set; }
}
```

**Validation:**
- Email: Required, must be valid email format
- NickName: Required
- Avatar: Optional (can be null)
- Bio: Optional

---

### 2.4 File Upload System (Admin)

**Location:** `src/Blogifier.Admin/assets/js/blogifier.js`

**fileManager Object (Lines 20-135):**

```javascript
window.fileManager = function (dataService) {
  let inputFile = document.getElementById('frmUploadFile');
  let frmUpload = document.getElementById('frmUpload');
  let callBack;
  let uplType;
  let postId;

  function uploadClick(uploadType, id) {
    uplType = uploadType;

    if (uploadType === 'AppCover') { callBack = appCoverCallback; }
    if (uploadType === 'PostImage') { callBack = insertImgCallback; }
    if (uploadType === 'PostCover') { callBack = postCoverCallback; postId = id; }
    if (uploadType === 'Avatar') { callBack = userAvatarCallback; }  // ← Avatar handler

    inputFile.click();        // Triggers hidden file input
    return false;
  }

  function uploadSubmit() {
    let data = new FormData(frmUpload);
    let url = postId > 0
      ? `api/storage/upload/${uplType}?postId=${postId}`
      : `api/storage/upload/${uplType}`;
    dataService.upload(url, data, callBack, fail);
  }

  function userAvatarCallback(data) {
    // Update all images with class 'profilePicture'
    let profilePicture = document.querySelectorAll('.profilePicture');
    for (i = 0; i < profilePicture.length; i++) {
      profilePicture[i].src = data;    // Sets image source to uploaded file URL
    }
  }

  return {
    uploadClick: uploadClick,
    uploadSubmit: uploadSubmit,
    clipBoardUpload: clipBoardUpload,
  };
}(DataService);
```

**How It Works in Admin Panel:**
1. User clicks upload button → calls `uploadClick('Avatar')`
2. Sets callback to `userAvatarCallback`
3. Clicks hidden file input (`frmUploadFile`)
4. User selects file
5. Form submits automatically
6. Uploads to `/api/storage/upload/Avatar`
7. Callback updates all `.profilePicture` images with new URL

**Why It Doesn't Work on Profile Page:**
- ❌ `fileManager` only included in admin panel (`blogifier.js`)
- ❌ Profile page includes `profile.js` which doesn't have `fileManager`
- ❌ No hidden file input (`<input type="file" id="frmUploadFile">`) on profile page
- ❌ No hidden form (`<form id="frmUpload">`) on profile page

---

### 2.5 Storage Upload API

**Location:** `src/Blogifier/Interfaces/StorageController.cs`

```csharp
[Route("api/storage")]
[ApiController]
[Authorize]                    // Requires authentication
public class StorageController : ControllerBase
{
    [HttpPost("upload")]
    public async Task<StorageDto?> Upload([FromForm] IFormFile file)
    {
        var userId = User.FirstUserId();
        var currTime = DateTime.UtcNow;
        return await _storageManager.UploadAsync(currTime, userId, file);
    }
}
```

**What it does:**
1. Receives file upload via POST
2. Gets current user ID
3. Calls StorageManager to save file
4. Returns StorageDto with file URL/path

**Returns (StorageDto):**
```json
{
  "slug": "/data/1/20263/filename.jpg",
  "name": "filename.jpg",
  "path": "1/20263/filename.jpg",
  "contentType": "image/jpeg"
}
```

---

### 2.6 Storage Manager

**Location:** `src/Blogifier/Storages/StorageManager.cs`

**Upload Method (Lines 80-96):**
```csharp
public async Task<StorageDto?> UploadAsync(DateTime uploadAt, int userid, IFormFile file)
{
    var fileName = GetFileName(file.FileName);

    // Validate file extension
    if (!InvalidFileName(fileName))
    {
        _logger.LogError("Invalid file name: {fileName}", fileName);
        return null;
    }

    // Create path: {userId}/{year}{month}/{filename}
    var path = $"{userid}/{uploadAt.Year}{uploadAt.Month}/{fileName}";

    // Check if file already exists
    var storage = await _storageProvider.GetCheckStoragAsync(path);
    if (storage != null) return storage;

    // Upload file
    var stream = file.OpenReadStream();
    storage = await _storageProvider.AddAsync(uploadAt, userid, path, fileName, stream, file.ContentType);

    return storage;
}
```

**File Storage Structure:**
```
/data/
  └── {userId}/           # User ID folder
      └── {year}{month}/  # e.g., 20263 (2026, March)
          └── {filename}  # e.g., avatar.jpg
```

**Example Path:** `/data/1/20263/avatar_123.jpg`

---

### 2.7 Upload Types

**Location:** `src/Blogifier.Shared/Enums/UploadType.cs`

```csharp
public enum UploadType
{
    Avatar,         // User profile picture
    Attachement,    // File attachments
    AppLogo,        // Application logo
    PostCover,      // Blog post cover image
    PostImage       // Images in blog posts
}
```

**Usage:** Determines upload type for routing and callbacks

---

### 2.8 Page Helper

**Location:** `src/Blogifier.Shared/Helper/PageHelper.cs`

```csharp
public static class PageHelper
{
    public static string CheckGetAvatarUrl(string? avatar)
    {
        if (!string.IsNullOrEmpty(avatar)) return avatar;
        return BlogifierSharedConstant.DefaultAvatar;
    }
}
```

**Purpose:** Returns avatar URL or falls back to default avatar

**Default Avatar:** Defined in `BlogifierSharedConstant.DefaultAvatar`

---

## 3. Current Profile Image Functionality

### 3.1 What Currently Works

**Viewing Avatar:**
```
1. User navigates to /account/profile
2. AccountController.Profile() loads user data
3. profile.cshtml displays current avatar:
   - If user.Avatar has value → displays that image
   - If user.Avatar is null → displays default avatar
4. Image rendered: <img src="{avatar-url}" class="profilePicture" />
```

**Storing Avatar (If You Manually Set It):**
```
1. If you manually populate the hidden Avatar field (via browser dev tools)
2. Submit the form
3. AccountController.ProfileForm() will save it
4. user.Avatar gets updated in database
5. Next page load will show the new avatar
```

---

### 3.2 What Doesn't Work

**Uploading Avatar:**
```
❌ Problem: Upload button calls fileManager.uploadClick('@UploadType.Avatar')
❌ Issue: fileManager is NOT defined in profile.js
❌ Result: JavaScript error when clicking upload
❌ Consequence: No file selection dialog appears
```

**Browser Console Error (When Clicking Upload):**
```javascript
Uncaught ReferenceError: fileManager is not defined
    at HTMLButtonElement.onclick (profile:29)
```

**Reset Button:**
```
❌ Problem: Button has no onclick handler
❌ Consequence: Clicking does nothing
❌ Expected: Should clear avatar (set to default)
```

---

### 3.3 Why It's Incomplete

The profile page was designed to use the same upload mechanism as the admin panel, but:

1. **Missing JavaScript:** `fileManager` is in `blogifier.js` (admin only), not in `profile.js`
2. **Missing HTML Elements:** No hidden file input or upload form on profile page
3. **No Integration:** Profile page doesn't include admin JavaScript files
4. **Assumption:** Developer probably assumed they'd copy the functionality later but never did

---

## 4. Data Flow Analysis

### 4.1 Current Flow (Read-Only)

```
┌─────────────────────────────────────────────────────┐
│              VIEW AVATAR (WORKS)                     │
└─────────────────────────────────────────────────────┘

1. User → Navigate to /account/profile

2. Browser → GET /account/profile

3. AccountController
   └─→ Load user from database
   └─→ Get user.Avatar value
   └─→ Create AccountProfileEditModel
       └─→ model.Avatar = user.Avatar

4. View (profile.cshtml)
   └─→ PageHelper.CheckGetAvatarUrl(Model.Avatar)
       └─→ IF Model.Avatar has value: return Model.Avatar
       └─→ IF Model.Avatar is null: return DefaultAvatar

5. Browser
   └─→ Renders: <img src="{avatar-url}" />
   └─→ Displays image to user
```

---

### 4.2 Intended Flow (Upload - Currently Broken)

```
┌─────────────────────────────────────────────────────┐
│         UPLOAD AVATAR (DOESN'T WORK)                 │
└─────────────────────────────────────────────────────┘

1. User → Click upload button

2. JavaScript (EXPECTED)
   └─→ fileManager.uploadClick('Avatar')  ← ERROR: Not defined!

   (If it worked, should do:)
   └─→ Open file picker
   └─→ User selects image
   └─→ Upload to /api/storage/upload/Avatar
   └─→ Receive uploaded file URL
   └─→ Update .profilePicture src
   └─→ Update hidden Avatar field with new URL

3. User → Click Save button

4. Form POST → /account/profile
   └─→ model.Avatar contains new URL

5. AccountController.ProfileForm()
   └─→ user.Avatar = model.Avatar
   └─→ Save to database

6. Page Reload
   └─→ New avatar displayed
```

---

### 4.3 Admin Panel Flow (How It Works There)

```
┌─────────────────────────────────────────────────────┐
│    ADMIN AVATAR UPLOAD (WORKS IN ADMIN PANEL)       │
└─────────────────────────────────────────────────────┘

1. User → Click upload in admin panel

2. JavaScript (blogifier.js)
   └─→ fileManager.uploadClick('Avatar')
   └─→ Set callback: userAvatarCallback
   └─→ Click hidden file input: #frmUploadFile

3. Browser
   └─→ File picker opens
   └─→ User selects image file

4. JavaScript
   └─→ Form #frmUpload auto-submits
   └─→ POST /api/storage/upload/Avatar
       FormData: { file: [image file] }

5. StorageController.Upload()
   └─→ Get user ID
   └─→ StorageManager.UploadAsync()
       └─→ Validate file extension
       └─→ Create path: {userId}/{yearMonth}/{filename}
       └─→ Save file to storage
       └─→ Return StorageDto with URL

6. JavaScript Callback (userAvatarCallback)
   └─→ Receive uploaded file URL
   └─→ Update all .profilePicture elements:
       profilePicture[i].src = uploadedUrl

7. Visual Update
   └─→ Avatar image changes immediately
```

---

## 5. Issues & Missing Functionality

### 5.1 Critical Issues

#### Issue #1: fileManager Not Defined on Profile Page
**Severity:** CRITICAL
**Impact:** Upload button completely non-functional
**File:** `profile.cshtml` line 29
**Error:** `Uncaught ReferenceError: fileManager is not defined`

**Root Cause:**
- Profile page includes `profile.js` which only has a copy function
- `fileManager` is defined in `blogifier.js` (admin panel only)
- `blogifier.js` is NOT included in profile page

---

#### Issue #2: Missing File Upload Form Elements
**Severity:** CRITICAL
**Impact:** Even if fileManager was available, no way to select files

**Missing Elements:**
```html
<!-- These exist in admin panel layout but NOT in profile page -->
<form id="frmUpload" style="display:none">
  <input type="file" id="frmUploadFile" name="file" onchange="fileManager.uploadSubmit()" />
</form>
```

**Required For:**
- File selection dialog
- File upload submission
- FormData construction

---

#### Issue #3: Reset Button Non-Functional
**Severity:** MEDIUM
**Impact:** Users can't reset to default avatar

**Current Code:**
```html
<button class="btn btn-link" type="button" title="Reset">
  <svg><!-- X icon --></svg>
</button>
```

**Missing:** No `onclick` handler or functionality

---

#### Issue #4: No Visual Feedback During Upload
**Severity:** LOW
**Impact:** User doesn't know if upload is in progress

**Missing:**
- Loading spinner
- Progress indicator
- Upload status messages

---

### 5.2 Usability Issues

#### No Crop/Resize Functionality
- Users can upload images of any size
- No aspect ratio enforcement
- No image preview before upload
- Large images may look distorted

#### No File Validation
- No client-side file type checking
- No file size limit indicator
- Server validates, but user gets error after upload attempt

#### No Delete Avatar Option
- Can replace avatar, but can't remove it entirely
- No "use default avatar" button
- Reset button exists but doesn't work

---

### 5.3 Design Inconsistencies

#### Different Upload Mechanisms
- Admin panel: Fancy file manager with instant preview
- Profile page: Broken upload button
- Should have consistent UX

#### Hidden Field Approach
- Avatar stored in hidden field
- Updated via JavaScript before form submit
- Could be more robust (direct upload on selection)

---

## 6. Action Plan: Enable Profile Image Upload

### Goal
Implement functional profile image upload on the public profile page (`/account/profile`)

### Approach Options

**Option A: Copy Admin fileManager (Recommended)**
- Copy upload logic from `blogifier.js` to `profile.js`
- Add missing HTML elements
- Minimal changes to existing code

**Option B: Create Dedicated Profile Upload**
- Build new, simpler upload mechanism
- Tailored specifically for profile page
- More maintainable

**Option C: Extract Shared Upload Module**
- Create reusable upload component
- Use in both admin and profile
- Best long-term solution, more work upfront

**Chosen Approach: Option A** (quickest path to working solution)

---

### Phase 1: Add Missing HTML Elements

**Goal:** Add file upload form to profile page

**File:** `src/Blogifier.Themes.Standard/Views/Themes/standard/profile.cshtml`

**Step 1.1: Add Hidden File Upload Form**

Add after the form tag (around line 21):

```html
@section FooterScript {
  <!-- Hidden upload form for avatar -->
  <form id="frmUpload" style="display:none">
    <input type="file"
           id="frmUploadFile"
           name="file"
           accept="image/*"
           onchange="profileUploader.uploadSubmit()" />
  </form>

  <script src="~/_content/@ThemesStandardConstant.AssemblyName/js/profile.js"></script>
}
```

**What This Does:**
- Creates hidden form for file uploads
- File input restricted to images only (`accept="image/*"`)
- Triggers upload when file selected (`onchange`)
- Calls `profileUploader.uploadSubmit()` (we'll create this next)

---

### Phase 2: Create Profile Upload JavaScript

**Goal:** Add upload functionality to profile.js

**File:** `src/Blogifier.Themes.Standard/assets/js/profile.js`

**Step 2.1: Replace Entire File Content**

```javascript
// Profile Page Upload Manager
window.profileUploader = (function() {

  let inputFile = null;
  let avatarHiddenField = null;
  let profileImages = null;

  // Initialize on page load
  function init() {
    inputFile = document.getElementById('frmUploadFile');
    avatarHiddenField = document.querySelector('input[name="Avatar"]');
    profileImages = document.querySelectorAll('.profilePicture');

    // Check if elements exist
    if (!inputFile || !avatarHiddenField) {
      console.error('Required elements not found for profile uploader');
      return false;
    }

    return true;
  }

  // Triggered when upload button clicked
  function uploadClick() {
    if (!inputFile) {
      console.error('File input not initialized');
      return false;
    }

    // Open file picker
    inputFile.click();
    return false;
  }

  // Triggered when file selected
  function uploadSubmit() {
    const file = inputFile.files[0];

    if (!file) {
      console.error('No file selected');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      inputFile.value = ''; // Clear selection
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      alert('File size must be less than 5MB');
      inputFile.value = ''; // Clear selection
      return;
    }

    // Show loading state
    showUploadProgress(true);

    // Create FormData
    const formData = new FormData();
    formData.append('file', file);

    // Upload to server
    fetch('/api/storage/upload', {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type - browser will set it with boundary for FormData
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      // Success - data is StorageDto
      uploadSuccess(data.slug);
    })
    .catch(error => {
      uploadError(error);
    })
    .finally(() => {
      showUploadProgress(false);
      inputFile.value = ''; // Clear file input
    });
  }

  // Upload succeeded
  function uploadSuccess(imageUrl) {
    console.log('Avatar uploaded successfully:', imageUrl);

    // Update hidden field with new URL
    if (avatarHiddenField) {
      avatarHiddenField.value = imageUrl;
    }

    // Update all profile images
    if (profileImages) {
      profileImages.forEach(img => {
        img.src = imageUrl;
      });
    }

    // Show success message
    showMessage('Avatar updated! Click Save to keep changes.', 'success');
  }

  // Upload failed
  function uploadError(error) {
    console.error('Avatar upload failed:', error);
    showMessage('Failed to upload avatar. Please try again.', 'error');
  }

  // Show/hide upload progress
  function showUploadProgress(show) {
    const uploadBtn = document.querySelector('button[onclick*="uploadClick"]');

    if (uploadBtn) {
      if (show) {
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Uploading...';
      } else {
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = `
          <svg width="18" height="18" class="bi bi-arrow-up-circle">
            <use xlink:href="/_content/Blogifier.Themes.Standard/img/icon-sprites.svg#bi-arrow-up-circle"></use>
          </svg>`;
      }
    }
  }

  // Show temporary message
  function showMessage(message, type) {
    // Create message element
    const msgDiv = document.createElement('div');
    msgDiv.className = `alert alert-${type === 'success' ? 'success' : 'danger'} mt-2`;
    msgDiv.textContent = message;

    // Insert after avatar section
    const avatarSection = document.querySelector('.form-item');
    if (avatarSection) {
      avatarSection.appendChild(msgDiv);

      // Auto-remove after 5 seconds
      setTimeout(() => {
        msgDiv.remove();
      }, 5000);
    }
  }

  // Reset avatar to default
  function resetAvatar() {
    if (!confirm('Reset to default avatar? You must click Save to apply.')) {
      return false;
    }

    // Clear hidden field
    if (avatarHiddenField) {
      avatarHiddenField.value = '';
    }

    // Update images to default
    const defaultAvatar = '/img/avatar-placeholder.svg'; // Update with your default avatar path
    if (profileImages) {
      profileImages.forEach(img => {
        img.src = defaultAvatar;
      });
    }

    showMessage('Avatar reset to default. Click Save to keep changes.', 'success');
    return false;
  }

  // Initialize on page load
  document.addEventListener('DOMContentLoaded', function() {
    init();
  });

  // Public API
  return {
    uploadClick: uploadClick,
    uploadSubmit: uploadSubmit,
    resetAvatar: resetAvatar
  };

})();
```

---

### Phase 3: Update Profile View

**Goal:** Connect buttons to new JavaScript functions

**File:** `src/Blogifier.Themes.Standard/Views/Themes/standard/profile.cshtml`

**Step 3.1: Update Upload Button (Line 29)**

```html
<!-- BEFORE -->
<button class="btn btn-link"
        onclick="return fileManager.uploadClick('@UploadType.Avatar');"
        type="button">

<!-- AFTER -->
<button class="btn btn-link"
        onclick="return profileUploader.uploadClick();"
        type="button"
        title="@_localizer["upload"]"
        data-bs-toggle="tooltip">
```

**Step 3.2: Update Reset Button (Line 34)**

```html
<!-- BEFORE -->
<button class="btn btn-link" type="button" title="Reset">

<!-- AFTER -->
<button class="btn btn-link"
        onclick="return profileUploader.resetAvatar();"
        type="button"
        title="@_localizer["reset"]"
        data-bs-toggle="tooltip">
```

**Step 3.3: Add Hidden Upload Form (After line 21)**

```html
<!-- Add this after opening <div class="section-content -half"> -->
<!-- Hidden upload form -->
<form id="frmUpload" style="display:none">
  <input type="file"
         id="frmUploadFile"
         name="file"
         accept="image/jpeg,image/png,image/gif,image/webp"
         onchange="profileUploader.uploadSubmit()" />
</form>
```

---

### Phase 4: Add Default Avatar Constant

**Goal:** Define default avatar path

**File:** `src/Blogifier.Shared/BlogifierSharedConstant.cs`

**Step 4.1: Verify Default Avatar Exists**

Check if `DefaultAvatar` constant is defined:

```csharp
public static class BlogifierSharedConstant
{
    // ... other constants ...

    public const string DefaultAvatar = "/img/avatar-default.svg";  // Update path as needed
}
```

If not defined, add it.

**Step 4.2: Place Default Avatar File**

Ensure default avatar image exists at:
```
src/Blogifier.Themes.Standard/wwwroot/img/avatar-default.svg
```

Or update the constant to match your existing default avatar location.

---

### Phase 5: Build and Test

**Step 5.1: Build Project**

```bash
cd D:\BlogBizfirst\BizfirstAI-Blog
dotnet build
```

**Expected:** 0 errors

**Step 5.2: Run Application**

```bash
cd src/Blogifier
dotnet run
```

**Step 5.3: Manual Testing Checklist**

1. **View Profile**
   - [ ] Navigate to `/account/profile`
   - [ ] Current avatar displays correctly
   - [ ] Default avatar shows if no avatar set

2. **Upload Avatar**
   - [ ] Click upload button
   - [ ] File picker opens
   - [ ] Select image file (JPG, PNG, GIF)
   - [ ] Image uploads (see loading state)
   - [ ] Success message appears
   - [ ] Avatar preview updates immediately
   - [ ] Hidden field populated with new URL

3. **Save Profile**
   - [ ] Click Save button
   - [ ] Profile saves successfully
   - [ ] Refresh page
   - [ ] New avatar persists

4. **Reset Avatar**
   - [ ] Click reset button
   - [ ] Confirmation dialog appears
   - [ ] Click OK
   - [ ] Avatar changes to default
   - [ ] Click Save
   - [ ] Refresh page
   - [ ] Default avatar persists

5. **Error Handling**
   - [ ] Try uploading non-image file → Error message
   - [ ] Try uploading file > 5MB → Error message
   - [ ] Disconnect internet, try upload → Error message

---

## 7. Additional Enhancements

### Enhancement 1: Image Cropping

**Goal:** Allow users to crop/resize uploaded images

**Implementation:**

Add image cropping library (e.g., Cropper.js)

**File:** `profile.cshtml`

```html
@section HeaderScript {
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.js"></script>
}
```

**JavaScript Update:**

```javascript
// After file selected, show crop modal
function showCropModal(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    // Create modal with image
    const modal = createCropModal(e.target.result);
    document.body.appendChild(modal);

    // Initialize cropper
    const image = modal.querySelector('img');
    const cropper = new Cropper(image, {
      aspectRatio: 1,
      viewMode: 1,
      minCropBoxWidth: 100,
      minCropBoxHeight: 100,
    });

    // On crop confirm
    modal.querySelector('.btn-confirm').onclick = function() {
      cropper.getCroppedCanvas({
        width: 200,
        height: 200
      }).toBlob(function(blob) {
        uploadCroppedImage(blob);
        modal.remove();
      });
    };
  };
  reader.readAsDataURL(file);
}
```

---

### Enhancement 2: Drag & Drop Upload

**Goal:** Allow dragging image onto avatar

**Implementation:**

```javascript
// Add to profileUploader
function initDragDrop() {
  const dropZone = document.querySelector('.profilePicture').parentElement;

  dropZone.addEventListener('dragover', function(e) {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', function(e) {
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', function(e) {
    e.preventDefault();
    dropZone.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  });
}
```

**CSS:**
```css
.drag-over {
  border: 2px dashed #007bff;
  background: rgba(0, 123, 255, 0.1);
}
```

---

### Enhancement 3: Avatar Gallery/Presets

**Goal:** Let users choose from preset avatars

**Implementation:**

**Database:** Add `AvatarPresets` table

```sql
CREATE TABLE AvatarPresets (
    Id INT PRIMARY KEY IDENTITY,
    Name NVARCHAR(100),
    Url NVARCHAR(500),
    Category NVARCHAR(50),
    IsActive BIT DEFAULT 1
);
```

**Seed Data:**
```sql
INSERT INTO AvatarPresets (Name, Url, Category) VALUES
('Default Avatar', '/img/avatars/default.svg', 'System'),
('Avatar 1', '/img/avatars/preset1.png', 'Presets'),
('Avatar 2', '/img/avatars/preset2.png', 'Presets');
```

**UI:**
```html
<div class="avatar-gallery">
  <h6>Choose from presets:</h6>
  <div class="avatars-grid">
    @foreach (var preset in Model.AvatarPresets)
    {
      <img src="@preset.Url"
           class="avatar-preset"
           onclick="selectPreset('@preset.Url')" />
    }
  </div>
</div>
```

---

### Enhancement 4: Webcam Capture

**Goal:** Take photo with webcam for avatar

**Implementation:**

```javascript
function initWebcam() {
  const video = document.createElement('video');
  const canvas = document.createElement('canvas');

  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
      video.srcObject = stream;
      video.play();
    });

  // Capture button click
  document.getElementById('captureBtn').onclick = function() {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    canvas.toBlob(blob => {
      uploadCroppedImage(blob);
    });
  };
}
```

---

### Enhancement 5: Profile Image Versions

**Goal:** Store multiple sizes for performance

**Implementation:**

**StorageManager Update:**

```csharp
public async Task<Dictionary<string, string>> UploadAvatarWithSizes(IFormFile file, int userId)
{
    var urls = new Dictionary<string, string>();

    // Original
    var original = await UploadAsync(DateTime.UtcNow, userId, file);
    urls["original"] = original.Slug;

    // Resize and upload different sizes
    using var image = Image.Load(file.OpenReadStream());

    // Thumbnail (50x50)
    var thumb = ResizeImage(image, 50, 50);
    urls["thumbnail"] = await UploadResizedImage(thumb, userId, "thumb");

    // Medium (200x200)
    var medium = ResizeImage(image, 200, 200);
    urls["medium"] = await UploadResizedImage(medium, userId, "medium");

    return urls;
}
```

**Database Update:**

Add columns to Users table:
```sql
ALTER TABLE Users ADD AvatarThumbnail NVARCHAR(1024);
ALTER TABLE Users ADD AvatarMedium NVARCHAR(1024);
```

---

## 8. Testing Plan

### 8.1 Unit Tests

**Test File:** `tests/Blogifier.Tests/Profile/ProfileUploadTests.cs`

```csharp
public class ProfileUploadTests
{
    [Fact]
    public async Task UploadAvatar_ValidImage_ReturnsStorageDto()
    {
        // Arrange
        var file = CreateMockImageFile("test.jpg", "image/jpeg");
        var controller = new StorageController(mockProvider, mockManager);

        // Act
        var result = await controller.Upload(file);

        // Assert
        Assert.NotNull(result);
        Assert.Contains("/data/", result.Slug);
    }

    [Fact]
    public async Task UploadAvatar_FileTooLarge_ReturnsNull()
    {
        // Arrange
        var file = CreateMockImageFile("huge.jpg", "image/jpeg", 10 * 1024 * 1024); // 10MB

        // Act
        var result = await storageManager.UploadAsync(DateTime.Now, 1, file);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task UploadAvatar_InvalidFileType_ReturnsNull()
    {
        // Arrange
        var file = CreateMockImageFile("virus.exe", "application/exe");

        // Act
        var result = await storageManager.UploadAsync(DateTime.Now, 1, file);

        // Assert
        Assert.Null(result);
    }
}
```

---

### 8.2 Integration Tests

**Test File:** `tests/Blogifier.Tests/Profile/ProfileIntegrationTests.cs`

```csharp
public class ProfileIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task UploadAndSaveAvatar_EndToEnd_Success()
    {
        // 1. Login
        var client = _factory.CreateClient();
        await LoginAsync(client);

        // 2. Upload avatar
        var uploadResponse = await UploadImageAsync(client, "avatar.jpg");
        var storageDto = await uploadResponse.Content.ReadFromJsonAsync<StorageDto>();

        // 3. Update profile with new avatar
        var profileData = new FormUrlEncodedContent(new[]
        {
            new KeyValuePair<string, string>("Avatar", storageDto.Slug),
            new KeyValuePair<string, string>("NickName", "Test User"),
            new KeyValuePair<string, string>("Email", "test@example.com")
        });

        var saveResponse = await client.PostAsync("/account/profile", profileData);

        // 4. Verify avatar saved
        var getResponse = await client.GetAsync("/account/profile");
        var html = await getResponse.Content.ReadAsStringAsync();

        Assert.Contains(storageDto.Slug, html);
    }
}
```

---

### 8.3 Manual Test Cases

**Test Case 1: Upload JPG Image**
- **Steps:**
  1. Navigate to `/account/profile`
  2. Click upload button
  3. Select JPG image (< 5MB)
  4. Verify image uploads
  5. Verify preview updates
  6. Click Save
  7. Refresh page
- **Expected:** New avatar displays and persists

**Test Case 2: Upload PNG with Transparency**
- **Steps:**
  1. Upload PNG with transparent background
  2. Verify transparency preserved
  3. Save and reload
- **Expected:** Transparency maintained

**Test Case 3: Upload Oversized Image**
- **Steps:**
  1. Try to upload 10MB image
  2. Observe error message
- **Expected:** "File size must be less than 5MB"

**Test Case 4: Upload Non-Image File**
- **Steps:**
  1. Try to upload .pdf file
  2. Observe error message
- **Expected:** "Please select an image file"

**Test Case 5: Reset Avatar**
- **Steps:**
  1. Upload custom avatar
  2. Save
  3. Click reset button
  4. Confirm dialog
  5. Save
  6. Reload
- **Expected:** Default avatar displays

**Test Case 6: Cancel Upload**
- **Steps:**
  1. Click upload button
  2. Click cancel in file picker
- **Expected:** No error, avatar unchanged

**Test Case 7: Network Error During Upload**
- **Steps:**
  1. Disconnect internet
  2. Try to upload image
  3. Observe error handling
- **Expected:** Error message displays

**Test Case 8: Multiple Rapid Uploads**
- **Steps:**
  1. Click upload
  2. Select image 1
  3. Immediately click upload again
  4. Select image 2
- **Expected:** Second upload replaces first, no errors

---

### 8.4 Performance Tests

**Test:** Upload 100 avatars sequentially
**Goal:** Measure server capacity
**Metrics:** Time per upload, memory usage, disk usage

**Test:** Upload large images (5MB each)
**Goal:** Verify size limits work
**Metrics:** Upload time, rejection rate

**Test:** Concurrent uploads from 10 users
**Goal:** Test thread safety
**Metrics:** Success rate, errors

---

### 8.5 Security Tests

**Test:** Upload malicious file disguised as image
**Expected:** Rejected by file validation

**Test:** Upload image with embedded malware
**Expected:** Virus scanner catches it (if integrated)

**Test:** Upload without authentication
**Expected:** 401 Unauthorized

**Test:** Upload file with script tag in filename
**Expected:** Filename sanitized

**Test:** Path traversal attempt (../../etc/passwd.jpg)
**Expected:** Sanitized, path constrained to user folder

---

## 9. Implementation Timeline

### Quick Implementation (2-3 hours)

**Phase 1: Core Functionality**
- [ ] Add hidden file upload form (15 min)
- [ ] Create profile.js upload functions (45 min)
- [ ] Update profile.cshtml buttons (15 min)
- [ ] Test basic upload (30 min)
- [ ] Fix any issues (30 min)

**Result:** Working upload and reset functionality

---

### Standard Implementation (1 day)

**Phase 1: Core Functionality** (Morning)
- [ ] Add hidden file upload form (30 min)
- [ ] Create profile.js with full error handling (1.5 hours)
- [ ] Update profile.cshtml (30 min)
- [ ] Add loading states and feedback (30 min)
- [ ] Test thoroughly (1 hour)

**Phase 2: Enhancements** (Afternoon)
- [ ] Add file size/type validation (30 min)
- [ ] Improve UI/UX (45 min)
- [ ] Add success/error messages (30 min)
- [ ] Cross-browser testing (45 min)
- [ ] Documentation (30 min)

**Result:** Polished, production-ready upload feature

---

### Complete Implementation (2-3 days)

**Day 1: Core + Testing**
- [ ] Implement core functionality (4 hours)
- [ ] Write unit tests (2 hours)
- [ ] Integration testing (2 hours)

**Day 2: Enhancements**
- [ ] Image cropping (3 hours)
- [ ] Drag & drop (2 hours)
- [ ] Avatar presets (2 hours)
- [ ] Testing enhancements (1 hour)

**Day 3: Polish & Deploy**
- [ ] Performance optimization (2 hours)
- [ ] Security review (2 hours)
- [ ] Final testing (2 hours)
- [ ] Documentation (2 hours)

**Result:** Feature-complete with all enhancements

---

## Implementation Checklist

### Pre-Implementation
- [ ] Backup database
- [ ] Create feature branch: `git checkout -b feature/profile-image-upload`
- [ ] Review current code
- [ ] Identify dependencies

### Core Implementation
- [ ] Create/update profile.js
- [ ] Add file upload form to profile.cshtml
- [ ] Update upload button onclick
- [ ] Update reset button onclick
- [ ] Test file upload flow
- [ ] Test error handling

### Enhancement (Optional)
- [ ] Add image validation
- [ ] Add file size limits
- [ ] Add loading states
- [ ] Add success messages
- [ ] Add error messages
- [ ] Improve UI styling

### Testing
- [ ] Manual testing (all scenarios)
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsive testing
- [ ] Performance testing
- [ ] Security testing

### Documentation
- [ ] Update user documentation
- [ ] Add code comments
- [ ] Create usage guide
- [ ] Document known limitations

### Deployment
- [ ] Code review
- [ ] Merge to main branch
- [ ] Deploy to staging
- [ ] Final testing on staging
- [ ] Deploy to production
- [ ] Monitor for issues

---

## Summary

### Current State
- ✅ Avatar field exists in database
- ✅ Profile page exists and displays avatar
- ✅ Upload API exists and works
- ❌ Upload button on profile page doesn't work
- ❌ Missing JavaScript upload functionality
- ❌ Missing HTML upload form elements

### Required Changes
1. Add hidden file upload form to profile.cshtml
2. Create profileUploader JavaScript module in profile.js
3. Update upload button to call profileUploader.uploadClick()
4. Add reset button functionality
5. Test and verify

### Estimated Effort
- **Minimum:** 2-3 hours (basic functionality)
- **Recommended:** 1 day (polished with error handling)
- **Complete:** 2-3 days (with all enhancements)

### Risk Assessment
- **Technical Risk:** LOW (reusing existing working code)
- **Breaking Changes:** NONE (adding new functionality only)
- **Browser Compatibility:** HIGH (standard HTML5 APIs)
- **Security:** MEDIUM (file upload always has risks, mitigated by existing validation)

---

**Ready to implement? Start with Phase 1, test thoroughly, then proceed to enhancements!**
