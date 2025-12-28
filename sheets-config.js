/**
 * Cloud Storage Configuration
 * 
 * RECOMMENDED: Use Google Drive for best results!
 * 
 * GOOGLE DRIVE INSTRUCTIONS:
 * 1. Upload your Excel files to Google Drive
 * 2. Right-click each file → Share → "Anyone with the link can view"
 * 3. Copy the share link (looks like: https://drive.google.com/file/d/FILE_ID/view)
 * 4. Extract the FILE_ID (the part between /d/ and /view)
 * 5. Use format: https://drive.google.com/uc?export=download&id=FILE_ID
 * 
 * EXAMPLE:
 * Share link: https://drive.google.com/file/d/1ABC123xyz/view?usp=sharing
 * Direct link: https://drive.google.com/uc?export=download&id=1ABC123xyz
 * 
 * See GOOGLE_DRIVE_SETUP.md for detailed instructions
 */

const GOOGLE_SHEETS_CONFIG = {
    // Google Drive direct download URLs (converted from your share links)
    orderFileUrl: 'https://docs.google.com/spreadsheets/d/1PO8r0zC5KhShNjM-9fzr9ndk6qBeiLKNQPtfjV0rmNU/export?format=xlsx',
    loadingFileUrl: 'https://docs.google.com/spreadsheets/d/11BMla9dUo_1PZbCRmMs2X_ZDOE0ms_SPChmamR-QJZs/export?format=xlsx',
    packingFileUrl: 'https://docs.google.com/spreadsheets/d/17qNmLPawQFc5K-pM7NSBXNm_hQggQAPb5nzXiXt0omE/export?format=xlsx',

    // Alternative: OneDrive URLs (not recommended - authentication issues)
    // orderFileUrl: 'https://1drv.ms/x/...',
    // loadingFileUrl: 'https://1drv.ms/x/...',
    // packingFileUrl: 'https://1drv.ms/x/...',

    // Alternative: Google Sheets (more complex setup)
    appsScriptUrl: '',
    orderSheetId: '1PO8r0zC5KhShNjM-9fzr9ndk6qBeiLKNQPtfjV0rmNU',
    loadingSheetId: '11BMla9dUo_1PZbCRmMs2X_ZDOE0ms_SPChmamR-QJZs',
    packingSheetId: '17qNmLPawQFc5K-pM7NSBXNm_hQggQAPb5nzXiXt0omE'
};
