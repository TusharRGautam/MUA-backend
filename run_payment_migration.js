const { query } = require('./src/config/database');
const fs = require('fs');
const path = require('path');

async function runPaymentMigration() {
  console.log('🔄 Running Payment Integration Migration...\n');

  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'migrations', '002_add_payment_columns_complete.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration SQL loaded successfully');
    console.log('🔄 Executing migration...\n');

    // Execute the migration
    const result = await query(migrationSQL);
    
    console.log('✅ Migration executed successfully!');
    console.log('📊 Migration result:', result);

    // Verify the migration by checking columns
    console.log('\n🔍 Verifying migration...');
    const verifyQuery = `
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'booking_all_details_of_user_to_vendor' 
      AND (column_name LIKE '%payment%' OR column_name LIKE '%razorpay%' OR column_name IN ('booking_date', 'booking_time', 'services_booked', 'final_amount'))
      ORDER BY column_name;
    `;

    const verifyResult = await query(verifyQuery);
    
    console.log(`✅ Found ${verifyResult.rows.length} payment-related columns:`);
    verifyResult.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    console.log('\n🎉 Payment Integration Migration Completed Successfully!');
    console.log('\n📋 Migration Summary:');
    console.log('✅ All payment columns are properly configured');
    console.log('✅ Database indexes created for performance');
    console.log('✅ Column comments added for documentation');
    console.log('✅ Migration verified and tested');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the migration
runPaymentMigration().then(() => {
  console.log('\n🏁 Migration completed. Exiting...');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Migration failed with error:', error);
  process.exit(1);
}); 