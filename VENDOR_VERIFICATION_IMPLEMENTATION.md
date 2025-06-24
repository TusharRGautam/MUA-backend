# Vendor Verification System Implementation

## Overview
This implementation adds a comprehensive vendor verification system to the MUA Dashboard that allows vendors to upload identity documents (Aadhaar Card and PAN Card) for account activation.

## Features

### Frontend Components
1. **VendorVerificationModal** - A comprehensive modal for document upload
2. **Modified Business Dashboard** - Integration with existing toggle functionality
3. **Document Upload UI** - User-friendly interface for selecting and uploading documents

### Backend Services
1. **Document Upload API** - Handles file uploads and Google Drive integration
2. **Folder Management** - Automatic vendor-specific folder creation
3. **Database Integration** - Stores Google Drive links in database
4. **Validation** - Document format validation

## Implementation Details

### Database Schema
The system uses existing `aadhaar_card` and `pan_card` columns in the `registration_and_other_details` table to store Google Drive links.

### Google Drive Integration
- **Parent Folder**: `138_pMybW5nDv-JLiveyoMAtleRa6-E8t` (from provided URL)
- **Folder Structure**: `{VendorName}_{VendorID}_VerificationDocs`
- **File Naming**: `{documentType}_{vendorId}_{timestamp}.{extension}`

### API Endpoints

#### POST /api/vendor-identity/upload-document
- **Purpose**: Upload Aadhaar or PAN card document
- **Method**: POST (multipart/form-data)
- **Parameters**:
  - `document` (file): Image file
  - `documentType` (string): "aadhaar" or "pan"
  - `vendorEmail` (string): Vendor's business email
  - `vendorName` (string): Vendor's name

#### GET /api/vendor-identity/documents-by-email
- **Purpose**: Check if vendor has uploaded documents
- **Method**: GET
- **Parameters**:
  - `email` (query): Vendor's business email

#### PUT /api/vendor-identity/update
- **Purpose**: Update document links directly (authenticated)
- **Method**: PUT
- **Authentication**: Required

#### POST /api/vendor-identity/validate
- **Purpose**: Validate document format
- **Method**: POST
- **Validation Rules**:
  - Aadhaar: 12 digits
  - PAN: ABCDE1234F format (5 letters, 4 digits, 1 letter)

## Frontend Integration

### Dashboard Toggle Behavior
1. **Default State**: Vendor status is "Inactive" by default
2. **Activation Attempt**: When trying to activate without documents, verification modal opens
3. **Document Check**: System checks for existing documents on login
4. **Auto-activation**: If documents exist, vendor can toggle to active

### Verification Modal Features
- **Document Upload**: Supports both Aadhaar and PAN card
- **Image Preview**: Shows selected images before upload
- **Progress Tracking**: Visual feedback during upload
- **Validation**: Client-side validation for required documents
- **Error Handling**: Comprehensive error messages

## File Structure

### Frontend Files
```
MUA-frontend/
├── components/
│   └── VendorVerificationModal.tsx     # Main verification modal
└── app/
    └── business-dashboard.tsx          # Modified dashboard with integration
```

### Backend Files
```
MUA-backend/
├── routes/
│   └── vendorIdentityRoutes.js         # All verification endpoints
├── migrations/
│   └── add_identity_documents.sql      # Database migration
└── run_identity_docs_migration.js      # Migration runner script
```

## Security Features

### File Validation
- **File Type**: Only image files allowed
- **File Size**: 10MB maximum
- **MIME Type**: Validated on server side

### Google Drive Security
- **Service Account**: Uses Google service account for authentication
- **Folder Isolation**: Each vendor gets their own folder
- **Public Access**: Files are made publicly viewable for easy access

### Database Security
- **SQL Injection**: Protected using parameterized queries
- **Authentication**: Some endpoints require JWT authentication
- **Data Validation**: Server-side validation for all inputs

## Usage Flow

### For New Vendors
1. Register vendor account (status: inactive by default)
2. Attempt to activate business toggle
3. Verification modal opens automatically
4. Upload both Aadhaar and PAN card documents
5. System creates vendor folder and uploads documents
6. Database stores Google Drive links
7. Account becomes eligible for activation

### For Existing Vendors
1. System checks for existing documents on login
2. If documents exist, toggle works normally
3. If no documents, verification modal opens when activating

## Testing

### Manual Testing Steps
1. **Registration Test**: Create new vendor account
2. **Toggle Test**: Try to activate without documents
3. **Upload Test**: Upload both required documents
4. **Validation Test**: Try invalid file types/sizes
5. **Database Test**: Verify links are stored correctly
6. **Google Drive Test**: Verify files are accessible

### API Testing
```bash
# Test document upload
curl -X POST http://localhost:3000/api/vendor-identity/upload-document \
  -F "document=@aadhaar.jpg" \
  -F "documentType=aadhaar" \
  -F "vendorEmail=test@example.com" \
  -F "vendorName=Test Vendor"

# Check documents
curl "http://localhost:3000/api/vendor-identity/documents-by-email?email=test@example.com"
```

## Configuration

### Environment Variables
Make sure these are set in your `.env` file:
```
GOOGLE_DRIVE_CLIENT_EMAIL=your-service-account-email
GOOGLE_DRIVE_PRIVATE_KEY=your-private-key
GOOGLE_DRIVE_PROJECT_ID=your-project-id
DATABASE_URL=your-database-url
```

### Google Drive Setup
1. Service account must have access to the parent folder
2. Parent folder ID: `138_pMybW5nDv-JLiveyoMAtleRa6-E8t`
3. Service account JSON file should be in `googledrivejson/` directory

## Troubleshooting

### Common Issues

#### Google Drive Permission Error
- **Error**: "Insufficient permissions for the specified parent"
- **Solution**: Share the parent folder with service account email

#### File Upload Error
- **Error**: "No file uploaded"
- **Solution**: Ensure proper multipart/form-data format

#### Database Connection Error
- **Error**: "Failed to connect to database"
- **Solution**: Check DATABASE_URL environment variable

#### Modal Not Opening
- **Issue**: Verification modal doesn't appear
- **Solution**: Check `hasValidDocuments` state and toggle logic

### Debug Mode
Enable detailed logging by setting:
```javascript
console.log('Debug mode enabled');
```

## Future Enhancements

### Planned Features
1. **Document Verification**: Admin panel for document approval
2. **Status Tracking**: Verification status tracking
3. **Notifications**: Email notifications for verification status
4. **Document Expiry**: Handle document expiration dates
5. **Bulk Operations**: Admin bulk approval/rejection

### Performance Optimizations
1. **Image Compression**: Automatic image optimization
2. **Lazy Loading**: Load documents only when needed
3. **Caching**: Cache document status for faster checks
4. **Background Upload**: Upload in background for better UX

## Support

For issues or questions regarding the vendor verification system:
1. Check this documentation first
2. Review console logs for error details
3. Test API endpoints individually
4. Verify Google Drive permissions
5. Check database migration status

## Version History

- **v1.0.0**: Initial implementation with basic document upload
- **v1.1.0**: Added validation and error handling
- **v1.2.0**: Integrated with dashboard toggle functionality 