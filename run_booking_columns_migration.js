const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'mua_database',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function runBookingColumnsMigration() {
  let client;
  
  try {
    console.log('🚀 Starting booking columns migration...');
    
    // Connect to database
    client = await pool.connect();
    console.log('✅ Database connected successfully');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'migrations', 'add_booking_columns.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 Migration file loaded successfully');
    
    // Execute the migration
    console.log('⚡ Executing migration...');
    await client.query(migrationSQL);
    console.log('✅ Migration executed successfully');
    
    // Verify the columns were added
    console.log('🔍 Verifying migration results...');
    const verifyQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'booking_all_details_of_user_to_vendor'
      AND column_name IN ('booking_id', 'booking_date_month', 'booking_time_slot')
      ORDER BY column_name;
    `;
    
    const verifyResult = await client.query(verifyQuery);
    
    if (verifyResult.rows.length === 3) {
      console.log('✅ All three columns added successfully:');
      verifyResult.rows.forEach(row => {
        console.log(`   - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
      });
    } else {
      console.log('⚠️  Warning: Not all columns were found. Found columns:');
      verifyResult.rows.forEach(row => {
        console.log(`   - ${row.column_name}: ${row.data_type}`);
      });
    }
    
    // Check if table exists and show structure
    const tableCheckQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'booking_all_details_of_user_to_vendor'
      );
    `;
    
    const tableExists = await client.query(tableCheckQuery);
    
    if (tableExists.rows[0].exists) {
      console.log('✅ Table booking_all_details_of_user_to_vendor exists');
      
      // Show all columns in the table
      const columnsQuery = `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'booking_all_details_of_user_to_vendor'
        ORDER BY ordinal_position;
      `;
      
      const columnsResult = await client.query(columnsQuery);
      console.log('📋 Complete table structure:');
      columnsResult.rows.forEach(row => {
        console.log(`   - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
      });
    } else {
      console.log('❌ Table booking_all_details_of_user_to_vendor was not created');
    }
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Run the migration
if (require.main === module) {
  runBookingColumnsMigration()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = runBookingColumnsMigration; 