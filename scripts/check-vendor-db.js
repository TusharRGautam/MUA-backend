require('dotenv').config();
const { Pool } = require('pg');

// Disable SSL certificate validation for development
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Create PostgreSQL client
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.SUPABASE_CONNECTION_STRING,
  ssl: { rejectUnauthorized: false }
});

// Check if database connection works
async function checkDbConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    client.release();
    return true;
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    console.error('Please check your environment variables:');
    console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? "Set" : "Not set"}`);
    console.log(`SUPABASE_CONNECTION_STRING: ${process.env.SUPABASE_CONNECTION_STRING ? "Set" : "Not set"}`);
    return false;
  }
}

// Check if the registration_and_other_details table exists
async function checkTableExists() {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'registration_and_other_details'
      );
    `);
    
    if (result.rows[0].exists) {
      console.log('✅ Table registration_and_other_details exists');
      return true;
    } else {
      console.error('❌ Table registration_and_other_details does not exist');
      console.log('Run the migration script to create the table:');
      console.log('node scripts/run-vendor-migration.js');
      return false;
    }
  } catch (err) {
    console.error('❌ Error checking table exists:', err.message);
    return false;
  }
}

// Check if required columns exist in the table
async function checkTableColumns() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'registration_and_other_details'
      ORDER BY ordinal_position;
    `);
    
    if (result.rows.length === 0) {
      console.error('❌ No columns found in registration_and_other_details table');
      return false;
    }
    
    // Define required columns with expected data types
    const requiredColumns = {
      'sr_no': 'integer',
      'business_type': 'character varying',
      'person_name': 'character varying',
      'business_email': 'character varying',
      'gender': 'character varying',
      'phone_number': 'character varying',
      'password': 'character varying'
    };
    
    // Check if all required columns exist with correct types
    const missingColumns = [];
    const wrongTypeColumns = [];
    
    for (const [columnName, expectedType] of Object.entries(requiredColumns)) {
      const column = result.rows.find(col => col.column_name === columnName);
      
      if (!column) {
        missingColumns.push(columnName);
      } else if (!column.data_type.startsWith(expectedType)) {
        wrongTypeColumns.push(`${columnName} (expected: ${expectedType}, actual: ${column.data_type})`);
      }
    }
    
    if (missingColumns.length > 0) {
      console.error(`❌ Missing columns: ${missingColumns.join(', ')}`);
    } else {
      console.log('✅ All required columns exist');
    }
    
    if (wrongTypeColumns.length > 0) {
      console.error(`❌ Columns with wrong data types: ${wrongTypeColumns.join(', ')}`);
    } else {
      console.log('✅ All columns have correct data types');
    }
    
    return missingColumns.length === 0 && wrongTypeColumns.length === 0;
  } catch (err) {
    console.error('❌ Error checking table columns:', err.message);
    return false;
  }
}

// Run all checks
async function runDatabaseChecks() {
  console.log('🔍 Starting database checks...');
  
  const connectionOk = await checkDbConnection();
  if (!connectionOk) {
    console.log('❌ Database connection failed, aborting further checks');
    return false;
  }
  
  const tableExists = await checkTableExists();
  if (!tableExists) {
    console.log('❌ Table does not exist, aborting further checks');
    return false;
  }
  
  const columnsOk = await checkTableColumns();
  
  if (connectionOk && tableExists && columnsOk) {
    console.log('✅ All database checks passed!');
    return true;
  } else {
    console.log('❌ Some database checks failed. Please fix the issues above.');
    return false;
  }
}

// Run the checks and exit with appropriate code
runDatabaseChecks()
  .then(success => {
    pool.end();
    if (!success) {
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Error running database checks:', error);
    pool.end();
    process.exit(1);
  }); 