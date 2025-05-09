const { query, pool } = require('./db');
const axios = require('axios');

// Test credentials for two different vendors
const VENDOR1 = {
  email: 'test.vendor@example.com',
  password: 'password123'
};

const VENDOR2 = {
  email: 'w@gmail.com', 
  password: 'password123'
};

const API_URL = process.env.API_URL || 'http://localhost:3001/api';

async function testVendorIsolation() {
  try {
    console.log('Testing vendor package data isolation...');
    
    // First check what packages each vendor has in the database
    console.log('\n### DATABASE CHECK ###');
    
    // Get vendor IDs
    const vendor1Result = await query(
      'SELECT sr_no FROM registration_and_other_details WHERE business_email = $1',
      [VENDOR1.email]
    );
    
    const vendor2Result = await query(
      'SELECT sr_no FROM registration_and_other_details WHERE business_email = $1',
      [VENDOR2.email]
    );
    
    if (vendor1Result.rows.length === 0 || vendor2Result.rows.length === 0) {
      console.error('Test vendors not found in database');
      return;
    }
    
    const vendor1Id = vendor1Result.rows[0].sr_no;
    const vendor2Id = vendor2Result.rows[0].sr_no;
    
    console.log(`Vendor 1 (${VENDOR1.email}) ID: ${vendor1Id}`);
    console.log(`Vendor 2 (${VENDOR2.email}) ID: ${vendor2Id}`);
    
    // Get packages for vendor 1
    const vendor1Packages = await query(
      'SELECT id, name FROM vendor_packages_services WHERE vendor_id = $1',
      [vendor1Id]
    );
    console.log(`\nVendor 1 has ${vendor1Packages.rows.length} packages in the database:`);
    for (const pkg of vendor1Packages.rows) {
      console.log(`  - Package ID ${pkg.id}: ${pkg.name}`);
      
      // Get services for this package
      const servicesResult = await query(
        'SELECT id, name, package_id, vendor_id FROM package_services WHERE package_id = $1',
        [pkg.id]
      );
      
      console.log(`    Services (${servicesResult.rows.length}):`);
      for (const service of servicesResult.rows) {
        // Check if service has correct vendor_id
        const hasCorrectVendorId = service.vendor_id === vendor1Id;
        console.log(`      - Service ID ${service.id}: ${service.name} (vendor_id: ${service.vendor_id}) ${hasCorrectVendorId ? '✓' : '❌'}`);
      }
    }
    
    // Get packages for vendor 2
    const vendor2Packages = await query(
      'SELECT id, name FROM vendor_packages_services WHERE vendor_id = $1',
      [vendor2Id]
    );
    console.log(`\nVendor 2 has ${vendor2Packages.rows.length} packages in the database:`);
    for (const pkg of vendor2Packages.rows) {
      console.log(`  - Package ID ${pkg.id}: ${pkg.name}`);
      
      // Get services for this package
      const servicesResult = await query(
        'SELECT id, name, package_id, vendor_id FROM package_services WHERE package_id = $1',
        [pkg.id]
      );
      
      console.log(`    Services (${servicesResult.rows.length}):`);
      for (const service of servicesResult.rows) {
        // Check if service has correct vendor_id
        const hasCorrectVendorId = service.vendor_id === vendor2Id;
        console.log(`      - Service ID ${service.id}: ${service.name} (vendor_id: ${service.vendor_id}) ${hasCorrectVendorId ? '✓' : '❌'}`);
      }
    }
    
    // Now verify the isolation issue by getting all package_services without vendor isolation
    console.log('\nChecking for potential data leakage:');
    
    // Cross-check vendor 1's package services
    const vendor1ServiceCheck = await query(`
      SELECT COUNT(*) as service_count 
      FROM package_services ps
      JOIN vendor_packages_services vps ON ps.package_id = vps.id
      WHERE vps.vendor_id = $1 AND ps.vendor_id != $1
    `, [vendor1Id]);
    
    console.log(`Vendor 1 has ${vendor1ServiceCheck.rows[0].service_count} package services with incorrect vendor_id`);
    
    // Cross-check vendor 2's package services
    const vendor2ServiceCheck = await query(`
      SELECT COUNT(*) as service_count 
      FROM package_services ps
      JOIN vendor_packages_services vps ON ps.package_id = vps.id
      WHERE vps.vendor_id = $1 AND ps.vendor_id != $1
    `, [vendor2Id]);
    
    console.log(`Vendor 2 has ${vendor2ServiceCheck.rows[0].service_count} package services with incorrect vendor_id`);
    
    // If any mismatched records found, fix them
    if (parseInt(vendor1ServiceCheck.rows[0].service_count) > 0 || parseInt(vendor2ServiceCheck.rows[0].service_count) > 0) {
      console.log('\nFixing mismatched records...');
      
      await query(`
        UPDATE package_services ps
        SET vendor_id = vps.vendor_id
        FROM vendor_packages_services vps
        WHERE ps.package_id = vps.id AND ps.vendor_id != vps.vendor_id
      `);
      
      console.log('Mismatched records fixed');
    }
    
    console.log('\nVendor isolation verification completed!');
    
  } catch (error) {
    console.error('Error testing vendor isolation:', error);
  } finally {
    // Close pool connection
    pool.end();
  }
}

// Run the test
testVendorIsolation(); 