require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Disable SSL certificate validation for development
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Create PostgreSQL client
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
});

async function insertTestRecord() {
  try {
    console.log('Inserting test record into registration_and_other_details table...');
    
    // Hash the password (security best practice)
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    // Insert a test record
    const insertQuery = `
      INSERT INTO registration_and_other_details (
        business_type, 
        person_name, 
        business_email, 
        gender, 
        phone_number, 
        password
      ) VALUES (
        $1, $2, $3, $4, $5, $6
      ) RETURNING sr_no;
    `;
    
    const values = [
      'salon', 
      'Test Vendor', 
      'test.vendor@example.com', 
      'male', 
      '1234567890', 
      hashedPassword
    ];
    
    const result = await pool.query(insertQuery, values);
    console.log(`✅ Test record inserted with sr_no: ${result.rows[0].sr_no}`);
    
    // Verify by fetching the record
    const fetchQuery = `
      SELECT sr_no, business_type, person_name, business_email, gender, phone_number, created_at 
      FROM registration_and_other_details
      WHERE business_email = $1;
    `;
    
    const fetchResult = await pool.query(fetchQuery, ['test.vendor@example.com']);
    console.log('\nInserted Record:');
    console.table(fetchResult.rows);
    
    console.log('\nTest record insertion complete!');
  } catch (error) {
    console.error('Error inserting test record:', error);
  } finally {
    pool.end();
  }
}

insertTestRecord(); 