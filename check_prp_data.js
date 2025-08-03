// Use the same database configuration as the main app
require('dotenv').config();
const { query } = require('./src/config/database');

async function checkPrpData() {
  try {
    console.log('=== CHECKING PRP VENDOR DATA ===');
    
    // Check registration_and_other_details table structure first
    console.log('\n1. Checking registration_and_other_details table structure...');
    const regStructure = await query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'registration_and_other_details' 
      ORDER BY ordinal_position
    `);
    console.log('registration_and_other_details columns:');
    regStructure.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Check vendor_staff table structure
    console.log('\n2. Checking vendor_staff table structure...');
    const staffStructure = await query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'vendor_staff' 
      ORDER BY ordinal_position
    `);
    console.log('vendor_staff columns:');
    staffStructure.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Check all business_type values in registration_and_other_details
    console.log('\n3. Checking all business_type values...');
    const businessTypes = await query(`
      SELECT business_type, COUNT(*) as count 
      FROM registration_and_other_details 
      GROUP BY business_type 
      ORDER BY count DESC
    `);
    console.log('business_type distribution:');
    businessTypes.rows.forEach(row => {
      console.log(`- ${row.business_type}: ${row.count} records`);
    });
    
    // Check for PRP vendors specifically
    console.log('\n4. Checking for PRP vendors...');
    const prpVendors = await query(`
      SELECT sr_no, business_email, person_name, business_type, business_name, 
             vendor_status, verification_status
      FROM registration_and_other_details 
      WHERE business_type = 'prp'
    `);
    console.log(`Found ${prpVendors.rows.length} PRP vendors:`);
    prpVendors.rows.forEach(vendor => {
      console.log(`- ID: ${vendor.sr_no}, Name: ${vendor.person_name}, Business: ${vendor.business_name}, Status: ${vendor.vendor_status}, Verification: ${vendor.verification_status}`);
    });
    
    // Check for any vendors with 'prp' in business_type (case insensitive)
    console.log('\n5. Checking for vendors with "prp" in business_type (case insensitive)...');
    const prpLikeVendors = await query(`
      SELECT sr_no, business_email, person_name, business_type, business_name, 
             vendor_status, verification_status
      FROM registration_and_other_details 
      WHERE LOWER(business_type) LIKE '%prp%'
    `);
    console.log(`Found ${prpLikeVendors.rows.length} vendors with 'prp' in business_type:`);
    prpLikeVendors.rows.forEach(vendor => {
      console.log(`- ID: ${vendor.sr_no}, Name: ${vendor.person_name}, Business Type: ${vendor.business_type}, Status: ${vendor.vendor_status}`);
    });
    
    // Check vendor_staff table for any data
    console.log('\n6. Checking vendor_staff table...');
    const allStaff = await query('SELECT COUNT(*) as total_staff FROM vendor_staff');
    console.log(`Total staff records: ${allStaff.rows[0].total_staff}`);
    
    if (allStaff.rows[0].total_staff > 0) {
      // Get sample staff data
      const sampleStaff = await query(`
        SELECT vs.id, vs.vendor_id, vs.name, vs.position, vs.active,
               rad.person_name as vendor_name, rad.business_type
        FROM vendor_staff vs
        LEFT JOIN registration_and_other_details rad ON vs.vendor_id = rad.sr_no
        LIMIT 10
      `);
      console.log('Sample staff data:');
      sampleStaff.rows.forEach(staff => {
        console.log(`- Staff: ${staff.name} (${staff.position}) for Vendor ID: ${staff.vendor_id} (${staff.vendor_name}), Business Type: ${staff.business_type}, Active: ${staff.active}`);
      });
      
      // Check if any staff belongs to PRP vendors
      const prpStaff = await query(`
        SELECT vs.id, vs.vendor_id, vs.name, vs.position, vs.active,
               rad.person_name as vendor_name, rad.business_type
        FROM vendor_staff vs
        LEFT JOIN registration_and_other_details rad ON vs.vendor_id = rad.sr_no
        WHERE rad.business_type = 'prp'
      `);
      console.log(`\nStaff for PRP vendors: ${prpStaff.rows.length}`);
      prpStaff.rows.forEach(staff => {
        console.log(`- Staff: ${staff.name} (${staff.position}) for PRP Vendor: ${staff.vendor_name}`);
      });
    }
    
    // Test our API query directly
    console.log('\n7. Testing API query directly...');
    const apiQuery = `
      SELECT sr_no, business_email, person_name, business_type, business_name, phone_number, 
             profile_picture, business_address, business_description, selected_category, 
             vendor_status, verification_status
      FROM registration_and_other_details 
      WHERE business_type = $1 AND vendor_status = $2 AND verification_status = ANY($3)
      ORDER BY sr_no
    `;
    const apiResult = await query(apiQuery, ['prp', 'active', ['verified', 'approved']]);
    console.log(`API query result: ${apiResult.rows.length} active/verified PRP vendors`);
  } catch (error) {
    console.error('Error:', error);
  }
}

checkPrpData();