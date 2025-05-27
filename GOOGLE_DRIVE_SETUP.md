# Google Drive Integration Setup Guide

## Overview
This guide explains how to set up Google Drive integration for image uploads in the MUA Dashboard application.

## Current Status
✅ **Backend Implementation**: Complete  
✅ **Frontend Integration**: Complete  
❌ **Google Drive Permissions**: Needs Configuration  

## Issue Description
The service account `caretakedriveuploaderserviceac@caretake-460910.iam.gserviceaccount.com` currently has insufficient permissions to upload files to the specified Google Drive folders.

**Error**: `Insufficient permissions for the specified parent.`

## Solution Options

### Option 1: Grant Permissions to Service Account (Recommended)

1. **Share the main folder with the service account**:
   - Go to Google Drive: https://drive.google.com/drive/folders/1OvhxktOCH7UtNz03Fd0gLbUZQmIZFaGY
   - Right-click on the "dashboard-related-data" folder
   - Click "Share"
   - Add the service account email: `caretakedriveuploaderserviceac@caretake-460910.iam.gserviceaccount.com`
   - Set permission to "Editor" or "Content Manager"
   - Click "Send"

2. **Share each subfolder** (if needed):
   - `our_services_section` folder (ID: 1LVAz7zUHtaTLj7t3611XAmnYF96sVHCa)
   - `our_services_icons` folder (ID: 1iZ9ZWSBSs8ibs2njoJT0DTbevN6XR8-K)
   - Create and share `our_services_product` folder

### Option 2: Use Different Service Account

1. Create a new service account with proper permissions
2. Download the new credentials JSON file
3. Replace the existing file in `MUA-backend/googledrivejson/`

### Option 3: Use OAuth2 Instead of Service Account

1. Set up OAuth2 credentials for user authentication
2. Modify the authentication method in the code
3. Users will need to authorize the application

## Current Implementation Features

### Backend (`MUA-backend/src/utils/googleDriveService.js`)
- ✅ Service account authentication
- ✅ Automatic folder structure management
- ✅ File upload with unique naming (timestamp-based)
- ✅ Public link generation
- ✅ File deletion capability
- ✅ Error handling and fallbacks
- ✅ Support for multiple file types

### API Endpoints (`MUA-backend/routes/uploadRoutes.js`)
- ✅ `POST /api/upload/service-image` - Upload service images
- ✅ `POST /api/upload/icon-image` - Upload icon images  
- ✅ `POST /api/upload/product-image` - Upload product images
- ✅ `DELETE /api/upload/delete/:fileId` - Delete uploaded files
- ✅ File validation (type and size limits)
- ✅ Error handling with detailed messages

### Frontend (`mua-dashboard/src/utils/imageUpload.ts`)
- ✅ Upload functions with progress tracking
- ✅ File validation (type and size)
- ✅ Google Drive link utilities
- ✅ Error handling
- ✅ Progress simulation for better UX

### Services Component (`mua-dashboard/src/components/Dashboard/Services.tsx`)
- ✅ Google Drive upload integration
- ✅ Progress indicators with LinearProgress
- ✅ Image preview functionality
- ✅ File ID extraction for editing
- ✅ Cleanup of old images when updating
- ✅ Success/error messaging

## Folder Structure
```
Google Drive: dashboard-related-data (ID: 1OvhxktOCH7UtNz03Fd0gLbUZQmIZFaGY)
├── our_services_section (ID: 1LVAz7zUHtaTLj7t3611XAmnYF96sVHCa)
├── our_services_icons (ID: 1iZ9ZWSBSs8ibs2njoJT0DTbevN6XR8-K)
└── our_services_product (To be created or use main folder)
```

## File Naming Convention
- Format: `originalname_timestamp.extension`
- Example: `service-image_1748173220201.jpg`
- Ensures unique filenames and prevents conflicts

## Public Link Format
- Direct access: `https://drive.google.com/uc?id={fileId}`
- Web view: `https://drive.google.com/file/d/{fileId}/view`

## Testing

### Test Upload Functionality
```bash
cd MUA-backend
node test-simple-upload.js
```

### Test with Real Image
```bash
cd MUA-backend
node test-google-drive.js
```

## Troubleshooting

### Common Issues

1. **"Insufficient permissions for the specified parent"**
   - Solution: Share the Google Drive folder with the service account email
   - Grant "Editor" or "Content Manager" permissions

2. **"File not found" when deleting**
   - Check if the file ID is correct
   - Ensure the service account has delete permissions

3. **Upload fails with large files**
   - Current limit: 10MB per file
   - Increase limit in `uploadRoutes.js` if needed

4. **Authentication errors**
   - Verify the service account JSON file is correct
   - Check if the service account is enabled

### Debug Mode
Enable detailed logging by setting environment variable:
```bash
export DEBUG=google-drive-service
```

## Security Considerations

1. **Service Account Key**: Keep the JSON file secure and never commit to version control
2. **Public Links**: Uploaded files are publicly accessible via the generated links
3. **File Validation**: Only image files are allowed (configurable)
4. **Size Limits**: 10MB limit prevents abuse (configurable)

## Next Steps

1. **Grant Permissions**: Share Google Drive folders with service account
2. **Test Upload**: Run the test scripts to verify functionality
3. **Frontend Testing**: Test the complete upload flow in the dashboard
4. **Production Setup**: Configure proper error monitoring and logging

## Support

If you encounter issues:
1. Check the console logs for detailed error messages
2. Verify Google Drive folder permissions
3. Test with the provided test scripts
4. Contact the development team for assistance

---

**Last Updated**: May 25, 2025  
**Status**: Ready for permission configuration 