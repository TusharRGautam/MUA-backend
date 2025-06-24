const { query } = require('./db');

async function checkRescheduleColumns() {
  try {
    console.log('🔍 Checking if reschedule columns exist in booking table...');
    
    // Check if reschedule columns exist
    const checkQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'booking_all_details_of_user_to_vendor' 
      AND column_name IN ('vendor_reschedule_date', 'vendor_reschedule_time')
      ORDER BY column_name;
    `;
    
    const result = await query(checkQuery);
    
    console.log('\n📊 Current reschedule columns in booking_all_details_of_user_to_vendor table:');
    if (result.rows.length === 0) {
      console.log('  ❌ No reschedule columns found');
      console.log('  📝 Need to create: vendor_reschedule_date, vendor_reschedule_time');
      return false;
    } else {
      result.rows.forEach(row => {
        console.log(`  ✓ ${row.column_name} (${row.data_type})`);
      });
      
      if (result.rows.length === 2) {
        console.log('\n✅ All reschedule columns exist!');
        return true;
      } else {
        console.log(`\n⚠️  Expected 2 reschedule columns, found ${result.rows.length}`);
        return false;
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking reschedule columns:', error);
    console.error('Error details:', error.message);
    return false;
  }
}

// Run the check
console.log('🚀 Starting reschedule columns check...');
checkRescheduleColumns()
  .then((exists) => {
    if (!exists) {
      console.log('\n💡 Run the reschedule migration to add the missing columns.');
    }
    process.exit(0);
  })
  .catch(() => process.exit(1)); 