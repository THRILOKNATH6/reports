# Google Apps Script Setup for Data Fetching

## 📋 Overview
This script creates a web API that returns your Google Sheets data as JSON, avoiding all CORS issues.

## 🚀 Setup Instructions

### Step 1: Open Your Google Sheet
1. Open your Order Google Sheet
2. Click **Extensions → Apps Script**

### Step 2: Paste This Code
Delete any existing code and paste this:

```javascript
function doGet(e) {
  try {
    const sheetId = e.parameter.sheetId;
    const sheetName = e.parameter.sheetName || 'Sheet1';
    
    if (!sheetId) {
      return ContentService.createTextOutput(JSON.stringify({
        error: 'Missing sheetId parameter'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Open the spreadsheet
    const ss = SpreadsheetApp.openById(sheetId);
    const sheet = ss.getSheetByName(sheetName) || ss.getSheets()[0];
    
    // Get all data
    const data = sheet.getDataRange().getValues();
    
    // Return as JSON
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      data: data,
      sheetName: sheet.getName(),
      rows: data.length,
      columns: data[0] ? data[0].length : 0
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

### Step 3: Deploy as Web App
1. Click **Deploy → New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Choose **"Web app"**
4. Settings:
   - **Description**: "Sheet Data API"
   - **Execute as**: "Me"
   - **Who has access**: "Anyone"
5. Click **"Deploy"**
6. Click **"Authorize access"**
7. Choose your Google account
8. Click **"Advanced"** → **"Go to [Project Name] (unsafe)"**
9. Click **"Allow"**
10. **Copy the Web App URL** (it looks like: `https://script.google.com/macros/s/...../exec`)

### Step 4: Update Config
Paste your Web App URL in the config file.

## 📝 Usage

The URL format will be:
```
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?sheetId=YOUR_SHEET_ID
```

## ✅ Benefits
- ✅ No CORS issues
- ✅ Works from any browser
- ✅ No need to publish sheets
- ✅ Full control over data access
- ✅ Can add authentication later

## 🔧 Testing
Test your API by opening this URL in browser:
```
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?sheetId=1PO8r0zC5KhShNjM-9fzr9ndk6qBeiLKNQPtfjV0rmNU
```

You should see JSON data!
