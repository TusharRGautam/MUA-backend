/**
 * Check database structure and sample data
 */

const { query } = require('./db');

async function checkDatabase() {
  try {
    console.log('🗄️ CHECKING DATABASE STRUCTURE AND SAMPLE DATA...\n');
    
    console.log('1️⃣ Registration table structure (vendor bank details):');
    const regSample = await query(`
      SELECT sr_no, person_name, business_name, account_number, ifsc_code, 
             account_holder_name, razorpay_contact_id, razorpay_fund_account_id,
             bank_details_verified
      FROM registration_and_other_details 
      WHERE sr_no IN (1, 2, 3, 4, 5)
      ORDER BY sr_no
      LIMIT 5
    `);
    
    if (regSample.rows.length > 0) {
      regSample.rows.forEach((row) => {
        console.log(`   Vendor ${row.sr_no}: ${row.business_name || row.person_name}`);
        console.log(`      Bank Account: ${row.account_number ? 'Yes' : 'No'}`);
        console.log(`      IFSC: ${row.ifsc_code ? 'Yes' : 'No'}`);
        console.log(`      Razorpay Setup: ${row.razorpay_contact_id ? 'Yes' : 'No'}`);
      });
    } else {
      console.log('   ❌ No vendor records found');
    }
    
    console.log('\n2️⃣ Booking table structure (vendor earnings):');
    const bookingSample = await query(`
      SELECT booking_id, assigned_vendor_id, vendor_id, user_name, 
             total_amount, vendor_amount, company_commission, 
             booking_status, payout_status, payout_created_at
      FROM booking_all_details_of_user_to_vendor 
      WHERE assigned_vendor_id IS NOT NULL OR vendor_id IS NOT NULL
      ORDER BY booking_id DESC 
      LIMIT 5
    `);
    
    if (bookingSample.rows.length > 0) {
      bookingSample.rows.forEach((row) => {
        console.log(`   Booking ${row.booking_id}: Vendor ${row.assigned_vendor_id || row.vendor_id}`);
        console.log(`      Customer: ${row.user_name}`);
        console.log(`      Total: ${row.total_amount}, Vendor Share: ${row.vendor_amount}`);
        console.log(`      Status: ${row.booking_status}, Payout: ${row.payout_status}`);
      });
    } else {
      console.log('   ❌ No booking records found');
    }
    
    console.log('\n3️⃣ Key columns verification:');
    const columns = await query(`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns 
      WHERE table_name IN ('registration_and_other_details', 'booking_all_details_of_user_to_vendor')
      AND column_name IN ('sr_no', 'vendor_id', 'assigned_vendor_id', 'vendor_amount', 'payout_status')
      ORDER BY table_name, column_name
    `);
    
    columns.rows.forEach(col => {
      console.log(`   ${col.table_name}.${col.column_name} (${col.data_type})`);
    });
    
    console.log('\n4️⃣ Testing sample query for vendor 1:');
    const testVendor = await query(`
      SELECT 
        COUNT(*) as total_bookings,
        COALESCE(SUM(CASE WHEN booking_status = 'completed' AND vendor_amount IS NOT NULL THEN vendor_amount ELSE 0 END), 0) as total_earnings,
        COALESCE(SUM(CASE WHEN payout_status = 'completed' THEN vendor_amount ELSE 0 END), 0) as settled_amount
      FROM booking_all_details_of_user_to_vendor 
      WHERE vendor_id = 1 OR assigned_vendor_id = 1
    `);
    
    console.log(`   Total bookings for vendor 1: ${testVendor.rows[0].total_bookings}`);
    console.log(`   Total earnings: ${testVendor.rows[0].total_earnings}`);
    console.log(`   Settled amount: ${testVendor.rows[0].settled_amount}`);
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  }
  
  process.exit(0);
}

checkDatabase();