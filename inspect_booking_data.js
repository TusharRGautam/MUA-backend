const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'muadatabase',
  password: 'tushar123',
  port: 5432,
});

async function inspectBookingData() {
  try {
    console.log('🔍 COMPREHENSIVE BOOKING DATA INSPECTION');
    console.log('=' .repeat(60));
    
    // 1. Check if table exists
    console.log('\n1️⃣ CHECKING TABLE EXISTENCE...');
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'booking_all_details_of_user_to_vendor'
      AND table_schema = 'public'
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log('❌ Table booking_all_details_of_user_to_vendor does not exist!');
      
      // Check for similar tables
      const similarTables = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name LIKE '%booking%' 
        AND table_schema = 'public'
      `);
      
      console.log('\n📋 Available booking-related tables:');
      similarTables.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
      return;
    }
    
    console.log('✅ Table exists!');
    
    // 2. Check table structure
    console.log('\n2️⃣ TABLE STRUCTURE...');
    const tableStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'booking_all_details_of_user_to_vendor' 
      ORDER BY ordinal_position
    `);
    
    console.log(`📋 Found ${tableStructure.rows.length} columns:`);
    tableStructure.rows.forEach(row => {
      console.log(`   - ${row.column_name} (${row.data_type})`);
    });
    
    // 3. Check total record count
    console.log('\n3️⃣ RECORD COUNT...');
    const countResult = await pool.query(`
      SELECT COUNT(*) as total_count FROM booking_all_details_of_user_to_vendor
    `);
    
    const totalCount = parseInt(countResult.rows[0].total_count);
    console.log(`📊 Total records: ${totalCount}`);
    
    if (totalCount === 0) {
      console.log('❌ No booking data found!');
      return;
    }
    
    // 4. Sample data (first 5 records)
    console.log('\n4️⃣ SAMPLE DATA (First 5 records)...');
    const sampleData = await pool.query(`
      SELECT 
        id,
        booking_id,
        user_name,
        vendor_id,
        vendor_name,
        booking_status,
        booking_date,
        booking_time,
        total_amount,
        created_at
      FROM booking_all_details_of_user_to_vendor 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log('📄 Sample records:');
    sampleData.rows.forEach((record, index) => {
      console.log(`\n   Record ${index + 1}:`);
      console.log(`     ID: ${record.id}`);
      console.log(`     Booking ID: ${record.booking_id || 'NULL'}`);
      console.log(`     Customer: ${record.user_name || 'NULL'}`);
      console.log(`     Vendor ID: ${record.vendor_id || 'NULL'}`);
      console.log(`     Vendor Name: ${record.vendor_name || 'NULL'}`);
      console.log(`     Status: ${record.booking_status || 'NULL'}`);
      console.log(`     Date: ${record.booking_date || 'NULL'}`);
      console.log(`     Time: ${record.booking_time || 'NULL'}`);
      console.log(`     Amount: ${record.total_amount || 'NULL'}`);
      console.log(`     Created: ${record.created_at || 'NULL'}`);
    });
    
    // 5. Check booking status distribution
    console.log('\n5️⃣ BOOKING STATUS DISTRIBUTION...');
    const statusDistribution = await pool.query(`
      SELECT 
        COALESCE(booking_status, 'NULL') as status,
        COUNT(*) as count
      FROM booking_all_details_of_user_to_vendor
      GROUP BY booking_status
      ORDER BY count DESC
    `);
    
    console.log('📊 Status distribution:');
    statusDistribution.rows.forEach(row => {
      console.log(`   - ${row.status}: ${row.count} bookings`);
    });
    
    // 6. Check vendor distribution
    console.log('\n6️⃣ VENDOR DISTRIBUTION...');
    const vendorDistribution = await pool.query(`
      SELECT 
        COALESCE(vendor_id::text, 'NULL') as vendor_id,
        COALESCE(vendor_name, 'NULL') as vendor_name,
        COUNT(*) as booking_count
      FROM booking_all_details_of_user_to_vendor
      GROUP BY vendor_id, vendor_name
      ORDER BY booking_count DESC
      LIMIT 10
    `);
    
    console.log('👥 Top vendors by booking count:');
    vendorDistribution.rows.forEach(row => {
      console.log(`   - Vendor ID ${row.vendor_id} (${row.vendor_name}): ${row.booking_count} bookings`);
    });
    
    // 7. Check recent activity
    console.log('\n7️⃣ RECENT ACTIVITY (Last 7 days)...');
    const recentActivity = await pool.query(`
      SELECT 
        DATE(created_at) as activity_date,
        COUNT(*) as bookings_count
      FROM booking_all_details_of_user_to_vendor
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY activity_date DESC
    `);
    
    if (recentActivity.rows.length > 0) {
      console.log('📅 Daily booking activity:');
      recentActivity.rows.forEach(row => {
        console.log(`   - ${row.activity_date}: ${row.bookings_count} bookings`);
      });
    } else {
      console.log('❌ No recent booking activity in the last 7 days');
    }
    
    // 8. Check for potential data quality issues
    console.log('\n8️⃣ DATA QUALITY CHECKS...');
    
    // Check for missing critical fields
    const dataQuality = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(booking_id) as has_booking_id,
        COUNT(user_name) as has_customer_name,
        COUNT(vendor_id) as has_vendor_id,
        COUNT(booking_status) as has_status,
        COUNT(booking_date) as has_date,
        COUNT(total_amount) as has_amount
      FROM booking_all_details_of_user_to_vendor
    `);
    
    const dq = dataQuality.rows[0];
    console.log('🔍 Data completeness:');
    console.log(`   - Total records: ${dq.total}`);
    console.log(`   - With booking_id: ${dq.has_booking_id} (${Math.round(dq.has_booking_id/dq.total*100)}%)`);
    console.log(`   - With customer name: ${dq.has_customer_name} (${Math.round(dq.has_customer_name/dq.total*100)}%)`);
    console.log(`   - With vendor_id: ${dq.has_vendor_id} (${Math.round(dq.has_vendor_id/dq.total*100)}%)`);
    console.log(`   - With status: ${dq.has_status} (${Math.round(dq.has_status/dq.total*100)}%)`);
    console.log(`   - With date: ${dq.has_date} (${Math.round(dq.has_date/dq.total*100)}%)`);
    console.log(`   - With amount: ${dq.has_amount} (${Math.round(dq.has_amount/dq.total*100)}%)`);
    
    // 9. Check specific vendor bookings (if vendor_id provided)
    const testVendorId = process.argv[2];
    if (testVendorId) {
      console.log(`\n9️⃣ SPECIFIC VENDOR ANALYSIS (Vendor ID: ${testVendorId})...`);
      
      const vendorBookings = await pool.query(`
        SELECT 
          id,
          booking_id,
          user_name as customer_name,
          booking_status,
          booking_date,
          booking_time,
          total_amount,
          created_at
        FROM booking_all_details_of_user_to_vendor
        WHERE vendor_id = $1 OR assigned_vendor_id = $1
        ORDER BY created_at DESC
        LIMIT 10
      `, [testVendorId]);
      
      console.log(`📋 Found ${vendorBookings.rows.length} bookings for vendor ${testVendorId}:`);
      vendorBookings.rows.forEach((booking, index) => {
        console.log(`\n   Booking ${index + 1}:`);
        console.log(`     ID: ${booking.id}`);
        console.log(`     Booking ID: ${booking.booking_id}`);
        console.log(`     Customer: ${booking.customer_name}`);
        console.log(`     Status: ${booking.booking_status}`);
        console.log(`     Date: ${booking.booking_date}`);
        console.log(`     Time: ${booking.booking_time}`);
        console.log(`     Amount: ${booking.total_amount}`);
        console.log(`     Created: ${booking.created_at}`);
      });
      
      // Check if vendor exists in registration table
      const vendorCheck = await pool.query(`
        SELECT sr_no, person_name, business_name, business_type, email
        FROM registration_and_other_details
        WHERE sr_no = $1
      `, [testVendorId]);
      
      if (vendorCheck.rows.length > 0) {
        const vendor = vendorCheck.rows[0];
        console.log(`\n👤 Vendor Details:`);
        console.log(`     ID: ${vendor.sr_no}`);
        console.log(`     Name: ${vendor.person_name}`);
        console.log(`     Business: ${vendor.business_name}`);
        console.log(`     Type: ${vendor.business_type}`);
        console.log(`     Email: ${vendor.email}`);
      } else {
        console.log(`❌ Vendor ID ${testVendorId} not found in registration_and_other_details table`);
      }
    }
    
    console.log('\n✅ INSPECTION COMPLETE!');
    console.log('\n💡 RECOMMENDATIONS:');
    
    if (totalCount === 0) {
      console.log('   - No booking data found. Check if bookings are being created properly.');
    } else {
      console.log('   - Data exists. Check API endpoints and frontend integration.');
    }
    
    console.log('   - Run this script with a vendor ID: node inspect_booking_data.js <vendor_id>');
    console.log('   - Check VendorBookingDashboard.tsx for proper API endpoint usage.');
    
  } catch (error) {
    console.error('❌ Error during inspection:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  inspectBookingData();
}

module.exports = { inspectBookingData }; 