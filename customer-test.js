// Simple test script for customer API
const express = require('express');
const cors = require('cors');
const { pool, query } = require('./db');

const app = express();
const PORT = 3001; // Use a different port to avoid conflicts

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Test endpoint to get customers
app.get('/api/customers/all', async (req, res) => {
  console.log('[TEST API] GET /api/customers/all endpoint called');
  
  try {
    // Query the database for customers
    const customersQuery = `
      SELECT 
        id, 
        full_name, 
        email, 
        phone_number, 
        user_status,
        created_at
      FROM customer_table_details
      ORDER BY created_at DESC
    `;
    
    console.log('[TEST API] Executing query:', customersQuery);
    
    const result = await query(customersQuery);
    
    console.log(`[TEST API] Query executed successfully. Fetched ${result.rows.length} customer records`);
    
    if (result.rows.length > 0) {
      console.log('[TEST API] Sample customer record:', JSON.stringify(result.rows[0]));
    } else {
      console.log('[TEST API] No customer records found');
    }
    
    res.json(result.rows);
  } catch (error) {
    console.error('[TEST API] Error fetching customers:', error);
    res.status(500).json({ 
      error: 'Failed to fetch customers',
      details: error.message
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`[TEST API] Server running on http://localhost:${PORT}`);
}); 