const express = require('express');
const cors = require('cors');
const { supabase } = require('./config/supabase');
const db = require('./config/database');
const productsRouter = require('./routes/products');
const usersRouter = require('./routes/users');
const artistsRouter = require('./routes/artists');
const businessRouter = require('./routes/business');
const indexRouter = require('./routes/index');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/products', productsRouter);
app.use('/api/users', usersRouter);
app.use('/api/artists', artistsRouter);
app.use('/api/business', businessRouter);
app.use('/api', indexRouter); // This contains more routes like /artists/:id/services, etc.

// Add a services route for the frontend
app.get('/api/services', async (req, res) => {
  try {
    // Get all services
    const { data, error } = await supabase
      .from('services')
      .select('*');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add services by category route
app.get('/api/services/category/:category', async (req, res) => {
  try {
    // Get services by category
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('category', req.params.category);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching services by category:', error);
    res.status(500).json({ error: error.message });
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

// Start server
const PORT =  3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});