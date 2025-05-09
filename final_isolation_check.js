const { query, pool } = require('./db');

async function testFinalIsolation() {
  try {
    console.log('Performing final vendor data isolation check...');
    
    // Get all vendors
    const vendorsResult = await query(`
      SELECT sr_no, business_email 
      FROM registration_and_other_details 
      ORDER BY sr_no
      LIMIT 5
    `);
    
    if (vendorsResult.rows.length === 0) {
      console.log('No vendors found in the system.');
      return;
    }
    
    console.log(`Found ${vendorsResult.rows.length} vendors to check.`);
    
    // For each vendor, verify data isolation
    for (const vendor of vendorsResult.rows) {
      console.log(`\nChecking Vendor ${vendor.sr_no} (${vendor.business_email}):`);
      
      // Get packages for this vendor
      const packagesResult = await query(`
        SELECT id, name 
        FROM vendor_packages_services 
        WHERE vendor_id = $1
      `, [vendor.sr_no]);
      
      console.log(`  Packages: ${packagesResult.rows.length}`);
      
      if (packagesResult.rows.length > 0) {
        // Check package services
        for (const pkg of packagesResult.rows) {
          // Get services with mismatched vendor_id
          const mismatchResult = await query(`
            SELECT COUNT(*) AS mismatch_count
            FROM package_services 
            WHERE package_id = $1 AND (vendor_id IS NULL OR vendor_id != $2)
          `, [pkg.id, vendor.sr_no]);
          
          const mismatchCount = parseInt(mismatchResult.rows[0].mismatch_count);
          
          if (mismatchCount > 0) {
            console.log(`  ❌ Package ${pkg.id} (${pkg.name}) has ${mismatchCount} services with incorrect vendor_id`);
            
            // Fix the mismatches
            await query(`
              UPDATE package_services
              SET vendor_id = $1
              WHERE package_id = $2 AND (vendor_id IS NULL OR vendor_id != $1)
            `, [vendor.sr_no, pkg.id]);
            
            console.log(`    ✓ Fixed ${mismatchCount} services for Package ${pkg.id}`);
          } else {
            console.log(`  ✓ Package ${pkg.id} (${pkg.name}) has all services properly isolated`);
          }
        }
      }
      
      // Verify no package services from other vendors
      const crossVendorResult = await query(`
        SELECT COUNT(*) AS crossover_count
        FROM package_services ps
        JOIN vendor_packages_services vps ON ps.package_id = vps.id
        WHERE vps.vendor_id = $1 AND ps.vendor_id != $1
      `, [vendor.sr_no]);
      
      const crossoverCount = parseInt(crossVendorResult.rows[0].crossover_count);
      
      if (crossoverCount > 0) {
        console.log(`  ❌ Found ${crossoverCount} package services with mismatched vendor_id`);
        
        // Fix the crossovers
        await query(`
          UPDATE package_services ps
          SET vendor_id = vps.vendor_id
          FROM vendor_packages_services vps
          WHERE ps.package_id = vps.id AND vps.vendor_id = $1 AND ps.vendor_id != $1
        `, [vendor.sr_no]);
        
        console.log(`  ✓ Fixed ${crossoverCount} mismatched package services`);
      } else {
        console.log(`  ✓ All package services correctly isolated for vendor ${vendor.sr_no}`);
      }
    }
    
    // Final check for any remaining mismatches
    const finalCheckResult = await query(`
      SELECT COUNT(*) AS final_count
      FROM package_services ps
      JOIN vendor_packages_services vps ON ps.package_id = vps.id
      WHERE ps.vendor_id != vps.vendor_id OR ps.vendor_id IS NULL
    `);
    
    const finalMismatchCount = parseInt(finalCheckResult.rows[0].final_count);
    
    if (finalMismatchCount > 0) {
      console.log(`\n❌ WARNING: Found ${finalMismatchCount} remaining package services with isolation issues!`);
    } else {
      console.log('\n✓ FINAL CHECK PASSED: All package services properly isolated by vendor!');
    }
    
    console.log('\nVendor data isolation verification completed!');
    
  } catch (error) {
    console.error('Error performing isolation check:', error);
  } finally {
    pool.end();
  }
}

// Run the test
testFinalIsolation(); 