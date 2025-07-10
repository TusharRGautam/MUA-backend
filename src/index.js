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
const prpRoutes = require('../routes/prpRoutes');
const packageRoutes = require('../routes/packageRoutes');
// Import the new customer routes
const customerRoutes = require('../routes/customerRoutes');

// Import push notification routes
const pushNotificationRoutes = require('../routes/pushNotifications');

// Import upload routes for Google Drive integration
const uploadRoutes = require('../routes/uploadRoutes');
// Import transformation routes
const transformationRoutes = require('../routes/transformationRoutes');
// Import booking routes
const bookingRoutes = require('../routes/bookingRoutes');
const bookingRescheduleRoutes = require('../routes/bookingRescheduleRoutes');
// e2053d6da77efd3eff1f59c2c833118e40c24866
const { setupDatabase } = require('./utils/db-setup');
const { authenticateToken, optionalAuthentication, conditionalVendorAuth } = require('../middleware/auth');
const corsMiddleware = require('../middleware/cors');
const errorHandler = require('../middleware/errorHandler');
const { query } = require('../db');
const { optimizeImageUrlsMiddleware } = require('../utils/optimizedImageService');

const app = express();

// Middleware
app.use(corsMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add image optimization middleware for all API routes
app.use('/api', optimizeImageUrlsMiddleware({
  maxWidth: 1200,
  maxHeight: 800,
  quality: 80
}));

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

// Serve static files from processed uploads directory (for identity documents)
app.use('/uploads/processed', express.static(path.join(__dirname, '../uploads/processed')));

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


// Add push notification routes     
app.use('/api/push-notifications', pushNotificationRoutes); 

// Add upload routes for Google Drive integration 
app.use('/api/upload', uploadRoutes);
// Add transformation routes for the transformation image management
app.use('/api/transformation', transformationRoutes);
// Add booking routes for booking management
console.log('🔗 Registering booking routes at /api/bookings');
app.use('/api/bookings', bookingRoutes);
console.log('✅ Booking routes registered successfully');

// Add booking reschedule routes
console.log('🔗 Registering booking reschedule routes at /api/booking-reschedule');
app.use('/api/booking-reschedule', bookingRescheduleRoutes);
console.log('✅ Booking reschedule routes registered successfully');

// Add vendor booking routes for dashboard integration
const vendorBookingRoutes = require('../routes/vendorBookingRoutes');
console.log('🔗 Registering vendor booking routes at /api/vendor/bookings');
app.use('/api/vendor/bookings', vendorBookingRoutes);
console.log('✅ Vendor booking routes registered successfully');

// Add vendor push token routes for notification management
const vendorPushTokenRoutes = require('../routes/vendorPushTokenRoutes');
console.log('🔗 Registering vendor push token routes at /api/vendor/push-token');
app.use('/api/vendor/push-token', vendorPushTokenRoutes);
console.log('✅ Vendor push token routes registered successfully');

// Add vendor identity document routes for KYC management
const vendorIdentityRoutes = require('../routes/vendorIdentityRoutes');
console.log('🔗 Registering vendor identity document routes at /api/vendor-identity');
app.use('/api/vendor-identity', vendorIdentityRoutes);
console.log('✅ Vendor identity document routes registered successfully');

// Add Google Drive token routes for frontend integration
const googleDriveTokenRoutes = require('../routes/googleDriveTokenRoutes');
console.log('🔗 Registering Google Drive token routes at /api/drive');
app.use('/api/drive', googleDriveTokenRoutes);
console.log('✅ Google Drive token routes registered successfully');

// Add vendor preferences routes for onboarding and service management
const vendorPreferencesRoutes = require('../routes/vendorPreferencesRoutes');
console.log('🔗 Registering vendor preferences routes at /api/vendor-preferences');
app.use('/api/vendor-preferences', vendorPreferencesRoutes);
console.log('✅ Vendor preferences routes registered successfully');

// Add ready services routes for vendor service management
const readyServicesRoutes = require('../routes/readyServicesRoutes');
console.log('🔗 Registering ready services routes at /api/ready-services');
app.use('/api/ready-services', readyServicesRoutes);
console.log('✅ Ready services routes registered successfully');

// Add dashboard services routes (salon, prp, diagnostics)
const dashboardServicesRoutes = require('../routes/dashboardServicesRoutes');
console.log('🔗 Registering dashboard services routes at /api/dashboard-services');
app.use('/api/dashboard-services', dashboardServicesRoutes);
console.log('✅ Dashboard services routes registered successfully');
// e2053d6da77efd3eff1f59c2c833118e40c24866


// Apply optional authentication to routes that can work with or without authentication
app.use('/api/products', optionalAuthentication, productsRouter);
app.use('/api/salon-owners', optionalAuthentication, salonOwnersRouter);
app.use('/api/salons', salonRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/prp', prpRoutes);
app.use('/api/packages', packageRoutes);

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

// New API endpoints for vendor service fetching based on database tables
// Get vendor business type from registration_and_other_details table
app.get('/api/vendor/:vendorId/business-type', async (req, res) => {
  try {
    const { vendorId } = req.params;
    console.log(`🔍 Fetching business type for vendor ID: ${vendorId}`);
    
    const result = await query(
      'SELECT business_type FROM registration_and_other_details WHERE sr_no = $1',
      [vendorId]
    );
    
    if (result.rows.length === 0) {
      console.log(`⚠️ No business type found for vendor ID: ${vendorId}`);
      return res.status(404).json({ 
        error: 'Vendor not found',
        business_type: 'salon' // Default fallback
      });
    }
    
    const businessType = result.rows[0].business_type || 'salon';
    console.log(`✅ Business type for vendor ${vendorId}: ${businessType}`);
    
    res.json({ 
      business_type: businessType,
      vendor_id: vendorId
    });
  } catch (error) {
    console.error('❌ Error fetching vendor business type:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      business_type: 'salon' // Default fallback
    });
  }
});

// Get vendor selected categories from ready_services_vendors_data table
app.get('/api/vendor/:vendorId/selected-categories', async (req, res) => {
  try {
    const { vendorId } = req.params;
    console.log(`🔍 Fetching selected categories for vendor ID: ${vendorId}`);
    
    const result = await query(
      'SELECT selected_categories FROM ready_services_vendors_data WHERE vendor_id = $1',
      [vendorId]
    );
    
    if (result.rows.length === 0) {
      console.log(`⚠️ No selected categories found for vendor ID: ${vendorId}`);
      return res.status(404).json({ 
        error: 'Vendor categories not found',
        selected_categories: []
      });
    }
    
    let selectedCategories = result.rows[0].selected_categories || [];
    
    // If selected_categories is a string (JSON), parse it
    if (typeof selectedCategories === 'string') {
      try {
        selectedCategories = JSON.parse(selectedCategories);
      } catch (parseError) {
        console.error('❌ Error parsing selected_categories JSON:', parseError);
        selectedCategories = [];
      }
    }
    
    // Ensure it's an array
    if (!Array.isArray(selectedCategories)) {
      selectedCategories = [];
    }
    
    console.log(`✅ Selected categories for vendor ${vendorId}:`, selectedCategories);
    
    res.json({ 
      selected_categories: selectedCategories,
      vendor_id: vendorId
    });
  } catch (error) {
    console.error('❌ Error fetching vendor selected categories:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      selected_categories: []
    });
  }
});

// Get services from our_services_section table based on categories and business type
app.post('/api/services/by-categories', async (req, res) => {
  try {
    const { categories, business_type } = req.body;
    console.log(`🔍 Fetching services for categories: ${categories.join(', ')} and business type: ${business_type}`);
    
    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({ 
        error: 'Categories array is required',
        services: []
      });
    }
    
    // Step 1: Get all available categories from our_services_section table
    const availableCategoriesResult = await query(`
      SELECT DISTINCT category 
      FROM our_services_section 
      WHERE category IS NOT NULL
    `);
    
    const availableCategories = availableCategoriesResult.rows.map(row => row.category);
    console.log(`📋 Available categories in database: ${availableCategories.join(', ')}`);
    
    // Step 2: Find matching categories (exact and case-insensitive)
    const matchingCategories = [];
    
    categories.forEach(selectedCat => {
      // Try exact match first
      const exactMatch = availableCategories.find(availCat => availCat === selectedCat);
      if (exactMatch) {
        matchingCategories.push(exactMatch);
      } else {
        // Try case-insensitive match
        const caseInsensitiveMatch = availableCategories.find(availCat => 
          availCat.toLowerCase() === selectedCat.toLowerCase()
        );
        if (caseInsensitiveMatch) {
          matchingCategories.push(caseInsensitiveMatch);
        }
      }
    });
    
    // Remove duplicates
    const uniqueMatchingCategories = [...new Set(matchingCategories)];
    
    console.log(`🎯 Matching categories found: ${uniqueMatchingCategories.join(', ')}`);
    console.log(`📊 ${uniqueMatchingCategories.length} out of ${categories.length} categories matched`);
    
    if (uniqueMatchingCategories.length === 0) {
      console.log('⚠️ No matching categories found, returning empty result');
      return res.json({ 
        services: [],
        categories: categories,
        business_type: business_type,
        count: 0,
        matching_categories: [],
        search_type: 'no_matches'
      });
    }
    
    // Step 3: Query services with matching categories (removed business_type filter)
    const placeholders = uniqueMatchingCategories.map((_, index) => `$${index + 1}`).join(', ');
    const query_text = `
      SELECT id, service_name, service_description, price, service_image, category, business_type
      FROM our_services_section 
      WHERE category IN (${placeholders})
      ORDER BY service_name
    `;
    
    const queryParams = [...uniqueMatchingCategories];
    
    console.log('🔧 Note: Business type filter removed - services available to all vendor types');
    
    console.log(`🔍 Executing query: ${query_text}`);
    console.log(`🔍 Query parameters:`, queryParams);
    
    const result = await query(query_text, queryParams);
    
    console.log(`✅ Found ${result.rows.length} services matching categories`);
    
    res.json({ 
      services: result.rows,
      categories: categories,
      business_type: business_type,
      count: result.rows.length,
      matching_categories: uniqueMatchingCategories,
      search_type: 'filtered_match'
    });
    
  } catch (error) {
    console.error('❌ Error fetching services by categories:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      services: []
    });
  }
});

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

// Function to fetch and display dashboard service tables
async function fetchDashboardServiceTables() {
  try {
    console.log('\n🔍 Fetching Dashboard Service Tables...');
    console.log('=' .repeat(50));
    
    // Fetch dashboard_salon_services
    console.log('\n🏪 Dashboard Salon Services:');
    const salonServices = await query('SELECT * FROM dashboard_salon_services ORDER BY service_name');
    console.log(`Total Salon Services: ${salonServices.rows.length}`);
    if (salonServices.rows.length > 0) {
      console.table(salonServices.rows.map(row => ({
        id: row.id,
        service_name: row.service_name,
        service_categories: row.service_categories,
        price: row.price,
        duration: row.duration
      })));
    } else {
      console.log('No salon services found.');
    }
    
    // Fetch dashboard_prp_services
    console.log('\n💉 Dashboard PRP Services:');
    const prpServices = await query('SELECT * FROM dashboard_prp_services ORDER BY service_name');
    console.log(`Total PRP Services: ${prpServices.rows.length}`);
    if (prpServices.rows.length > 0) {
      console.table(prpServices.rows.map(row => ({
        id: row.id,
        service_name: row.service_name,
        service_categories: row.service_categories,
        price: row.price,
        duration: row.duration
      })));
    } else {
      console.log('No PRP services found.');
    }
    
    // Fetch dashboard_diagnostics_services
    console.log('\n🏥 Dashboard Diagnostics Services:');
    const diagnosticsServices = await query('SELECT * FROM dashboard_diagnostics_services ORDER BY service_name');
    console.log(`Total Diagnostics Services: ${diagnosticsServices.rows.length}`);
    if (diagnosticsServices.rows.length > 0) {
      console.table(diagnosticsServices.rows.map(row => ({
        id: row.id,
        service_name: row.service_name,
        service_categories: row.service_categories,
        price: row.price,
        duration: row.duration
      })));
    } else {
      console.log('No diagnostics services found.');
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log('✅ Dashboard service tables fetched successfully!');
    
  } catch (error) {
    console.error('❌ Error fetching dashboard service tables:', error.message);
  }
}

// Function to fetch and display our services tables
async function fetchOurServicesTables() {
  try {
    console.log('\n🔍 Fetching Our Services Tables...');
    console.log('=' .repeat(50));
    
    // Fetch our_services_section
    console.log('\n📚 Our Services Section:');
    const sectionServices = await query('SELECT * FROM our_services_section ORDER BY id');
    console.log(`Total Service Sections: ${sectionServices.rows.length}`);
    if (sectionServices.rows.length > 0) {
      console.table(sectionServices.rows.map(row => ({
        id: row.id,
        service_name: row.service_name,
        service_description: row.service_description ? row.service_description.substring(0, 30) + '...' : '',
        toggle_gender: row.toggle_gender,
        service_image: row.service_image ? '(image data)' : 'null'
      })));
    } else {
      console.log('No service sections found.');
    }
    
    // Fetch our_services_icons
    console.log('\n🔍 Our Services Icons:');
    const iconServices = await query('SELECT * FROM our_services_icons ORDER BY id');
    console.log(`Total Service Icons: ${iconServices.rows.length}`);
    if (iconServices.rows.length > 0) {
      console.table(iconServices.rows.map(row => ({
        id: row.id,
        icon_title: row.icon_title,
        toggle_gender: row.toggle_gender,
        icon_description: row.icon_description ? row.icon_description.substring(0, 30) + '...' : '',
        icon: row.icon ? '(icon data)' : 'null'
      })));
    } else {
      console.log('No service icons found.');
    }
    
    // Fetch our_services_product
    console.log('\n🛍️ Our Services Products:');
    const productServices = await query('SELECT * FROM our_services_product ORDER BY id');
    console.log(`Total Service Products: ${productServices.rows.length}`);
    if (productServices.rows.length > 0) {
      console.table(productServices.rows.map(row => ({
        id: row.id,
        our_services_category: row.our_services_category,
        product_name: row.product_name,
        service_id: row.service_id
      })));
    } else {
      console.log('No service products found.');
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log('✅ Our services tables fetched successfully!');
    
  } catch (error) {
    console.error('❌ Error fetching our services tables:', error.message);
  }
}

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌐 Local: http://localhost:${PORT}/api/ping`);
  console.log(`📋 Available routes:`);
  console.log(`   - POST /api/bookings (Create booking)`);
  console.log(`   - GET /api/bookings/:bookingId (Get booking by ID)`);
  console.log(`   - GET /api/bookings/user/:userId (Get user bookings)`);
  console.log(`   - PUT /api/bookings/:bookingId/status (Update booking status)`);
  console.log(`   - GET /api/bookings (Get all bookings)`);
  console.log(`   - GET /api/ping (Health check)`);
  console.log(`🔧 Test booking endpoint: http://localhost:${PORT}/api/bookings`);
  
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
  
  // Fetch and display dashboard service tables on startup
  fetchDashboardServiceTables();
  
  // Fetch and display our services tables on startup
  fetchOurServicesTables();
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