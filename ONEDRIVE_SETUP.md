# OneDrive Setup Guide

## 🎯 Why OneDrive is Best
- ✅ **No CORS issues**
- ✅ **Direct download links**
- ✅ **No complex setup**
- ✅ **Auto-updates when you change files**
- ✅ **Works from any browser**

## 📋 Step-by-Step Setup

### Step 1: Upload Files to OneDrive
1. Go to [OneDrive.com](https://onedrive.live.com)
2. Create a folder (e.g., "Order Data")
3. Upload your 3 Excel files:
   - Order file
   - Loading file
   - Packing file

### Step 2: Get Shareable Links
For EACH file:
1. Right-click the file
2. Click **"Share"**
3. Click **"Anyone with the link can view"**
4. Click **"Copy link"**

You'll get a link like:
```
https://1drv.ms/x/s!AjK...xyz/Order.xlsx?e=abc123
```

### Step 3: Convert to Download Link

**Option A: Use OneDrive Embed Tool** (Easiest)
1. Go to: https://onedrive.live.com/embed
2. Paste your share link
3. Click "Generate"
4. Copy the **download URL** from the generated code

**Option B: Manual Conversion**
Change the link format from:
```
https://1drv.ms/x/s!AjK...xyz/Order.xlsx?e=abc123
```

To:
```
https://onedrive.live.com/download?resid=YOUR_RESOURCE_ID&authkey=YOUR_AUTH_KEY
```

**Option C: Use Direct Download Parameter** (Simplest)
Just add `&download=1` to your share link:
```
https://1drv.ms/x/s!AjK...xyz/Order.xlsx?e=abc123&download=1
```

### Step 4: Update Config
1. Open `sheets-config.js`
2. Paste your download links:
```javascript
const GOOGLE_SHEETS_CONFIG = {
    orderFileUrl: 'https://onedrive.live.com/download?...',
    loadingFileUrl: 'https://onedrive.live.com/download?...',
    packingFileUrl: 'https://onedrive.live.com/download?...'
};
```

### Step 5: Test
1. Open your application
2. Click **"Load from Cloud"**
3. Data should load automatically!

## 🔧 Troubleshooting

**Link doesn't work?**
- Make sure the file is set to "Anyone with the link can view"
- Try the embed tool method
- Check if the link opens the file directly in browser

**Still getting errors?**
- Use the file upload option instead
- Or use a local web server

## ✅ Benefits
Once set up, you can:
- Update files in OneDrive
- Refresh the page to see new data
- No need to upload files manually each time!
