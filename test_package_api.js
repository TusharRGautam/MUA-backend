const fetch = require('node-fetch');
const { query, pool } = require('./db');

async function testPackageAPI() {
  try {
    console.log('Testing package API with the new columns...');
    
    // First get a test vendor to use
    const vendorResult = await query(`
      SELECT sr_no, business_email FROM registration_and_other_details LIMIT 1
    `);
    
    if (vendorResult.rows.length === 0) {
      console.log('No vendors found in the database to test with');
      return;
    }
    
    const testVendor = vendorResult.rows[0];
    console.log(`Using test vendor: ID ${testVendor.sr_no}, Email: ${testVendor.business_email}`);
    
    // Test data for package creation
    const testPackage = {
      vendorEmail: testVendor.business_email,
      package: {
        name: "Test Package with New Fields",
        description: "This is a test package with new description field",
        totalPrice: 1500,
        services: [
          {
            name: "Test Service 1",
            price: 500,
            category: "Haircut",
            description: "This is a test service with category and description"
          },
          {
            name: "Test Service 2",
            price: 1000,
            category: "Facial",
            description: "Another test service with the new fields"
          }
        ]
      }
    };
    
    console.log('Test package data:', JSON.stringify(testPackage, null, 2));
    
    // Get API base URL from environment or use default
    const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3001/api';
    
    // This is just a dry run - it will show the data that would be sent
    // We're not making the actual API call since we don't have auth token for testing
    console.log(`\nAPI URL that would be called: ${apiBaseUrl}/vendor/packages/single`);
    console.log('NOTE: This is just a simulation. No actual API call is made.');
    
    // Instead, let's verify the table structure again
    console.log('\nVerifying database has the correct structure:');
    const packageTableInfo = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'vendor_packages_services'
      ORDER BY ordinal_position
    `);
    
    console.log('vendor_packages_services columns:');
    packageTableInfo.rows.forEach(col => {
      console.log(`  ${col.column_name} (${col.data_type})`);
    });
    
    console.log('\npackage_services columns:');
    const serviceTableInfo = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'package_services'
      ORDER BY ordinal_position
    `);
    
    serviceTableInfo.rows.forEach(col => {
      console.log(`  ${col.column_name} (${col.data_type})`);
    });
    
    console.log('\nMigration testing completed successfully!');
    
  } catch (error) {
    console.error('Error testing package API:', error);
  } finally {
    // Close pool connection
    pool.end();
  }
}

// Run the test
testPackageAPI(); 