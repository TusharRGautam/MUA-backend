const { query, pool } = require('./db');

async function checkSalonBookings() {
  try {
    console.log('🔎 Checking salon vendor bookings...');
    
    // 1. First, identify all salon vendors
    console.log('\n📋 Step 1: Identifying salon vendors');
    const salonVendorsQuery = `
      SELECT sr_no, business_name, business_type, email
      FROM registration_and_other_details
      WHERE LOWER(business_type) = 'salon'
      OR LOWER(business_type) = 'parlor'
      OR LOWER(business_type) LIKE '%salon%'
    `;
    
    const salonVendors = await query(salonVendorsQuery);
    
    if (salonVendors.rows.length === 0) {
      console.log('❌ No salon vendors found in the database.');
      return;
    }
    
    console.log(`✅ Found ${salonVendors.rows.length} salon vendors:`);
    salonVendors.rows.forEach((vendor, i) => {
      console.log(`   ${i+1}. ID: ${vendor.sr_no}, Name: ${vendor.business_name}, Type: ${vendor.business_type}`);
    });
    
    // 2. Check bookings for each salon vendor
    console.log('\n📋 Step 2: Checking bookings for each salon vendor');
    
    for (const vendor of salonVendors.rows) {
      const vendorId = vendor.sr_no;
      console.log(`\n🔍 Checking bookings for salon vendor: ${vendor.business_name} (ID: ${vendorId})`);
      
      const bookingsQuery = `
        SELECT COUNT(*) AS booking_count
        FROM booking_all_details_of_user_to_vendor
        WHERE vendor_id = $1
      `;
      
      const bookingsResult = await query(bookingsQuery, [vendorId]);
      const bookingCount = parseInt(bookingsResult.rows[0].booking_count);
      
      console.log(`   Total bookings: ${bookingCount}`);
      
      if (bookingCount === 0) {
        console.log('   ℹ️ No bookings found for this vendor.');
      } else {
        // Get booking details
        const bookingDetailsQuery = `
          SELECT 
            booking_id,
            booking_date,
            booking_time,
            booking_status,
            user_name AS customer_name,
            total_amount
          FROM booking_all_details_of_user_to_vendor
          WHERE vendor_id = $1
          ORDER BY booking_date DESC, booking_time DESC
          LIMIT 5
        `;
        
        const bookingDetails = await query(bookingDetailsQuery, [vendorId]);
        
        console.log('   ✅ Recent bookings:');
        bookingDetails.rows.forEach((booking, i) => {
          console.log(`     ${i+1}. ID: ${booking.booking_id}, Date: ${booking.booking_date}, Status: ${booking.booking_status}, Customer: ${booking.customer_name}`);
        });
        
        // Check status distributions
        const statusQuery = `
          SELECT booking_status, COUNT(*) AS count
          FROM booking_all_details_of_user_to_vendor
          WHERE vendor_id = $1
          GROUP BY booking_status
        `;
        
        const statusResult = await query(statusQuery, [vendorId]);
        
        console.log('   📊 Booking status distribution:');
        statusResult.rows.forEach(status => {
          console.log(`     - ${status.booking_status}: ${status.count} bookings`);
        });
      }
    }
    
    // 3. Check if there are any booking data inconsistencies
    console.log('\n📋 Step 3: Checking for booking data inconsistencies');
    
    // Check for bookings with vendor_id that doesn't exist in registration_and_other_details
    const orphanedBookingsQuery = `
      SELECT b.vendor_id, COUNT(*) AS booking_count
      FROM booking_all_details_of_user_to_vendor b
      LEFT JOIN registration_and_other_details r ON b.vendor_id = r.sr_no
      WHERE r.sr_no IS NULL
      GROUP BY b.vendor_id
    `;
    
    const orphanedBookings = await query(orphanedBookingsQuery);
    
    if (orphanedBookings.rows.length === 0) {
      console.log('✅ No orphaned bookings found (all vendor_ids exist in registration_and_other_details).');
    } else {
      console.log(`❌ Found ${orphanedBookings.rows.length} vendor IDs with orphaned bookings:`);
      orphanedBookings.rows.forEach(orphan => {
        console.log(`   - Vendor ID ${orphan.vendor_id}: ${orphan.booking_count} bookings`);
      });
    }
    
    // Check for salon vendors with missing vendor_id in bookings
    const salonsWithoutBookingsQuery = `
      SELECT r.sr_no, r.business_name, r.business_type
      FROM registration_and_other_details r
      LEFT JOIN booking_all_details_of_user_to_vendor b ON r.sr_no = b.vendor_id
      WHERE (LOWER(r.business_type) = 'salon' OR LOWER(r.business_type) LIKE '%salon%')
      AND b.vendor_id IS NULL
    `;
    
    const salonsWithoutBookings = await query(salonsWithoutBookingsQuery);
    
    if (salonsWithoutBookings.rows.length === 0) {
      console.log('✅ All salon vendors have at least one booking record (even if it might be empty).');
    } else {
      console.log(`ℹ️ Found ${salonsWithoutBookings.rows.length} salon vendors without any booking records:`);
      salonsWithoutBookings.rows.forEach(salon => {
        console.log(`   - ${salon.business_name} (ID: ${salon.sr_no}, Type: ${salon.business_type})`);
      });
      console.log('   Note: This could be normal if these salons truly haven\'t received any bookings yet.');
    }
    
    console.log('\n✅ Salon booking diagnostic check completed!');
    
  } catch (error) {
    console.error('❌ Error checking salon bookings:', error);
  } finally {
    // Close pool connection
    pool.end();
  }
}

// Run the check
checkSalonBookings(); 