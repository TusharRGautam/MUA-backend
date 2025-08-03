require('dotenv').config();
const axios = require('axios');
const { query } = require('./db');

const API_URL = 'http://localhost:3000';

// Function to test database connection directly
async function testDbConnection() {
  try {
    console.log('Testing direct database connection...');
    const result = await query('SELECT NOW() as current_time');
    console.log('Database connection successful:', result.rows[0]);
    return true;
  } catch (err) {
    console.error('Database connection failed:', err.message);
    return false;
  }
}

// Function to test the customer API
async function testCustomerApi() {
  try {
    console.log(`Testing customer API at ${API_URL}/api/customers/all...`);
    const response = await axios.get(`${API_URL}/api/customers/all`, {
      timeout: 5000 // 5 second timeout
    });
    
    console.log('API request successful. Status:', response.status);
    console.log('Number of customers returned:', response.data.length);
    if (response.data.length > 0) {
      console.log('Sample customer data:', response.data[0]);
    } else {
      console.log('No customer records found');
    }
    return true;
  } catch (err) {
    console.error('API request failed:', err.message);
    if (err.response) {
      console.error('Error response:', {
        status: err.response.status,
        data: err.response.data
      });
    }
    return false;
  }
}

// Function to test direct database query for customers
async function testDirectCustomerQuery() {
  try {
    console.log('Testing direct customer query...');
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
      LIMIT 5
    `);
    
    console.log('Direct query successful. Records found:', result.rows.length);
    if (result.rows.length > 0) {
      console.log('Sample customer data:', result.rows[0]);
    } else {
      console.log('No customer records found in database');
    }
    return true;
  } catch (err) {
    console.error('Direct query failed:', err.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('=== Starting Tests ===');
  
  // Test database connection
  const dbConnected = await testDbConnection();
  console.log('\nDatabase connection test:', dbConnected ? 'PASSED' : 'FAILED');
  
  // Test direct customer query
  const directQueryWorked = await testDirectCustomerQuery();
  console.log('\nDirect customer query test:', directQueryWorked ? 'PASSED' : 'FAILED');
  
  // Test API
  const apiWorked = await testCustomerApi();
  console.log('\nAPI test:', apiWorked ? 'PASSED' : 'FAILED');
  
  console.log('\n=== Test Summary ===');
  console.log('Database connection:', dbConnected ? '✅' : '❌');
  console.log('Direct customer query:', directQueryWorked ? '✅' : '❌');
  console.log('Customer API:', apiWorked ? '✅' : '❌');
  
  console.log('\n=== Diagnostics ===');
  if (!dbConnected) {
    console.log('- Check your database connection string in .env file');
    console.log('- Verify database server is running');
  }
  
  if (dbConnected && !directQueryWorked) {
    console.log('- Check if customer_table_details table exists');
    console.log('- Verify table structure and column names');
  }
  
  if (directQueryWorked && !apiWorked) {
    console.log('- Check if Express server is running on port 3000');
    console.log('- Verify route is registered in src/index.js');
    console.log('- Check for errors in customerRoutes.js');
  }
}

// Run the tests
runTests()
  .then(() => console.log('\nTests completed'))
  .catch(err => console.error('Test error:', err))
  .finally(() => process.exit()); 