const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const runSoloVendorBookingMigration = async () => {
  let connection;
  
  try {
    console.log('🚀 Starting solo vendor booking migration...');
    
    // Database connection configuration
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'mua_database',
      port: process.env.DB_PORT || 3306
    };

    console.log('📡 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connection established');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'migrations', 'add_solo_vendor_booking_columns.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 Migration SQL loaded successfully');

    // Execute the migration
    console.log('⚙️ Executing solo vendor booking migration...');
    await connection.execute(migrationSQL);
    console.log('✅ Migration executed successfully');

    // Verify the new columns exist
    console.log('🔍 Verifying new columns...');
    
    const [serviceGenderColumn] = await connection.execute(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'booking_all_details_of_user_to_vendor' 
      AND column_name = 'service_gender'
    `);

    const [vendorTypeColumn] = await connection.execute(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'booking_all_details_of_user_to_vendor' 
      AND column_name = 'vendor_type'
    `);

    if (serviceGenderColumn.length > 0) {
      console.log('✅ service_gender column created successfully:', serviceGenderColumn[0]);
    } else {
      console.log('❌ service_gender column not found');
    }

    if (vendorTypeColumn.length > 0) {
      console.log('✅ vendor_type column created successfully:', vendorTypeColumn[0]);
    } else {
      console.log('❌ vendor_type column not found');
    }

    // Verify indexes
    console.log('🔍 Verifying indexes...');
    
    const [indexes] = await connection.execute(`
      SELECT index_name, column_name 
      FROM information_schema.statistics 
      WHERE table_name = 'booking_all_details_of_user_to_vendor' 
      AND index_name IN (
        'idx_booking_service_gender', 
        'idx_booking_vendor_type', 
        'idx_booking_solo_vendor_query'
      )
      ORDER BY index_name, seq_in_index
    `);

    if (indexes.length > 0) {
      console.log('✅ Solo vendor booking indexes created:');
      indexes.forEach(idx => {
        console.log(`   - ${idx.index_name} on ${idx.column_name}`);
      });
    } else {
      console.log('⚠️ No solo vendor booking indexes found');
    }

    // Check current booking table structure
    console.log('📋 Current booking table structure:');
    const [columns] = await connection.execute(`
      SELECT column_name, data_type, is_nullable, column_default, column_comment 
      FROM information_schema.columns 
      WHERE table_name = 'booking_all_details_of_user_to_vendor' 
      ORDER BY ordinal_position
    `);

    columns.forEach(col => {
      if (col.column_name.includes('service_') || col.column_name.includes('vendor_')) {
        console.log(`   - ${col.column_name} (${col.data_type}): ${col.column_comment || 'No comment'}`);
      }
    });

    console.log('🎉 Solo vendor booking migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('📡 Database connection closed');
    }
  }
};

// Run the migration if this script is executed directly
if (require.main === module) {
  runSoloVendorBookingMigration()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { runSoloVendorBookingMigration }; 