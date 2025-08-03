# Environment Configuration for ImageKit Integration

## Required Environment Variables

Create a `.env` file in the root of your backend project with the following variables:

```
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=mua_database
DB_PORT=3306

# Server Configuration
PORT=3000
NODE_ENV=development

# ImageKit Configuration
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id

# JWT Secret
JWT_SECRET=your_jwt_secret
```

## Setting up ImageKit Integration

To set up ImageKit integration, follow these steps:

1. **Create ImageKit Account**:
   - Go to [ImageKit.io](https://imagekit.io/)
   - Sign up for a free account
   - Navigate to the Developer section in your dashboard

2. **Get API Credentials**:
   - **Public Key**: Found in Developer → API Keys
   - **Private Key**: Found in Developer → API Keys (keep this secret!)
   - **URL Endpoint**: Found in Developer → API Keys (e.g., `https://ik.imagekit.io/your_imagekit_id`)

3. **Configure Environment Variables**:
   - Set `IMAGEKIT_PUBLIC_KEY` to your public key
   - Set `IMAGEKIT_PRIVATE_KEY` to your private key
   - Set `IMAGEKIT_URL_ENDPOINT` to your URL endpoint

## ImageKit Features Used

### 1. Image Upload
- **Automatic folder organization**: Images are organized by type (services, gallery, profiles, etc.)
- **Image optimization**: Automatic WebP conversion and quality optimization
- **Unique naming**: Timestamp-based unique file names prevent conflicts
- **Real-time transformations**: On-the-fly image transformations

### 2. Image Management
- **File deletion**: Remove images from ImageKit when no longer needed
- **URL management**: Direct CDN URLs for fast image delivery
- **Folder structure**: Organized hierarchy for different image types

### 3. Supported Image Types
- **Service Images**: `/services/` folder
- **Gallery Images**: `/gallery/{vendor_name}/` folder
- **Profile Pictures**: `/profiles/` folder
- **Transformation Images**: `/transformations/{vendor_name}/` folder
- **Verification Documents**: `/verification-documents/{vendor_id}/` folder
- **Icons**: `/icons/`, `/prp-icons/`, `/package-icons/` folders

## Folder Structure

ImageKit automatically creates the following folder structure:

```
ImageKit Root
├── services/           # Service images
├── icons/             # Service icons
├── products/          # Product images
├── gallery/           # Gallery images
│   └── {vendor_name}/ # Vendor-specific galleries
├── profiles/          # Profile pictures
├── transformations/   # Before/after images
│   └── {vendor_name}/ # Vendor-specific transformations
├── verification-documents/ # ID documents
│   └── {vendor_id}/   # Vendor-specific documents
├── prp-icons/         # PRP service icons
└── package-icons/     # Package service icons
```

## Testing the Configuration

You can test if your ImageKit configuration is working by running:

```javascript
const imagekitService = require('./src/utils/imagekitService');

// This will throw an error if the configuration is incorrect
imagekitService.initialize()
  .then(() => console.log('ImageKit service initialized successfully!'))
  .catch(err => console.error('ImageKit initialization failed:', err));
```

## Migration from Google Drive

### What Changed:
- **Storage Service**: Google Drive → ImageKit
- **Authentication**: Service Account → API Keys
- **URLs**: Google Drive URLs → ImageKit CDN URLs
- **File Management**: Google Drive API → ImageKit SDK

### What Remained the Same:
- **Database Schema**: No changes to image URL columns
- **API Endpoints**: Same upload/delete endpoints
- **File IDs**: Still stored in `drive_file_id` columns (name kept for compatibility)
- **Frontend Integration**: Minimal changes required

## Troubleshooting

Common issues and solutions:

### Authentication Error
- **Issue**: "Missing required ImageKit credentials"
- **Solution**: Verify all three environment variables are set correctly
- **Check**: Ensure no extra spaces or special characters in credentials

### Upload Failures
- **Issue**: "Upload failed" errors
- **Solution**: Check if your ImageKit plan has sufficient storage/bandwidth
- **Check**: Verify file size limits (ImageKit free plan has limits)

### Invalid URL Endpoint
- **Issue**: "Invalid URL endpoint" errors
- **Solution**: Ensure URL endpoint includes the protocol (https://)
- **Format**: `https://ik.imagekit.io/your_imagekit_id`

### CORS Issues
- **Issue**: Frontend cannot access images
- **Solution**: Configure CORS settings in ImageKit dashboard
- **Settings**: Allow your domain in ImageKit → Settings → Security

## Performance Benefits

### ImageKit Advantages over Google Drive:
1. **CDN Delivery**: Global CDN for faster image loading
2. **Real-time Transformations**: Resize, crop, optimize on-the-fly
3. **WebP Support**: Automatic format optimization
4. **SEO Friendly**: Better image URLs for search engines
5. **Developer Tools**: Rich API and SDK support
6. **Analytics**: Built-in image analytics and insights

### Example Transformations:
```
Original: https://ik.imagekit.io/demo/image.jpg
Resized: https://ik.imagekit.io/demo/image.jpg?tr=w-300,h-200
WebP: https://ik.imagekit.io/demo/image.jpg?tr=f-webp
Quality: https://ik.imagekit.io/demo/image.jpg?tr=q-70
```

## Security Best Practices

1. **Private Key Security**: Never expose private key in frontend code
2. **URL Signing**: Use signed URLs for sensitive images if needed
3. **Access Control**: Configure folder-level permissions in ImageKit
4. **Environment Files**: Always use `.env` files, never hardcode credentials
5. **Backup Strategy**: Consider backup strategy for critical images

## Support and Documentation

- **ImageKit Documentation**: https://docs.imagekit.io/
- **Node.js SDK**: https://github.com/imagekit-developer/imagekit-nodejs
- **API Reference**: https://docs.imagekit.io/api-reference/
- **Community Support**: https://community.imagekit.io/

---

**Last Updated**: January 2025  
**Status**: Ready for production use 