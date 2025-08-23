const { query } = require('./db');

async function addPayoutColumns() {
  try {
    console.log('🚀 Adding vendor payout columns to booking table...');
    
    // Add columns one by one
    const columns = [
      "ALTER TABLE booking_all_details_of_user_to_vendor ADD COLUMN IF NOT EXISTS vendor_amount DECIMAL(10,2) DEFAULT 0.00",
      "ALTER TABLE booking_all_details_of_user_to_vendor ADD COLUMN IF NOT EXISTS company_commission DECIMAL(10,2) DEFAULT 0.00", 
      "ALTER TABLE booking_all_details_of_user_to_vendor ADD COLUMN IF NOT EXISTS payout_status VARCHAR(50) DEFAULT 'pending'",
      "ALTER TABLE booking_all_details_of_user_to_vendor ADD COLUMN IF NOT EXISTS payout_id VARCHAR(255)",
      "ALTER TABLE booking_all_details_of_user_to_vendor ADD COLUMN IF NOT EXISTS payout_reference VARCHAR(255)",
      "ALTER TABLE booking_all_details_of_user_to_vendor ADD COLUMN IF NOT EXISTS payout_date TIMESTAMP",
      "ALTER TABLE booking_all_details_of_user_to_vendor ADD COLUMN IF NOT EXISTS payout_failure_reason TEXT",
      "ALTER TABLE booking_all_details_of_user_to_vendor ADD COLUMN IF NOT EXISTS payout_retry_count INTEGER DEFAULT 0",
      "ALTER TABLE booking_all_details_of_user_to_vendor ADD COLUMN IF NOT EXISTS payout_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
      "ALTER TABLE booking_all_details_of_user_to_vendor ADD COLUMN IF NOT EXISTS payout_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    ];
    
    for (let i = 0; i < columns.length; i++) {
      try {
        console.log(`⏳ Adding column ${i + 1}/${columns.length}...`);
        await query(columns[i]);
        console.log(`✅ Column ${i + 1} added successfully`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Column ${i + 1} already exists, skipping`);
        } else {
          console.error(`❌ Error adding column ${i + 1}:`, error.message);
        }
      }
    }
    
    console.log('🎉 Payout columns addition completed!');
    
    // Verify the columns were added
    console.log('🔍 Verifying columns...');
    const verification = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'booking_all_details_of_user_to_vendor' 
      AND column_name IN ('vendor_amount', 'company_commission', 'payout_status', 'payout_id', 'payout_reference')
      ORDER BY column_name
    `);
    
    console.log('✅ Payout columns found:', verification.rows.map(row => row.column_name));
    
    if (verification.rows.length >= 5) {
      console.log('🎯 All vendor payout columns are present!');
      
      console.log('\n💰 ANSWER TO YOUR QUESTION:');
      console.log('='.repeat(50));
      console.log('📊 VENDOR EARNINGS COLUMNS in booking_all_details_of_user_to_vendor:');
      console.log('');
      console.log('✅ vendor_amount        - Stores vendor\'s 75% share after split');
      console.log('✅ company_commission   - Stores company\'s 25% commission');
      console.log('✅ payout_status        - Tracks: pending/processing/completed/failed');
      console.log('✅ payout_id           - Razorpay payout transaction ID');
      console.log('✅ payout_reference    - Internal payout reference');
      console.log('✅ payout_date         - When payout was processed');
      console.log('✅ payout_failure_reason - Reason if payout failed');
      console.log('✅ payout_retry_count  - Number of retry attempts');
      console.log('');
      console.log('🎯 MAIN COLUMN: vendor_amount - This contains the vendor earnings after 75%/25% split!');
      
    } else {
      console.log('⚠️  Some columns may be missing.');
    }
    
  } catch (error) {
    console.error('💥 Error:', error);
  }
}

addPayoutColumns();