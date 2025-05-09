const { query, pool } = require('./db');

async function validateVendorIsolation() {
  try {
    console.log('Validating vendor data isolation...');
    
    // Check how many vendors we have in the system
    const vendorsResult = await query(`
      SELECT sr_no, business_email 
      FROM registration_and_other_details 
      ORDER BY sr_no
      LIMIT 10
    `);
    
    if (vendorsResult.rows.length === 0) {
      console.log('No vendors found in the system.');
      return;
    }
    
    console.log(`Found ${vendorsResult.rows.length} vendors in the system.`);
    console.log('Sample vendors:');
    vendorsResult.rows.slice(0, 3).forEach(vendor => {
      console.log(`  ID: ${vendor.sr_no}, Email: ${vendor.business_email}`);
    });
    
    // Check packages per vendor
    console.log('\nPackages per vendor:');
    for (const vendor of vendorsResult.rows.slice(0, 3)) {
      const packagesResult = await query(`
        SELECT COUNT(*) as package_count
        FROM vendor_packages_services
        WHERE vendor_id = $1
      `, [vendor.sr_no]);
      
      console.log(`  Vendor ID ${vendor.sr_no}: ${packagesResult.rows[0].package_count} packages`);
      
      // Check services per vendor's packages
      const servicesResult = await query(`
        SELECT COUNT(*) as service_count
        FROM package_services ps
        JOIN vendor_packages_services vps ON ps.package_id = vps.id
        WHERE vps.vendor_id = $1
      `, [vendor.sr_no]);
      
      console.log(`  Vendor ID ${vendor.sr_no}: ${servicesResult.rows[0].service_count} package services`);
      
      // Verify vendor_id in package_services
      const isolationResult = await query(`
        SELECT COUNT(*) as matching_count
        FROM package_services ps
        WHERE ps.vendor_id = $1
      `, [vendor.sr_no]);
      
      console.log(`  Vendor ID ${vendor.sr_no}: ${isolationResult.rows[0].matching_count} services with proper vendor_id`);
      
      // Verify isolation between vendors (no data leakage)
      if (parseInt(servicesResult.rows[0].service_count) !== parseInt(isolationResult.rows[0].matching_count)) {
        console.error(`  WARNING: Vendor ID ${vendor.sr_no} has potential data isolation issues!`);
        
        // Get details of mismatched records
        const mismatchResult = await query(`
          SELECT ps.id, ps.package_id, ps.name, ps.vendor_id, vps.vendor_id as package_vendor_id
          FROM package_services ps
          JOIN vendor_packages_services vps ON ps.package_id = vps.id
          WHERE vps.vendor_id = $1 AND (ps.vendor_id IS NULL OR ps.vendor_id != $1)
        `, [vendor.sr_no]);
        
        console.log(`  Found ${mismatchResult.rows.length} mismatched records for vendor ${vendor.sr_no}`);
        
        // Fix mismatched records
        if (mismatchResult.rows.length > 0) {
          console.log('  Fixing mismatched records...');
          await query(`
            UPDATE package_services ps
            SET vendor_id = vps.vendor_id
            FROM vendor_packages_services vps
            WHERE ps.package_id = vps.id AND vps.vendor_id = $1 AND (ps.vendor_id IS NULL OR ps.vendor_id != $1)
          `, [vendor.sr_no]);
          
          console.log('  Records fixed successfully');
        }
      } else {
        console.log(`  Vendor ID ${vendor.sr_no}: Data isolation verified ✓`);
      }
    }
    
    // Verify all package services have vendor_id set
    const missingVendorIdCheck = await query(`
      SELECT COUNT(*) as missing_count
      FROM package_services
      WHERE vendor_id IS NULL
    `);
    
    if (parseInt(missingVendorIdCheck.rows[0].missing_count) > 0) {
      console.log(`\nWARNING: ${missingVendorIdCheck.rows[0].missing_count} package services have NULL vendor_id`);
      
      // Fix missing vendor_id values
      console.log('Fixing missing vendor_id values...');
      await query(`
        UPDATE package_services ps
        SET vendor_id = vps.vendor_id
        FROM vendor_packages_services vps
        WHERE ps.package_id = vps.id AND ps.vendor_id IS NULL
      `);
      
      console.log('Missing vendor_id values fixed');
    } else {
      console.log('\nAll package services have vendor_id properly set ✓');
    }
    
    console.log('\nVendor isolation validation completed!');
    
  } catch (error) {
    console.error('Error validating vendor isolation:', error);
  } finally {
    // Close pool connection
    pool.end();
  }
}

// Run the validation
validateVendorIsolation(); 