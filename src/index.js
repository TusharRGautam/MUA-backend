const express = require('express');
const path = require('path');
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
const { setupDatabase } = require('./utils/db-setup');
const { authenticateToken, optionalAuthentication, conditionalVendorAuth } = require('../middleware/auth');
const corsMiddleware = require('../middleware/cors');
const errorHandler = require('../middleware/errorHandler');
const { query } = require('../db');

const app = express();

// Middleware
app.use(corsMiddleware);
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

// Apply optional authentication to routes that can work with or without authentication
app.use('/api/products', optionalAuthentication, productsRouter);
app.use('/api/salon-owners', optionalAuthentication, salonOwnersRouter);
app.use('/api/salons', salonRoutes);
app.use('/api/services', serviceRoutes);

// Apply required authentication to routes that need it
app.use('/api/users', usersRouter); // Login and register don't need auth
app.use('/api/artists', optionalAuthentication, artistsRouter);

// Import business routes
const businessAuthRoutes = require('../routes/businessRoutes'); // No auth middleware for login/register
// Use business routes that don't need authentication (login/register)
app.use('/api/business', businessAuthRoutes);

// Authenticated business routes
app.use('/api/business', authenticateToken, businessRouter);

// Add vendor routes WITHOUT authentication first
app.use('/api/vendor', vendorRoutes);

// Then add routes WITH authentication
app.use('/api/profiles', authenticateToken, profilesRouter);
app.use('/api/vendor', authenticateToken, vendorDashboardRouter);
// Add our new vendor routes with data isolation
// Use the conditional auth middleware that allows public endpoints
app.use('/api/vendor', conditionalVendorAuth, vendorRoutes);
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
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Local: http://localhost:${PORT}/api/ping`);
  
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