const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Database configuration (matching other working scripts)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'muadatabase',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'tushar123',
};

async function runVendorDetailsMigration() {
  const client = new Client(dbConfig);
  
  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', 'add_vendor_details_columns.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📝 Running vendor details migration...');
    
    // Execute the migration
    await client.query(migrationSQL);
    
    console.log('✅ Vendor details migration completed successfully!');
    
    // Verify the new columns exist
    const verifyQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'booking_all_details_of_user_to_vendor' 
      AND column_name IN ('vendor_name', 'vendor_phone_number', 'vendor_email', 'vendor_address')
      ORDER BY column_name;
    `;
    
    const result = await client.query(verifyQuery);
    
    console.log('\n📊 Verified vendor columns in booking_all_details_of_user_to_vendor table:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.column_name} (${row.data_type})`);
    });
    
    if (result.rows.length === 4) {
      console.log('\n🎉 All vendor detail columns are now available!');
    } else {
      console.log(`\n⚠️  Expected 4 vendor columns, found ${result.rows.length}`);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  runVendorDetailsMigration()
    .then(() => {
      console.log('\n✅ Vendor details migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { runVendorDetailsMigration }; 