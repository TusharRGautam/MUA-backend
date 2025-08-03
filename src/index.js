const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const { supabase } = require('./config/supabase');
const db = require('./config/database');
const productsRouter = require('./routes/products');
const usersRouter = require('./routes/users');
const artistsRouter = require('./routes/artists');
const businessRouter = require('./routes/business');
const indexRouter = require('./routes/index');
const profilesRouter = require('../routes/profileRoutes');
const vendorDashboardRouter = require('./routes/vendor-dashboard');
const salonOwnersRouter = require('./routes/salon-owners');
// Import our new vendor routes for data isolation
const vendorRoutes = require('../routes/vendorRoutes');
const authRoutes = require('../routes/authRoutes');
const salonRoutes = require('../routes/salonRoutes');
const serviceRoutes = require('../routes/serviceRoutes');
// Import the new customer routes
const customerRoutes = require('../routes/customerRoutes');
console.log('[Server] Customer routes imported');
// Import dashboard service routes
const dashboardServiceRoutes = require('../routes/dashboardServiceRoutes');
console.log('[Server] Dashboard service routes imported');

// Import push notification routes
const pushNotificationRoutes = require('../routes/pushNotifications');

// Import upload routes for Google Drive integration
const uploadRoutes = require('../routes/uploadRoutes');
// Import transformation routes
const transformationRoutes = require('../routes/transformationRoutes');
// Import PRP service routes
const prpServiceRoutes = require('../routes/prpServiceRoutes');
// Import admin routes
const adminRoutes = require('../routes/adminRoutes');
// Import optimized routes for performance
const optimizedRoutes = require('../routes/optimizedRoutes');
// Import booking routes
const bookingRoutes = require('../routes/bookingRoutes');
// Import random images routes
const randomImagesRoutes = require('../routes/randomImagesRoutes');
// e2053d6da77efd3eff1f59c2c833118e40c24866
const { setupDatabase } = require('./utils/db-setup');
const { authenticateToken, optionalAuthentication, conditionalVendorAuth } = require('../middleware/auth');
const corsMiddleware = require('../middleware/cors');
const errorHandler = require('../middleware/errorHandler');
const { query } = require('../db');

const app = express();

// Performance optimizations
app.use(compression()); // Compress all responses
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
  crossOriginEmbedderPolicy: false
})); // Add security headers

// Middleware
app.use(corsMiddleware);

// Add middleware to handle large header requests
app.use((req, res, next) => {
  // Set custom headers size limits
  req.connection.maxHeaderPairs = 2000; // Increase header pairs limit
  
  // Log large headers for debugging
  const headerSize = JSON.stringify(req.headers).length;
  if (headerSize > 5000) {
    console.log(`[WARNING] Large headers detected: ${headerSize} characters`);
    console.log('Large headers:', Object.keys(req.headers).map(key => `${key}: ${req.headers[key]?.length || 0} chars`));
  }
  
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Check for required environment variables
const requiredEnvVars = [
  'DATABASE_URL', 
  'SUPABASE_CONNECTION_STRING'
];

// Check if at least one of these variables is set (we need either one)
const hasDbConnection = requiredEnvVars.some(varName => process.env[varName]);
if (!hasDbConnection) {
  console.error('ERROR: Missing required environment variables for database connection.');
  console.error('Please set either DATABASE_URL or SUPABASE_CONNECTION_STRING.');
  // Don't exit as we'll handle this gracefully
}

// Setup database tables if they don't exist
setupDatabase().catch(err => {
  console.error('Database setup failed:', err);
});

// Serve static files from the public directory
app.use('/static', express.static(path.join(__dirname, '../public')));

// Serve static files from uploads directory
app.use('/static/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Routes
// Add a simple ping route as the first route to check basic connectivity
app.get('/api/ping', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend API is reachable',
    timestamp: new Date().toISOString()
  });
});

// Add auth routes
app.use('/api/auth', authRoutes);

// Add customer routes - registration and login don't need authentication
app.use('/api/customers', customerRoutes);
console.log('[Server] Registered customer routes at /api/customers');

// Add push notification routes     
app.use('/api/push-notifications', pushNotificationRoutes); 

// Add upload routes for Google Drive integration 
app.use('/api/upload', uploadRoutes);
// Add transformation routes for the transformation image management
app.use('/api/transformation', transformationRoutes);
// Add PRP service routes for PRP services management
app.use('/api/prp-services', prpServiceRoutes);
// Add admin routes for vendor approval management
app.use('/api/admin', adminRoutes);
// Add optimized routes for better performance
app.use('/api/optimized', optimizedRoutes);
// Add booking routes for booking management
app.use('/api/bookings', bookingRoutes);
app.use('/api/booking_all_details_of_user_to_vendor', bookingRoutes);
console.log('[Server] Booking routes registered at /api/bookings and /api/booking_all_details_of_user_to_vendor');
// Add random images routes for gallery and transformation images
app.use('/api/random-images', randomImagesRoutes);
console.log('[Server] Random images routes registered at /api/random-images');
// e2053d6da77efd3eff1f59c2c833118e40c24866


// Apply optional authentication to routes that can work with or without authentication
app.use('/api/products', optionalAuthentication, productsRouter);
app.use('/api/salon-owners', optionalAuthentication, salonOwnersRouter);
app.use('/api/salons', salonRoutes);
app.use('/api/services', serviceRoutes);

// Add dashboard service routes
app.use('/api/dashboard-services', dashboardServiceRoutes);
console.log('[Server] Dashboard service routes registered at /api/dashboard-services');

// Apply required authentication to routes that need it
app.use('/api/users', usersRouter); // Login and register don't need auth
app.use('/api/artists', optionalAuthentication, artistsRouter);

// Import business routes
const businessAuthRoutes = require('../routes/businessRoutes'); // No auth middleware for login/register
// Use business routes that don't need authentication (login/register)
app.use('/api/business', businessAuthRoutes);

// Authenticated business routes
app.use('/api/business', authenticateToken, businessRouter);

// Add vendor routes WITHOUT authentication for public endpoints
app.use('/api/vendor', vendorRoutes);

// Then add other protected routes  
app.use('/api/profiles', authenticateToken, profilesRouter);
// NOTE: Commenting out the duplicate vendor route that was causing 404 errors
// app.use('/api/vendor', authenticateToken, vendorDashboardRouter);
app.use('/api', optionalAuthentication, indexRouter); // This contains more routes like /artists/:id/services, etc.

// Remove duplicate salon routes as we now have a dedicated salonRoutes module

// Global 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.originalUrl} does not exist`
  });
});

// Global error handler - must be last
app.use(errorHandler);

// Function to fetch all vendor profiles
const fetchAllVendorProfiles = async () => {
  try {
    console.log('Fetching all vendor profiles from registration_and_other_details table...');
    const result = await query(
      'SELECT sr_no, business_email, person_name, business_type, business_name, phone_number, business_address, business_description FROM registration_and_other_details'
    );
    
    console.log('Total vendor profiles found:', result.rows.length);
    console.log('Vendor profiles:');
    console.log(JSON.stringify(result.rows, null, 2));
    return result.rows;
  } catch (error) {
    console.error('Error fetching vendor profiles:', error);
    return [];
  }
};

// Function to fetch all customers from customer_table_details
const fetchAllCustomers = async () => {
  try {
    console.log('Fetching all customer data from customer_table_details table...');
    const result = await query(
      'SELECT id, full_name, email, phone_number, latitude, longitude, distance, created_at, updated_at, user_status FROM customer_table_details'
    );
    
    console.log('Total customers found:', result.rows.length);
    console.log('Customer details:');
    console.log(JSON.stringify(result.rows, null, 2));
    return result.rows;
  } catch (error) {
    console.error('Error fetching customer details:', error);
    return [];
  }
};

// Function to fetch all vendor single services
const fetchAllVendorSingleServices = async () => {
  try {
    console.log('Fetching all vendor single services from vendor_single_services table...');
    const result = await query(
      'SELECT * FROM vendor_single_services'
    );
    
    console.log('Total vendor single services found:', result.rows.length);
    console.log('Vendor single services:');
    console.log(JSON.stringify(result.rows, null, 2));
    return result.rows;
  } catch (error) {
    console.error('Error fetching vendor single services:', error);
    return [];
  }
};

// Function to fetch all vendor package services
const fetchAllVendorPackageServices = async () => {
  try {
    console.log('Fetching all vendor package services from vendor_packages_services table...');
    const result = await query(
      'SELECT * FROM vendor_packages_services'
    );
    
    console.log('Total vendor package services found:', result.rows.length);
    console.log('Vendor package services:');
    console.log(JSON.stringify(result.rows, null, 2));
    return result.rows;
  } catch (error) {
    console.error('Error fetching vendor package services:', error);
    return [];
  }
};

// Function to fetch all vendor combo services
const fetchAllVendorComboServices = async () => {
  try {
    console.log('Fetching all vendor combo services from vendor_combo_services table...');
    const result = await query(
      'SELECT * FROM vendor_combo_services'
    );
    
    console.log('Total vendor combo services found:', result.rows.length);
    console.log('Vendor combo services:');
    console.log(JSON.stringify(result.rows, null, 2));
    return result.rows;
  } catch (error) {
    console.error('Error fetching vendor combo services:', error);
    return [];
  }
};

// Function to fetch all vendor gallery images
const fetchAllVendorGalleryImages = async () => {
  try {
    console.log('Fetching all vendor gallery images from vendor_gallery_images table...');
    const result = await query(
      'SELECT * FROM vendor_gallery_images'
    );
    
    console.log('Total vendor gallery images found:', result.rows.length);
    
    // Create a copy of the result rows without the url field for console logging
    const logSafeRows = result.rows.map(row => {
      const { url, ...rowWithoutUrl } = row;
      return rowWithoutUrl;
    });
    
    console.log('Vendor gallery images (excluding url field):');
    console.log(JSON.stringify(logSafeRows, null, 2));
    return result.rows;
  } catch (error) {
    console.error('Error fetching vendor gallery images:', error);
    return [];
  }
};

// Function to fetch all vendor transformations
const fetchAllVendorTransformations = async () => {
  try {
    console.log('Fetching all vendor transformations from vendor_transformations table...');
    const result = await query(
      'SELECT * FROM vendor_transformations'
    );
    
    console.log('Total vendor transformations found:', result.rows.length);
    
    // Create a copy of the result rows without the before_image and after_image fields for console logging
    const logSafeRows = result.rows.map(row => {
      const { before_image, after_image, ...rowWithoutImages } = row;
      return rowWithoutImages;
    });
    
    console.log('Vendor transformations (excluding before_image and after_image fields):');
    console.log(JSON.stringify(logSafeRows, null, 2));
    return result.rows;
  } catch (error) {
    console.error('Error fetching vendor transformations:', error);
    return [];
  }
};

// Start the server
const PORT = process.env.PORT || 3001;

// Create server with increased header size limits to handle large JWT tokens
const server = require('http').createServer(app);
server.maxHeadersCount = 0; // Remove limit on number of headers
server.setTimeout(120000); // 2 minutes timeout

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Local: http://localhost:${PORT}/api/ping`);
  console.log(`Admin routes available at: http://localhost:${PORT}/api/admin/test`);
  
  // Fetch all vendor profiles when the server starts
  fetchAllVendorProfiles();
  
  // Fetch all vendor single services when the server starts
  fetchAllVendorSingleServices();
  
  // Fetch all vendor package services when the server starts
  fetchAllVendorPackageServices();
  
  // Fetch all vendor combo services when the server starts
  fetchAllVendorComboServices();
  
  // Fetch all vendor gallery images when the server starts
  fetchAllVendorGalleryImages();
  
  // Fetch all vendor transformations when the server starts
  fetchAllVendorTransformations();
  
  // Fetch all customers from customer_table_details when the server starts
  fetchAllCustomers();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application continues running
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // For critical errors, we may want to exit
  if (error.message.includes('EADDRINUSE')) {
    console.error('Port is already in use. Exiting...');
    process.exit(1);
  }
  // Otherwise, app continues running
});

module.exports = app;