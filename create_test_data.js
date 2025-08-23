/**
 * Create test data for vendor earnings and bank details
 */

const { query } = require('./db');

async function createTestData() {
  try {
    console.log('🧪 CREATING TEST DATA FOR VENDOR EARNINGS...\n');
    
    // 1. Add bank details for vendor 1
    console.log('1️⃣ Adding bank details for vendor 1...');
    await query(`
      UPDATE registration_and_other_details 
      SET 
        account_number = '1234567890',
        ifsc_code = 'HDFC0001234',
        account_holder_name = 'Test Vendor',
        bank_name = 'HDFC Bank',
        bank_details_verified = true,
        bank_details_created_at = CURRENT_TIMESTAMP,
        bank_details_updated_at = CURRENT_TIMESTAMP,
        razorpay_contact_id = 'contact_test123',
        razorpay_fund_account_id = 'fa_test123',
        razorpay_fund_account_status = 'active',
        razorpay_created_at = CURRENT_TIMESTAMP,
        razorpay_updated_at = CURRENT_TIMESTAMP
      WHERE sr_no = 1
    `);
    console.log('✅ Bank details added for vendor 1');
    
    // 2. Update existing completed booking with vendor_amount
    console.log('\n2️⃣ Updating completed booking with vendor amounts...');
    const completedBooking = await query(`
      SELECT booking_id, total_amount 
      FROM booking_all_details_of_user_to_vendor 
      WHERE booking_status = 'completed' 
      AND (vendor_id = 78 OR assigned_vendor_id = 78)
      LIMIT 1
    `);
    
    if (completedBooking.rows.length > 0) {
      const booking = completedBooking.rows[0];
      const totalAmount = parseFloat(booking.total_amount);
      const vendorAmount = totalAmount * 0.75; // 75% to vendor
      const companyCommission = totalAmount * 0.25; // 25% to company
      
      await query(`
        UPDATE booking_all_details_of_user_to_vendor 
        SET 
          vendor_amount = $1,
          company_commission = $2,
          payout_status = 'completed',
          payout_id = 'payout_test_' || booking_id,
          payout_reference = 'ref_test_' || booking_id,
          payout_created_at = CURRENT_TIMESTAMP - INTERVAL '2 days',
          payout_date = CURRENT_TIMESTAMP - INTERVAL '1 day'
        WHERE booking_id = $3
      `, [vendorAmount, companyCommission, booking.booking_id]);
      
      console.log(`✅ Updated booking ${booking.booking_id}: Total=${totalAmount}, Vendor=${vendorAmount}, Commission=${companyCommission}`);
    }
    
    // 3. Create some test bookings for vendor 1 with proper amounts
    console.log('\n3️⃣ Creating test earnings for vendor 1...');
    
    const testBookings = [
      { amount: 1000, status: 'completed', date: 'CURRENT_DATE' },
      { amount: 1500, status: 'completed', date: 'CURRENT_DATE - INTERVAL \'1 day\'' },
      { amount: 800, status: 'completed', date: 'CURRENT_DATE - INTERVAL \'5 days\'' },
      { amount: 2000, status: 'processing', date: 'CURRENT_DATE - INTERVAL \'2 days\'' }
    ];
    
    for (let i = 0; i < testBookings.length; i++) {
      const booking = testBookings[i];
      const vendorAmount = booking.amount * 0.75;
      const companyCommission = booking.amount * 0.25;
      
      // Get a specific booking ID for vendor 1
      const targetBooking = await query(`
        SELECT booking_id 
        FROM booking_all_details_of_user_to_vendor 
        WHERE (vendor_id = 1 OR assigned_vendor_id = 1)
        AND booking_id IS NOT NULL
        ORDER BY booking_id
        LIMIT 1 OFFSET $1
      `, [i]);
      
      if (targetBooking.rows.length > 0) {
        const bookingId = targetBooking.rows[0].booking_id;
        
        await query(`
          UPDATE booking_all_details_of_user_to_vendor 
          SET 
            total_amount = $1,
            vendor_amount = $2,
            company_commission = $3,
            booking_status = $4::character varying,
            payout_status = CASE WHEN $4 = 'completed' THEN 'completed'::character varying ELSE 'processing'::character varying END,
            payout_created_at = ${booking.date},
            payout_date = CASE WHEN $4 = 'completed' THEN ${booking.date} + INTERVAL '1 day' ELSE NULL END,
            payout_id = CASE WHEN $4 = 'completed' THEN ('payout_' || booking_id)::character varying ELSE NULL END,
            payout_reference = CASE WHEN $4 = 'completed' THEN ('ref_' || booking_id)::character varying ELSE NULL END
          WHERE booking_id = $5
        `, [booking.amount, vendorAmount, companyCommission, booking.status, bookingId]);
      }
      
      console.log(`✅ Updated test booking ${i + 1}: ${booking.status}, ₹${booking.amount} (vendor: ₹${vendorAmount})`);
    }
    
    // 4. Verify the test data
    console.log('\n4️⃣ Verifying test data...');
    const verification = await query(`
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN booking_status = 'completed' THEN 1 END) as completed_bookings,
        COALESCE(SUM(CASE WHEN booking_status = 'completed' AND vendor_amount IS NOT NULL THEN vendor_amount ELSE 0 END), 0) as total_earnings,
        COALESCE(SUM(CASE WHEN payout_status = 'completed' THEN vendor_amount ELSE 0 END), 0) as settled_amount,
        COALESCE(SUM(CASE WHEN DATE(payout_created_at) = CURRENT_DATE THEN vendor_amount ELSE 0 END), 0) as today_earnings
      FROM booking_all_details_of_user_to_vendor 
      WHERE vendor_id = 1 OR assigned_vendor_id = 1
    `);
    
    const stats = verification.rows[0];
    console.log(`   📊 Vendor 1 Statistics:`);
    console.log(`      Total bookings: ${stats.total_bookings}`);
    console.log(`      Completed bookings: ${stats.completed_bookings}`);
    console.log(`      Total earnings: ₹${stats.total_earnings}`);
    console.log(`      Settled amount: ₹${stats.settled_amount}`);
    console.log(`      Today's earnings: ₹${stats.today_earnings}`);
    
    // 5. Check bank details
    const bankCheck = await query(`
      SELECT account_number, ifsc_code, account_holder_name, razorpay_contact_id 
      FROM registration_and_other_details 
      WHERE sr_no = 1
    `);
    
    const bank = bankCheck.rows[0];
    console.log(`   🏦 Bank Details:`);
    console.log(`      Account: ${bank.account_number}`);
    console.log(`      IFSC: ${bank.ifsc_code}`);
    console.log(`      Holder: ${bank.account_holder_name}`);
    console.log(`      Razorpay: ${bank.razorpay_contact_id ? 'Configured' : 'Not configured'}`);
    
    console.log('\n🎉 TEST DATA CREATED SUCCESSFULLY!');
    console.log('Now the earnings APIs should return actual data instead of "No data yet".');
    
  } catch (error) {
    console.error('❌ Error creating test data:', error.message);
  }
  
  process.exit(0);
}

createTestData();