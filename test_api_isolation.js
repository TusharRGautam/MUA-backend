const axios = require('axios');
const { query, pool } = require('./db');

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

async function loginVendor(email, password) {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password
    });
    return response.data.token;
  } catch (error) {
    console.error(`Login error for ${email}:`, error.response?.data || error.message);
    return null;
  }
}

async function getVendorPackages(token, vendorEmail) {
  try {
    const response = await axios.get(`${API_URL}/vendor/packages?vendorEmail=${encodeURIComponent(vendorEmail)}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Get packages error for ${vendorEmail}:`, error.response?.data || error.message);
    return null;
  }
}

async function testAPIIsolation() {
  try {
    console.log('Testing API data isolation between vendors...');
    
    // Login as vendor 1
    console.log(`\nLogging in as Vendor 1 (${VENDOR1.email})...`);
    const vendor1Token = await loginVendor(VENDOR1.email, VENDOR1.password);
    if (!vendor1Token) {
      console.error('Failed to login as Vendor 1');
      return;
    }
    console.log('Vendor 1 login successful ✓');
    
    // Login as vendor 2
    console.log(`\nLogging in as Vendor 2 (${VENDOR2.email})...`);
    const vendor2Token = await loginVendor(VENDOR2.email, VENDOR2.password);
    if (!vendor2Token) {
      console.error('Failed to login as Vendor 2');
      return;
    }
    console.log('Vendor 2 login successful ✓');
    
    // Get packages for vendor 1
    console.log(`\nGetting packages for Vendor 1 (${VENDOR1.email})...`);
    const vendor1Packages = await getVendorPackages(vendor1Token, VENDOR1.email);
    if (!vendor1Packages) {
      console.error('Failed to get packages for Vendor 1');
      return;
    }
    
    console.log(`Vendor 1 has ${vendor1Packages.packages.length} packages`);
    console.log('Vendor 1 packages:');
    for (const pkg of vendor1Packages.packages.slice(0, 3)) { // Show first 3 for brevity
      console.log(`  - Package ID ${pkg.id}: ${pkg.name}`);
      console.log(`    Services (${pkg.services.length}):`);
      for (const service of pkg.services.slice(0, 2)) { // Show first 2 services for brevity
        console.log(`      - Service: ${service.name}, Price: ${service.price}`);
      }
      if (pkg.services.length > 2) {
        console.log(`      - ... and ${pkg.services.length - 2} more services`);
      }
    }
    
    // Get packages for vendor 2
    console.log(`\nGetting packages for Vendor 2 (${VENDOR2.email})...`);
    const vendor2Packages = await getVendorPackages(vendor2Token, VENDOR2.email);
    if (!vendor2Packages) {
      console.error('Failed to get packages for Vendor 2');
      return;
    }
    
    console.log(`Vendor 2 has ${vendor2Packages.packages.length} packages`);
    console.log('Vendor 2 packages:');
    for (const pkg of vendor2Packages.packages.slice(0, 3)) { // Show first 3 for brevity
      console.log(`  - Package ID ${pkg.id}: ${pkg.name}`);
      console.log(`    Services (${pkg.services.length}):`);
      for (const service of pkg.services.slice(0, 2)) { // Show first 2 services for brevity
        console.log(`      - Service: ${service.name}, Price: ${service.price}`);
      }
      if (pkg.services.length > 2) {
        console.log(`      - ... and ${pkg.services.length - 2} more services`);
      }
    }
    
    // Test unauthorized access - vendor 1 accessing vendor 2's data
    console.log('\nTesting unauthorized access - Vendor 1 trying to access Vendor 2 data...');
    const unauthorizedTest = await getVendorPackages(vendor1Token, VENDOR2.email);
    if (unauthorizedTest && unauthorizedTest.success) {
      console.error('❌ SECURITY ISSUE: Vendor 1 was able to access Vendor 2 data!');
    } else {
      console.log('✓ Security check passed: Vendor 1 could not access Vendor 2 data');
    }
    
    // Check for package services without vendor_id
    console.log('\nChecking database for package_services without vendor_id...');
    const missingVendorIdCheck = await query(`
      SELECT COUNT(*) as count
      FROM package_services
      WHERE vendor_id IS NULL
    `);
    
    if (parseInt(missingVendorIdCheck.rows[0].count) > 0) {
      console.error(`❌ Found ${missingVendorIdCheck.rows[0].count} service records without vendor_id`);
    } else {
      console.log('✓ All package services have vendor_id set');
    }
    
    // Check for mismatched vendor_id between packages and services
    console.log('\nChecking for mismatched vendor_id between packages and services...');
    const mismatchCheck = await query(`
      SELECT COUNT(*) as count
      FROM package_services ps
      JOIN vendor_packages_services vps ON ps.package_id = vps.id
      WHERE ps.vendor_id != vps.vendor_id
    `);
    
    if (parseInt(mismatchCheck.rows[0].count) > 0) {
      console.error(`❌ Found ${mismatchCheck.rows[0].count} service records with mismatched vendor_id`);
    } else {
      console.log('✓ All package services have correct vendor_id');
    }
    
    console.log('\nAPI data isolation test completed!');
    
  } catch (error) {
    console.error('Error testing API isolation:', error);
  } finally {
    pool.end();
  }
}

// Run the test
testAPIIsolation(); 