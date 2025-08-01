# ImageKit.io Integration Setup Guide

## Overview
This document explains how to set up ImageKit.io integration for the MUA backend to handle verification document uploads with WebP conversion.

## Configuration Required

### Environment Variables
Add the following environment variables to your `.env` file:

```bash
# ImageKit.io Configuration
IMAGEKIT_PUBLIC_KEY=public_WwT6IgX7RU9OIEyR3pGYZ3b/3wA=
IMAGEKIT_PRIVATE_KEY=private_YOUR_PRIVATE_KEY_HERE
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/xg6mmpnar
```

**⚠️ IMPORTANT**: Replace `private_YOUR_PRIVATE_KEY_HERE` with your actual ImageKit.io private key.

### Getting ImageKit.io Credentials

1. **Login to ImageKit.io Dashboard**
   - Go to: https://imagekit.io/dashboard
   - Sign in with your account

2. **Navigate to Developer Options**
   - Go to Settings → API Keys
   - Copy your Private Key

3. **Update Environment Variables**
   - Add the private key to your `.env` file
   - Restart your backend server

## Features Implemented

### Backend Services

#### ImageKit Service (`utils/imagekitService.js`)
- ✅ WebP conversion using existing Sharp utilities
- ✅ Direct upload to ImageKit.io with proper authentication
- ✅ Folder organization by vendor ID
- ✅ File tagging for easy management
- ✅ Error handling and fallbacks

#### API Routes (`routes/imagekitRoutes.js`)
- ✅ `POST /api/imagekit/upload-verification` - Upload documents with multipart form data
- ✅ `POST /api/imagekit/upload-verification-base64` - Upload via base64 data
- ✅ `GET /api/imagekit/auth` - Get authentication parameters for client-side uploads
- ✅ `GET /api/imagekit/status` - Check service configuration status

### Frontend Integration

#### VendorVerificationModal (`components/VendorVerificationModal.tsx`)
- ✅ WebP conversion using Expo ImageManipulator
- ✅ Image validation before upload
- ✅ Progress tracking for uploads
- ✅ Error handling with detailed messages
- ✅ Direct integration with ImageKit backend API

#### WebP Converter (`utils/webpConverter.ts`)
- ✅ Frontend WebP conversion using ImageManipulator
- ✅ Image validation and size checking
- ✅ Fallback to JPEG if WebP fails

## Database Schema

### New Columns Added
The migration already added these columns to `registration_and_other_details`:

```sql
-- Columns for ImageKit.io CDN URLs
verify_pancard_url TEXT,      -- PAN card ImageKit CDN URL
verify_aadharcard_url TEXT    -- Aadhaar card ImageKit CDN URL
```

## File Organization

### ImageKit Folder Structure
```
/verification-documents/
├── {vendor_id}/
│   ├── aadhaar_{vendor_id}_{timestamp}.webp
│   └── pan_{vendor_id}_{timestamp}.webp
```

### File Naming Convention
- Format: `{documentType}_{vendorId}_{timestamp}.webp`
- Example: `aadhaar_123_1674567890123.webp`
- All files are converted to WebP format for optimization

### File Tags
Each uploaded file is tagged with:
- `verification`
- `{documentType}` (aadhaar/pan)
- `vendor_{vendorId}`
- `{vendorEmail}`

## Benefits of ImageKit.io Integration

### Performance
- **CDN Delivery**: Fast global content delivery
- **WebP Conversion**: Automatic optimization for smaller file sizes
- **Responsive Images**: On-the-fly transformations
- **Caching**: Built-in caching for faster subsequent loads

### Management
- **Organized Storage**: Vendor-specific folders
- **Tagging System**: Easy searching and filtering
- **File Management**: Built-in admin dashboard
- **Analytics**: Usage statistics and insights

### Security
- **Private Keys**: Secure authentication
- **Signed URLs**: Temporary access when needed
- **Access Control**: Folder-level permissions
- **Audit Trail**: Upload and access logs

## Testing

### Check Service Status
```bash
curl -X GET http://localhost:3000/api/imagekit/status
```

Expected Response:
```json
{
  "success": true,
  "configured": true,
  "message": "ImageKit service is properly configured"
}
```

### Test Document Upload
```bash
curl -X POST http://localhost:3000/api/imagekit/upload-verification \
  -F "document=@test-aadhaar.jpg" \
  -F "documentType=aadhaar" \
  -F "vendorEmail=test@example.com" \
  -F "vendorName=Test Vendor"
```

### Test Authentication
```bash
curl -X GET http://localhost:3000/api/imagekit/auth
```

## Troubleshooting

### Common Issues

#### 1. "ImageKit service is not properly configured"
**Solution**: Add `IMAGEKIT_PRIVATE_KEY` to your `.env` file

#### 2. "Authentication failed for ImageKit upload"
**Solution**: Verify your private key is correct and hasn't expired

#### 3. "WebP conversion failed"
**Solution**: Check if Sharp is properly installed: `npm install sharp`

#### 4. "Failed to upload document to ImageKit"
**Solutions**:
- Check internet connection
- Verify ImageKit.io account status
- Check file size limits (10MB max)
- Ensure file is a valid image format

### Debug Mode
Enable debug logging by setting:
```bash
DEBUG=imagekit:*
```

### Log Locations
Check these log messages:
- `[ImageKit Service]` - Backend service logs
- `[ImageKit API]` - API route logs  
- `[VendorVerification]` - Frontend component logs

## Migration from Google Drive

### Comparison
| Feature | Google Drive | ImageKit.io |
|---------|-------------|-------------|
| CDN | ❌ | ✅ |
| WebP Conversion | Manual | Automatic |
| Global Performance | Limited | Optimized |
| Transformations | ❌ | ✅ |
| Admin Dashboard | Basic | Advanced |

### Migration Steps
1. ✅ Set up ImageKit.io service
2. ✅ Create new database columns
3. ✅ Update VendorVerificationModal
4. ✅ Test new upload flow
5. 🔄 **Currently on this step**
6. ⏳ Migrate existing documents (optional)
7. ⏳ Update other components to use ImageKit

## Next Steps

1. **Add Private Key**: Set `IMAGEKIT_PRIVATE_KEY` in environment variables
2. **Test Upload**: Try uploading a document through the VendorVerificationModal
3. **Verify Database**: Check that URLs are saved to new columns
4. **Monitor Performance**: Check upload speeds and CDN delivery
5. **Consider Migration**: Optionally migrate existing Google Drive documents

## Support

### Resources
- ImageKit.io Documentation: https://docs.imagekit.io/
- Backend Utils: `MUA-backend/utils/imagekitService.js`
- Frontend Utils: `MUA-frontend/utils/webpConverter.ts`
- API Routes: `MUA-backend/routes/imagekitRoutes.js`

### Contact
For issues with this integration, check the console logs and refer to the troubleshooting section above. 