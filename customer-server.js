// Simple standalone Express server for customer data
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { query } = require('./db');

const app = express();
const PORT = 3002; // Use port 3002 to avoid conflicts

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());

// Customer API endpoint
app.get('/api/customers/all', async (req, res) => {
  console.log('[CUSTOMER SERVER] GET /api/customers/all called');
  
  try {
    // Query the customer data
    const result = await query(`
      SELECT 
        id, 
        full_name, 
        email, 
        phone_number, 
        COALESCE(user_status, 'active') as user_status,
        created_at
      FROM customer_table_details
      ORDER BY created_at DESC
      LIMIT 100
    `);
    
    console.log(`[CUSTOMER SERVER] Retrieved ${result.rows.length} customer records`);
    
    // Format dates for better client handling
    const formattedResults = result.rows.map(customer => ({
      ...customer,
      created_at: customer.created_at ? new Date(customer.created_at).toISOString() : null
    }));
    
    res.json(formattedResults);
  } catch (error) {
    console.error('[CUSTOMER SERVER] Error fetching customers:', error);
    res.status(500).json({ 
      error: 'Failed to fetch customer data',
      details: error.message
    });
  }
});

// Status endpoint
app.get('/status', (req, res) => {
  res.json({ status: 'online' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`[CUSTOMER SERVER] Server running on http://localhost:${PORT}`);
  console.log(`[CUSTOMER SERVER] Customer data available at http://localhost:${PORT}/api/customers/all`);
}); 