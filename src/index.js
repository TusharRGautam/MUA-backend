const express = require('express');
const cors = require('cors');
const supabase = require('./config/supabase');
const db = require('./config/database');
const productsRouter = require('./routes/products');
const usersRouter = require('./routes/users');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/products', productsRouter);
app.use('/api/users', usersRouter);

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
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});