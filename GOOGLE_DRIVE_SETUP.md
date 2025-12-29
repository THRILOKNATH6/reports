# Google Drive Setup Guide

## 📋 **How to Get Google Drive Direct Download Links**

### Step 1: Upload Files to Google Drive
1. Go to [Google Drive](https://drive.google.com)
2. Upload your 3 Excel files:
   - Order file
   - Loading file
   - Packing file

### Step 2: Get Shareable Links
For each file:
1. Right-click the file
2. Click **"Share"**
3. Click **"Change to anyone with the link"**
4. Make sure it's set to **"Viewer"**
5. Click **"Copy link"**

### Step 3: Convert to Direct Download URLs

Google Drive share links look like:
```
https://drive.google.com/file/d/FILE_ID/view?usp=sharing
```

Convert to direct download format:
```
https://drive.google.com/uc?export=download&id=FILE_ID
```

**Example:**
- Share link: `https://drive.google.com/file/d/1ABC123xyz/view?usp=sharing`
- Direct link: `https://drive.google.com/uc?export=download&id=1ABC123xyz`

### Step 4: Update Configuration

Edit `sheets-config.js`:

```javascript
const GOOGLE_SHEETS_CONFIG = {
  // Google Drive direct download URLs
  orderFileUrl: 'https://drive.google.com/uc?export=download&id=YOUR_ORDER_FILE_ID',
  loadingFileUrl: 'https://drive.google.com/uc?export=download&id=YOUR_LOADING_FILE_ID',
  packingFileUrl: 'https://drive.google.com/uc?export=download&id=YOUR_PACKING_FILE_ID',
};
```

### Step 5: Test
1. Make sure backend server is running: `npm start` in `dash-react/server`
2. Open your app: `http://localhost:8000/order-load-pack-hide-zero-load.html`
3. Click **"Load from Sheets"**
4. Data should load! ✅

## 🎯 **Quick Conversion Tool**

Paste your Google Drive share link here and extract the FILE_ID:

**Share Link Format:**
```
https://drive.google.com/file/d/FILE_ID_HERE/view?usp=sharing
                              ↑ Copy this part ↑
```

**Direct Download Format:**
```
https://drive.google.com/uc?export=download&id=FILE_ID_HERE
```

## ✅ **Why Google Drive Works Better:**

- ✅ Direct download URLs work server-side
- ✅ No authentication required for public files
- ✅ More reliable than OneDrive
- ✅ Faster response times
- ✅ Better API support

## 🔧 **Troubleshooting:**

**If it doesn't work:**
1. Make sure files are set to "Anyone with the link can view"
2. Check that you're using the `uc?export=download&id=` format
3. Verify the FILE_ID is correct
4. Make sure backend server is running on port 3001

**File size limits:**
- Files under 100MB: Direct download works
- Files over 100MB: Google shows virus scan warning (still works, just slower)

---

**Ready to try? Upload your files to Google Drive and get the links!**
