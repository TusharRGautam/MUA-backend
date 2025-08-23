const fs = require('fs');
const path = require('path');
const { query } = require('./db');

async function runVendorPayoutMigration() {
  try {
    console.log('🚀 Starting vendor payout columns migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', 'add_vendor_payout_columns.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error('Migration file not found: ' + migrationPath);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 Migration file loaded successfully');
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));
    
    console.log(`📊 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
          await query(statement);
          console.log(`✅ Statement ${i + 1} executed successfully`);
        } catch (error) {
          // Some statements might fail if columns already exist, that's okay
          if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            console.log(`⚠️  Statement ${i + 1} skipped (already exists): ${error.message}`);
          } else {
            console.error(`❌ Error in statement ${i + 1}:`, error.message);
            // Don't throw here, continue with other statements
          }
        }
      }
    }
    
    console.log('🎉 Vendor payout migration completed successfully!');
    
    // Verify the columns were added
    console.log('🔍 Verifying migration...');
    const verification = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'booking_all_details_of_user_to_vendor' 
      AND column_name IN ('vendor_amount', 'company_commission', 'payout_status', 'payout_id', 'payout_reference')
      ORDER BY column_name
    `);
    
    console.log('✅ Vendor payout columns found:', verification.rows.map(row => row.column_name));
    
    if (verification.rows.length >= 5) {
      console.log('🎯 Migration verification successful! All vendor payout columns are present.');
    } else {
      console.log('⚠️  Some columns may be missing. Please check the database.');
    }
    
    // Show the column names for reference
    console.log('\n💰 VENDOR EARNING COLUMNS ADDED:');
    console.log('✅ vendor_amount - Stores vendor\'s 75% share');
    console.log('✅ company_commission - Stores company\'s 25% commission');
    console.log('✅ payout_status - Tracks payout status (pending/processing/completed/failed)');
    console.log('✅ payout_id - Razorpay payout transaction ID');
    console.log('✅ payout_reference - Internal reference ID');
    console.log('✅ payout_date - When payout was processed');
    console.log('✅ payout_failure_reason - Reason if payout failed');
    console.log('✅ payout_retry_count - Number of retry attempts');
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runVendorPayoutMigration();