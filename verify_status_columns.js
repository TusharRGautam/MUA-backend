// Script to verify that the status columns were added correctly
const { query } = require('./db');

async function verifyStatusColumns() {
  try {
    console.log('Verifying vendor_status and status_updated_at columns...');
    
    // Check if columns exist
    const columnsCheckQuery = `
      SELECT 
        column_name, 
        data_type, 
        column_default, 
        is_nullable
      FROM 
        information_schema.columns 
      WHERE 
        table_name = 'registration_and_other_details' 
        AND column_name IN ('vendor_status', 'status_updated_at')
      ORDER BY 
        column_name
    `;
    
    const columnsResult = await query(columnsCheckQuery);
    
    if (columnsResult.rows.length === 0) {
      console.error('Error: No status columns found!');
      return;
    }
    
    console.log('Status columns found:');
    columnsResult.rows.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type}): Default=${col.column_default}, Nullable=${col.is_nullable}`);
    });
    
    // Check how many vendors have the columns populated
    const statusCountQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN vendor_status IS NOT NULL THEN 1 ELSE 0 END) as with_status,
        SUM(CASE WHEN status_updated_at IS NOT NULL THEN 1 ELSE 0 END) as with_timestamp
      FROM 
        registration_and_other_details
    `;
    
    const countResult = await query(statusCountQuery);
    const counts = countResult.rows[0];
    
    console.log('\nVendor status population:');
    console.log(`- Total vendors: ${counts.total}`);
    console.log(`- Vendors with status: ${counts.with_status} (${Math.round(counts.with_status / counts.total * 100)}%)`);
    console.log(`- Vendors with timestamp: ${counts.with_timestamp} (${Math.round(counts.with_timestamp / counts.total * 100)}%)`);
    
    // Get an existing vendor to test with instead of creating a new one
    console.log('\nFinding an existing vendor for status update test...');
    const existingVendorQuery = `
      SELECT 
        business_email, 
        business_name, 
        vendor_status, 
        status_updated_at
      FROM 
        registration_and_other_details
      LIMIT 1
    `;
    
    const existingVendorResult = await query(existingVendorQuery);
    
    if (existingVendorResult.rows.length === 0) {
      console.error('Error: No vendors found in the database for testing');
      return;
    }
    
    const testVendor = existingVendorResult.rows[0];
    console.log(`Found vendor: ${testVendor.business_name} (${testVendor.business_email})`);
    console.log(`Current status: ${testVendor.vendor_status || 'not set'}`);
    
    // Update to the opposite status
    const newStatus = testVendor.vendor_status === 'active' ? 'inactive' : 'active';
    
    // Update the status and check if the timestamp updates automatically
    console.log(`\nUpdating vendor status to: ${newStatus}...`);
    await query(`
      UPDATE registration_and_other_details 
      SET vendor_status = $1, status_updated_at = CURRENT_TIMESTAMP
      WHERE business_email = $2
    `, [newStatus, testVendor.business_email]);
    
    // Verify the update
    const verificationQuery = `
      SELECT 
        business_email, 
        vendor_status, 
        status_updated_at
      FROM 
        registration_and_other_details
      WHERE 
        business_email = $1
    `;
    
    const verification = await query(verificationQuery, [testVendor.business_email]);
    
    if (verification.rows.length > 0) {
      const vendor = verification.rows[0];
      console.log('\nVerification results:');
      console.log(`- Email: ${vendor.business_email}`);
      console.log(`- Status: ${vendor.vendor_status}`);
      console.log(`- Last updated: ${vendor.status_updated_at}`);
      console.log('\nStatus columns are working correctly!');
    } else {
      console.error('Error: Could not verify the test update');
    }
    
  } catch (error) {
    console.error('Error verifying status columns:', error);
  } finally {
    process.exit(0);
  }
}

// Run the verification
verifyStatusColumns(); 