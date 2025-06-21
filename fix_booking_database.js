const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration that matches the booking routes
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'muadatabase',
  password: process.env.DB_PASSWORD || 'tushar123',
  port: process.env.DB_PORT || 5432,
};

// Create pool for database operations
const pool = new Pool(dbConfig);

// Function to test database connection
async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection...');
    console.log('Database config:', {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.user,
      password: dbConfig.password ? '***' : 'not set'
    });
    
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    
    console.log('✅ Database connection successful!');
    console.log('📅 Database time:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Full error:', error);
    return false;
  }
}

// Function to create database if it doesn't exist
async function createDatabaseIfNotExists() {
  try {
    console.log('🔍 Checking if database exists...');
    
    // Connect to postgres database to check if our target database exists
    const tempPool = new Pool({
      ...dbConfig,
      database: 'postgres' // Connect to default postgres database
    });
    
    const client = await tempPool.connect();
    
    // Check if database exists
    const result = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbConfig.database]
    );
    
    if (result.rows.length === 0) {
      console.log(`📝 Creating database: ${dbConfig.database}`);
      await client.query(`CREATE DATABASE "${dbConfig.database}"`);
      console.log('✅ Database created successfully!');
    } else {
      console.log('✅ Database already exists');
    }
    
    client.release();
    await tempPool.end();
    return true;
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
    return false;
  }
}

// Function to check and create the booking table
async function ensureBookingTableExists() {
  try {
    console.log('🔍 Checking booking table structure...');
    
    const client = await pool.connect();
    
    // Check if table exists
    const tableExists = await client.query(`
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'booking_all_details_of_user_to_vendor'
    `);
    
    if (tableExists.rows.length === 0) {
      console.log('📝 Creating booking_all_details_of_user_to_vendor table...');
      
      // Create the table with all required columns
      await client.query(`
        CREATE TABLE booking_all_details_of_user_to_vendor (
          id SERIAL PRIMARY KEY,
          user_id INTEGER,
          vendor_id INTEGER,
          booking_id VARCHAR(255),
          service_name VARCHAR(255),
          service_type VARCHAR(100),
          customer_name VARCHAR(255),
          customer_email VARCHAR(255),
          customer_phone VARCHAR(20),
          address TEXT,
          total_amount DECIMAL(10, 2),
          vendor_name VARCHAR(255),
          user_name VARCHAR(255),
          services_booked JSONB,
          final_amount DECIMAL(10, 2),
          booking_date DATE,
          booking_time TIME,
          payment_method VARCHAR(50),
          service_category VARCHAR(100),
          status VARCHAR(50) DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create indexes
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_booking_user_id ON booking_all_details_of_user_to_vendor(user_id);
        CREATE INDEX IF NOT EXISTS idx_booking_vendor_id ON booking_all_details_of_user_to_vendor(vendor_id);
        CREATE INDEX IF NOT EXISTS idx_booking_id ON booking_all_details_of_user_to_vendor(booking_id);
        CREATE INDEX IF NOT EXISTS idx_booking_status ON booking_all_details_of_user_to_vendor(status);
        CREATE INDEX IF NOT EXISTS idx_booking_date ON booking_all_details_of_user_to_vendor(booking_date);
      `);
      
      console.log('✅ Booking table created successfully!');
    } else {
      console.log('✅ Booking table already exists');
    }
    
    // Check current table structure
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'booking_all_details_of_user_to_vendor' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Current table structure:');
    console.log('Column Name'.padEnd(25) + 'Data Type'.padEnd(20) + 'Nullable'.padEnd(10) + 'Default');
    console.log('-'.repeat(80));
    
    columns.rows.forEach(row => {
      console.log(
        row.column_name.padEnd(25) + 
        row.data_type.padEnd(20) + 
        row.is_nullable.padEnd(10) + 
        (row.column_default || 'NULL')
      );
    });
    
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Error ensuring booking table exists:', error.message);
    return false;
  }
}

// Function to add missing columns to existing table
async function addMissingColumns() {
  try {
    console.log('🔍 Checking for missing columns...');
    
    const client = await pool.connect();
    
    // Get current columns
    const currentColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'booking_all_details_of_user_to_vendor'
    `);
    
    const existingColumns = currentColumns.rows.map(row => row.column_name);
    
    // Define required columns
    const requiredColumns = [
      { name: 'booking_id', type: 'VARCHAR(255)' },
      { name: 'vendor_name', type: 'VARCHAR(255)' },
      { name: 'user_name', type: 'VARCHAR(255)' },
      { name: 'services_booked', type: 'JSONB' },
      { name: 'final_amount', type: 'DECIMAL(10, 2)' },
      { name: 'booking_date', type: 'DATE' },
      { name: 'booking_time', type: 'TIME' },
      { name: 'payment_method', type: 'VARCHAR(50)' },
      { name: 'service_category', type: 'VARCHAR(100)' }
    ];
    
    let addedColumns = 0;
    
    for (const column of requiredColumns) {
      if (!existingColumns.includes(column.name)) {
        console.log(`📝 Adding missing column: ${column.name}`);
        await client.query(`
          ALTER TABLE booking_all_details_of_user_to_vendor 
          ADD COLUMN IF NOT EXISTS ${column.name} ${column.type}
        `);
        addedColumns++;
      }
    }
    
    if (addedColumns > 0) {
      console.log(`✅ Added ${addedColumns} missing columns`);
    } else {
      console.log('✅ All required columns already exist');
    }
    
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Error adding missing columns:', error.message);
    return false;
  }
}

// Function to test booking insertion
async function testBookingInsertion() {
  try {
    console.log('🔍 Testing booking insertion...');
    
    const client = await pool.connect();
    
    // Test data
    const testBooking = {
      user_id: 1,
      vendor_id: 1,
      booking_id: `TEST_${Date.now()}`,
      service_name: 'Test Service',
      service_type: 'test',
      customer_name: 'Test User',
      customer_email: 'test@example.com',
      customer_phone: '1234567890',
      address: 'Test Address',
      total_amount: 100.00,
      vendor_name: 'Test Vendor',
      user_name: 'Test User',
      services_booked: JSON.stringify([{ name: 'Test Service', price: 100 }]),
      final_amount: 100.00,
      booking_date: '2024-01-15',
      booking_time: '10:00',
      payment_method: 'test',
      service_category: 'test',
      status: 'test'
    };
    
    // Insert test booking
    const result = await client.query(`
      INSERT INTO booking_all_details_of_user_to_vendor (
        user_id, vendor_id, booking_id, service_name, service_type,
        customer_name, customer_email, customer_phone, address, total_amount,
        vendor_name, user_name, services_booked, final_amount, booking_date,
        booking_time, payment_method, service_category, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
      ) RETURNING id
    `, [
      testBooking.user_id, testBooking.vendor_id, testBooking.booking_id,
      testBooking.service_name, testBooking.service_type, testBooking.customer_name,
      testBooking.customer_email, testBooking.customer_phone, testBooking.address,
      testBooking.total_amount, testBooking.vendor_name, testBooking.user_name,
      testBooking.services_booked, testBooking.final_amount, testBooking.booking_date,
      testBooking.booking_time, testBooking.payment_method, testBooking.service_category,
      testBooking.status
    ]);
    
    const insertedId = result.rows[0].id;
    console.log(`✅ Test booking inserted successfully with ID: ${insertedId}`);
    
    // Clean up test data
    await client.query('DELETE FROM booking_all_details_of_user_to_vendor WHERE id = $1', [insertedId]);
    console.log('🧹 Test data cleaned up');
    
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Error testing booking insertion:', error.message);
    return false;
  }
}

// Main function to run all fixes
async function runFixes() {
  console.log('🚀 Starting booking database fixes...');
  console.log('='.repeat(60));
  
  try {
    // Step 1: Create database if it doesn't exist
    const dbCreated = await createDatabaseIfNotExists();
    if (!dbCreated) {
      console.log('⚠️  Database creation failed, but continuing...');
    }
    
    // Step 2: Test database connection
    const connected = await testDatabaseConnection();
    if (!connected) {
      console.log('❌ Cannot proceed without database connection');
      process.exit(1);
    }
    
    // Step 3: Ensure booking table exists
    const tableExists = await ensureBookingTableExists();
    if (!tableExists) {
      console.log('❌ Failed to create booking table');
      process.exit(1);
    }
    
    // Step 4: Add missing columns
    const columnsAdded = await addMissingColumns();
    if (!columnsAdded) {
      console.log('⚠️  Failed to add missing columns');
    }
    
    // Step 5: Test booking insertion
    const insertionWorks = await testBookingInsertion();
    if (!insertionWorks) {
      console.log('❌ Booking insertion test failed');
      process.exit(1);
    }
    
    console.log('='.repeat(60));
    console.log('✅ All database fixes completed successfully!');
    console.log('📋 The booking system should now work properly');
    
  } catch (error) {
    console.error('❌ Fatal error during fixes:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the fixes
if (require.main === module) {
  runFixes();
}

module.exports = {
  testDatabaseConnection,
  createDatabaseIfNotExists,
  ensureBookingTableExists,
  addMissingColumns,
  testBookingInsertion,
  runFixes
}; 