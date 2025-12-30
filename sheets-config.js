/**
 * Cloud Storage Configuration
 * 
 * EASY SETUP: Just paste your Google Drive/Sheets shareable links!
 * The app will automatically convert them to direct download URLs.
 * 
 * GOOGLE DRIVE/SHEETS INSTRUCTIONS:
 * 1. Upload your Excel files to Google Drive OR create Google Sheets
 * 2. Right-click → Share → "Anyone with the link can view"
 * 3. Copy the shareable link
 * 4. Paste it below (the app converts it automatically!)
 * 
 * SUPPORTED LINK FORMATS:
 * - Google Sheets: https://docs.google.com/spreadsheets/d/FILE_ID/edit...
 * - Google Drive: https://drive.google.com/file/d/FILE_ID/view...
 * - Already converted: https://docs.google.com/spreadsheets/d/FILE_ID/export?format=xlsx
 */

// Helper function to convert shareable links to direct download URLs
function convertToDirectLink(url) {
    if (!url) return '';

    // Already in export format - return as is
    if (url.includes('/export?format=xlsx')) {
        return url;
    }

    // Google Sheets shareable link
    // From: https://docs.google.com/spreadsheets/d/FILE_ID/edit#gid=0
    // To: https://docs.google.com/spreadsheets/d/FILE_ID/export?format=xlsx
    const sheetsMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (sheetsMatch) {
        const fileId = sheetsMatch[1];
        return `https://docs.google.com/spreadsheets/d/${fileId}/export?format=xlsx`;
    }

    // Google Drive shareable link
    // From: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
    // To: https://drive.google.com/uc?export=download&id=FILE_ID
    const driveMatch = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
    if (driveMatch) {
        const fileId = driveMatch[1];
        return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }

    // If no match, return original URL
    return url;
}

const GOOGLE_SHEETS_CONFIG = {
    // JUST PASTE YOUR SHAREABLE LINKS HERE - They will be auto-converted!
    // Example: https://docs.google.com/spreadsheets/d/YOUR_FILE_ID/edit#gid=0

    orderFileUrl: convertToDirectLink('https://docs.google.com/spreadsheets/d/1PO8r0zC5KhShNjM-9fzr9ndk6qBeiLKNQPtfjV0rmNU/edit#gid=0'),
    loadingFileUrl: convertToDirectLink('https://docs.google.com/spreadsheets/d/1RhhjvFk4CdBVr4PZwivf88uOaO5Xm5C8/edit?usp=sharing&ouid=104797835712135417225&rtpof=true&sd=true'),
    packingFileUrl: convertToDirectLink('https://docs.google.com/spreadsheets/d/1RhhjvFk4CdBVr4PZwivf88uOaO5Xm5C8/edit?usp=sharing&ouid=104797835712135417225&rtpof=true&sd=true'),
};
