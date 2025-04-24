const express = require('express');
const cors = require('cors');
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
// Import our new vendor routes for data isolation
const vendorRoutes = require('../routes/vendorRoutes');
const { setupDatabase } = require('./utils/db-setup');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

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
app.use('/api/products', productsRouter);
app.use('/api/users', usersRouter);
app.use('/api/artists', artistsRouter);
app.use('/api/business', businessRouter);
app.use('/api/profiles', profilesRouter);
app.use('/api/vendor', vendorDashboardRouter);
// Add our new vendor routes with data isolation
app.use('/api/vendor', vendorRoutes);
app.use('/api', indexRouter); // This contains more routes like /artists/:id/services, etc.

// Add a services route for the frontend
app.get('/api/services', async (req, res) => {
  try {
    // Get all services
    const { data, error } = await supabase
      .from('salon_services')
      .select('*');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add salon routes for the frontend
app.get('/api/salons', async (req, res) => {
  try {
    // Get all salons
    const { data, error } = await supabase
      .from('salons')
      .select('*');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching salons:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/salons/:id', async (req, res) => {
  try {
    // Get salon by ID
    const { data: salon, error: salonError } = await supabase
      .from('salons')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (salonError) throw salonError;
    
    // Get salon services
    const { data: services, error: servicesError } = await supabase
      .from('salon_services')
      .select('*')
      .eq('salon_id', req.params.id);
      
    if (servicesError) throw servicesError;
    
    // Get salon artists
    const { data: artists, error: artistsError } = await supabase
      .from('salon_artists')
      .select('*')
      .eq('salon_id', req.params.id);
      
    if (artistsError) throw artistsError;
    
    // Combine data
    const salonWithRelations = {
      ...salon,
      services: services || [],
      artists: artists || []
    };
    
    res.json(salonWithRelations);
  } catch (error) {
    console.error('Error fetching salon details:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add services by category route
app.get('/api/services/category/:category', async (req, res) => {
  try {
    // Get services by category
    const { data, error } = await supabase
      .from('salon_services')
      .select('*')
      .eq('category', req.params.category);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching services by category:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add direct route for popular salon owners
app.get('/api/salon-owners/popular', async (req, res) => {
  try {
    console.log('Popular salon owners endpoint hit');
    const result = await db.query(`
      SELECT * FROM salonestoreowner
      ORDER BY rating DESC
      LIMIT 5
    `);
    
    console.log('Popular salon owners results:', result.rows.length);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching popular salon owners:', err);
    res.status(500).json({ error: err.message });
  }
});

// Test database connection
app.get('/api/health', async (req, res) => {
  try {
    // Test PostgreSQL connection
    const pgResult = await db.query('SELECT NOW()');

    // Test Supabase connection
    const { data, error } = await supabase.from('profiles').select('count').single();

    res.json({
      status: 'healthy',
      postgresql: 'connected',
      supabase: error ? 'error' : 'connected',
      timestamp: pgResult.rows[0].now
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Add this route to check database connection health
app.get('/api/system/health', async (req, res) => {
  try {
    // Check database connection
    const pgClient = await db.pool.connect();
    pgClient.release();
    
    res.json({
      status: 'healthy',
      database: 'connected',
      environment: {
        database_url_set: !!process.env.DATABASE_URL,
        supabase_connection_set: !!process.env.SUPABASE_CONNECTION_STRING
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      environment: {
        database_url_set: !!process.env.DATABASE_URL,
        supabase_connection_set: !!process.env.SUPABASE_CONNECTION_STRING
      }
    });
  }
});

// Add error handling for routes
app.use((req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`
  });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred'
      : err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});