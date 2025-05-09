const { query, pool } = require('./db');

async function addVendorIdToPackageServices() {
  try {
    console.log('Adding vendor isolation to package_services table...');
    
    // Check if vendor_id column already exists
    const columnCheck = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'package_services' 
      AND column_name = 'vendor_id'
    `);
    
    if (columnCheck.rows.length > 0) {
      console.log('vendor_id column already exists in package_services table');
    } else {
      console.log('Adding vendor_id column to package_services table...');
      
      // Begin transaction
      await query('BEGIN');
      
      try {
        // Add vendor_id column
        await query(`
          ALTER TABLE package_services 
          ADD COLUMN vendor_id INTEGER
        `);
        
        // Create index for better performance
        await query(`
          CREATE INDEX idx_package_services_vendor_id ON package_services(vendor_id)
        `);
        
        // Update existing records by joining with vendor_packages_services
        await query(`
          UPDATE package_services ps
          SET vendor_id = vps.vendor_id
          FROM vendor_packages_services vps
          WHERE ps.package_id = vps.id
        `);
        
        // Add foreign key constraint
        await query(`
          ALTER TABLE package_services
          ADD CONSTRAINT fk_package_services_vendor
          FOREIGN KEY (vendor_id) 
          REFERENCES registration_and_other_details(sr_no)
          ON DELETE CASCADE
        `);
        
        // Commit transaction
        await query('COMMIT');
        
        console.log('Successfully added vendor_id column and updated existing records');
      } catch (error) {
        // Rollback on error
        await query('ROLLBACK');
        throw error;
      }
    }
    
    // Verify the update
    console.log('\nVerifying package_services table structure:');
    const tableInfo = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'package_services'
      ORDER BY ordinal_position
    `);
    
    console.log('package_services columns:');
    tableInfo.rows.forEach(col => {
      console.log(`  ${col.column_name} (${col.data_type})`);
    });
    
    // Check if data was properly updated
    const dataCheck = await query(`
      SELECT COUNT(*) as total, COUNT(vendor_id) as with_vendor
      FROM package_services
    `);
    
    console.log('\nData verification:');
    console.log(`  Total records: ${dataCheck.rows[0].total}`);
    console.log(`  Records with vendor_id: ${dataCheck.rows[0].with_vendor}`);
    
    console.log('\nVendor isolation fix completed successfully!');
    
  } catch (error) {
    console.error('Error implementing vendor isolation:', error);
  } finally {
    // Close pool connection
    pool.end();
  }
}

// Run the function
addVendorIdToPackageServices(); 