# Environment Configuration for Google Drive Integration

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

# Google Drive API Configuration
GOOGLE_APPLICATION_CREDENTIALS=path/to/your-service-account-credentials.json
GOOGLE_DRIVE_PARENT_FOLDER_ID=your_google_drive_parent_folder_id

# JWT Secret
JWT_SECRET=your_jwt_secret
```

## Setting up Google Drive API Credentials

To set up Google Drive API integration, follow these steps:

1. **Create a Google Cloud Project**:
   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Google Drive API for your project

2. **Create a Service Account**:
   - In your Google Cloud project, go to "IAM & Admin" > "Service Accounts"
   - Click "Create Service Account"
   - Enter a name and description for the service account
   - Grant it appropriate roles (at minimum, "Drive File Creator" role)
   - Click "Continue" and then "Done"

3. **Generate Service Account Key**:
   - Click on the newly created service account
   - Go to the "Keys" tab
   - Click "Add Key" > "Create new key"
   - Choose JSON format and click "Create"
   - Save the downloaded JSON file securely

4. **Set up the Parent Folder**:
   - Create a folder in your Google Drive where all user gallery folders will be stored
   - Share this folder with the service account email (e.g., `service-account-name@project-id.iam.gserviceaccount.com`)
   - Give the service account "Editor" access to this folder
   - Get the folder ID from the URL when you open the folder (the long string after `folders/` in the URL)

5. **Configure Environment Variables**:
   - Set `GOOGLE_APPLICATION_CREDENTIALS` to the path of your service account JSON file
   - Set `GOOGLE_DRIVE_PARENT_FOLDER_ID` to the ID of the parent folder you created

## Testing the Configuration

You can test if your Google Drive configuration is working by running:

```javascript
const { initializeDriveClient } = require('./utils/googleDriveService');

// This will throw an error if the configuration is incorrect
const driveClient = initializeDriveClient();
console.log('Google Drive client initialized successfully!');
```

## Troubleshooting

Common issues and solutions:

- **Authentication Error**: Make sure the path to your credentials file is correct and the file has not been corrupted.
- **Permission Denied**: Ensure the service account has proper permissions on the parent folder.
- **Folder Not Found**: Verify the parent folder ID is correct and the folder still exists.
- **API Not Enabled**: Make sure you've enabled the Google Drive API in your Google Cloud project. 