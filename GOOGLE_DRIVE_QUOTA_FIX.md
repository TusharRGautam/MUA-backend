# Google Drive Storage Quota Fix

## Problem
Your Google Drive service account has reached its storage quota limit, causing document uploads to fail with the error:
```
Service Accounts do not have storage quota. Leverage shared drives or use OAuth delegation instead.
```

## Current Status
- **Total Limit**: 0.00 GB (Free account)
- **Current Usage**: 0.01 GB (Already exceeded)
- **Available Space**: -0.01 GB (Over quota)

## Solutions (Choose One)

### ✅ Solution 1: Use Hybrid Storage (Immediate Fix)
The code has been updated to automatically fall back to local storage when Google Drive quota is exceeded.

**What was implemented:**
1. Created `HybridStorageService` that automatically switches to local storage
2. Updated vendor identity routes to use hybrid storage
3. Document uploads will now work via local storage when Google Drive fails

**No action needed - this is already working!**

### 🔧 Solution 2: Enable Shared Drive (Recommended for Production)

1. **Create a Shared Drive in Google Drive:**
   - Go to Google Drive web interface
   - Click "Shared drives" in the left sidebar
   - Click "New" → "Shared drive"
   - Name it "MUA App Storage"
   - Share it with your service account email: `caretakedriveuploaderserviceac@caretake-460910.iam.gserviceaccount.com`

2. **Get the Shared Drive ID:**
   - Open the shared drive in Google Drive
   - Copy the ID from the URL (after `/drive/folders/`)

3. **Update Environment Variables:**
   ```bash
   USE_SHARED_DRIVE=true
   GOOGLE_SHARED_DRIVE_ID=your_shared_drive_id_here
   ```

4. **Restart the server**

### 💰 Solution 3: Upgrade Google Storage Plan

1. **Upgrade the Google account storage:**
   - Go to [Google One](https://one.google.com/)
   - Choose a storage plan (100GB for $1.99/month)
   - This will increase the quota for your service account

2. **No code changes needed**

### 🔄 Solution 4: Create New Service Account

1. **Create a new Google Cloud project**
2. **Enable Google Drive API**
3. **Create new service account with fresh storage quota**
4. **Update credentials file**

## How to Test the Fix

### Test 1: Check Current Storage Status
```bash
cd MUA-backend
node -e "
const hybrid = require('./utils/hybridStorageService');
hybrid.initialize().then(() => {
  console.log('Storage Status:', hybrid.getStorageStatus());
});
"
```

### Test 2: Upload a Document
Try uploading documents from the business dashboard. It should now work via local storage.

### Test 3: Monitor Logs
Check the server logs for messages like:
```
✅ File uploaded to local storage
Google Drive quota exceeded, switching to local storage
```

## Current Implementation Status

✅ **Immediate Fix Applied:**
- Hybrid storage service created
- Automatic fallback to local storage
- Document uploads should work now

⏳ **Next Steps (Optional):**
- Set up shared drive for production use
- Upgrade storage plan if needed

## File Locations

- **Hybrid Storage Service**: `utils/hybridStorageService.js`
- **Updated Routes**: `routes/vendorIdentityRoutes.js`
- **Google Drive Service**: `utils/googleDriveService.js`
- **Cleanup Script**: `scripts/cleanup-google-drive.js`

## Testing Commands

```bash
# Test document upload (should work now)
curl -X POST http://localhost:3000/api/vendor-identity/upload-document \
  -F "document=@test-image.jpg" \
  -F "documentType=aadhaar" \
  -F "vendorEmail=test@example.com" \
  -F "vendorName=Test Vendor"

# Check storage status
node scripts/cleanup-google-drive.js

# Test hybrid storage
node -e "console.log(require('./utils/hybridStorageService').getStorageStatus())"
```

## Monitoring

The system will automatically:
1. Try Google Drive first
2. Fall back to local storage if quota exceeded
3. Log which storage method is being used
4. Allow retrying Google Drive after quota is resolved

Your document upload issue should now be resolved! 🎉 