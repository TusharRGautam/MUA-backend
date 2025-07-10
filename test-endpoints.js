const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'mua_database',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function testEndpoints() {
  let client;
  
  try {
    client = await pool.connect();
    
    console.log('🧪 Testing new vendor service endpoints...');
    
    // Test 1: Check if registration_and_other_details table exists and has data
    console.log('\n1. Testing registration_and_other_details table:');
    const businessTypeQuery = `
      SELECT sr_no, business_type, person_name
      FROM registration_and_other_details 
      WHERE sr_no IN (1, 2, 3, 4, 5)
      ORDER BY sr_no
    `;
    
    const businessResult = await client.query(businessTypeQuery);
    console.log(`   Found ${businessResult.rows.length} vendors with business types:`);
    businessResult.rows.forEach(row => {
      console.log(`   - Vendor ID ${row.sr_no}: ${row.business_type} (${row.person_name})`);
    });
    
    // Test 2: Check if ready_services_vendors_data table exists and has data
    console.log('\n2. Testing ready_services_vendors_data table:');
    const categoriesQuery = `
      SELECT vendor_id, selected_categories
      FROM ready_services_vendors_data 
      WHERE vendor_id IN (1, 2, 3, 4, 5)
      ORDER BY vendor_id
    `;
    
    const categoriesResult = await client.query(categoriesQuery);
    console.log(`   Found ${categoriesResult.rows.length} vendors with selected categories:`);
    categoriesResult.rows.forEach(row => {
      console.log(`   - Vendor ID ${row.vendor_id}: ${JSON.stringify(row.selected_categories)}`);
    });
    
    // Test 3: Check if our_services_section table exists and has data
    console.log('\n3. Testing our_services_section table:');
    const servicesQuery = `
      SELECT id, service_name, category, price, business_type
      FROM our_services_section 
      ORDER BY category, service_name
      LIMIT 10
    `;
    
    const servicesResult = await client.query(servicesQuery);
    console.log(`   Found ${servicesResult.rows.length} services:`);
    servicesResult.rows.forEach(row => {
      console.log(`   - ID ${row.id}: ${row.service_name} (${row.category}) - $${row.price} [${row.business_type}]`);
    });
    
    // Test 4: Test the complete workflow for a specific vendor
    console.log('\n4. Testing complete workflow for Vendor ID 1:');
    
    const vendorId = 1;
    
    // Get business type
    const businessTypeResult = await client.query(
      'SELECT business_type FROM registration_and_other_details WHERE sr_no = $1',
      [vendorId]
    );
    
    if (businessTypeResult.rows.length > 0) {
      const businessType = businessTypeResult.rows[0].business_type;
      console.log(`   Business type: ${businessType}`);
      
      // Get selected categories
      const categoriesResult = await client.query(
        'SELECT selected_categories FROM ready_services_vendors_data WHERE vendor_id = $1',
        [vendorId]
      );
      
      if (categoriesResult.rows.length > 0) {
        let selectedCategories = categoriesResult.rows[0].selected_categories;
        
        // Parse if it's a string
        if (typeof selectedCategories === 'string') {
          try {
            selectedCategories = JSON.parse(selectedCategories);
          } catch (e) {
            console.log(`   Error parsing categories: ${e.message}`);
          }
        }
        
        console.log(`   Selected categories: ${JSON.stringify(selectedCategories)}`);
        
        // Get services for these categories
        if (Array.isArray(selectedCategories) && selectedCategories.length > 0) {
          const placeholders = selectedCategories.map((_, index) => `$${index + 1}`).join(', ');
          const servicesQuery = `
            SELECT id, service_name, service_description, price, category, business_type
            FROM our_services_section 
            WHERE category IN (${placeholders})
            ${businessType ? `AND (business_type = $${selectedCategories.length + 1} OR business_type IS NULL)` : ''}
            ORDER BY service_name
            LIMIT 5
          `;
          
          const queryParams = [...selectedCategories];
          if (businessType) {
            queryParams.push(businessType);
          }
          
          const servicesResult = await client.query(servicesQuery, queryParams);
          console.log(`   Found ${servicesResult.rows.length} matching services:`);
          servicesResult.rows.forEach(service => {
            console.log(`     - ${service.service_name} (${service.category}) - $${service.price}`);
          });
        } else {
          console.log(`   No valid categories found for vendor ${vendorId}`);
        }
      } else {
        console.log(`   No categories found for vendor ${vendorId}`);
      }
    } else {
      console.log(`   No business type found for vendor ${vendorId}`);
    }
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    if (client) {
      client.release();
    }
    process.exit(0);
  }
}

testEndpoints(); 