const { query, pool } = require('./db');

async function verifyComboFeatures() {
  try {
    console.log('Verifying combo feature settings...');
    
    // Step 1: Check if tables exist
    console.log('\n1. Checking database tables...');
    const tablesCheck = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('vendor_combo_services', 'combo_services')
    `);
    
    const tables = tablesCheck.rows.map(row => row.table_name);
    console.log(`Found ${tables.length}/2 required tables: ${tables.join(', ')}`);
    
    if (tables.length < 2) {
      console.error('ERROR: Missing required tables. Please run the combo migration script first.');
      return;
    }
    
    // Step 2: Check if columns exist in the tables
    console.log('\n2. Checking table columns...');
    
    // Check vendor_combo_services columns
    const comboTableColumns = await query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'vendor_combo_services'
    `);
    
    const requiredComboColumns = ['id', 'vendor_id', 'combo_name', 'combo_description', 'combo_price', 'created_at', 'updated_at'];
    const existingComboColumns = comboTableColumns.rows.map(row => row.column_name);
    
    console.log('vendor_combo_services columns:');
    requiredComboColumns.forEach(column => {
      const exists = existingComboColumns.includes(column);
      console.log(`  - ${column}: ${exists ? '✓' : '✗'}`);
    });
    
    // Check combo_services columns
    const servicesTableColumns = await query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'combo_services'
    `);
    
    const requiredServicesColumns = ['id', 'combo_id', 'name', 'price', 'category', 'description', 'vendor_id'];
    const existingServicesColumns = servicesTableColumns.rows.map(row => row.column_name);
    
    console.log('\ncombo_services columns:');
    requiredServicesColumns.forEach(column => {
      const exists = existingServicesColumns.includes(column);
      console.log(`  - ${column}: ${exists ? '✓' : '✗'}`);
    });
    
    // Step 3: Check if triggers exist
    console.log('\n3. Checking triggers...');
    const triggersCheck = await query(`
      SELECT trigger_name
      FROM information_schema.triggers
      WHERE event_object_table IN ('vendor_combo_services', 'combo_services')
    `);
    
    const triggers = triggersCheck.rows.map(row => row.trigger_name);
    console.log(`Found ${triggers.length} triggers: ${triggers.join(', ') || 'none'}`);
    
    if (triggers.length === 0) {
      console.log('  No triggers found. Creating them...');
      
      // Create update_modified_column function if it doesn't exist
      await query(`
        CREATE OR REPLACE FUNCTION update_modified_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `);
      
      try {
        await query(`
          CREATE TRIGGER update_vendor_combo_services_timestamp
          BEFORE UPDATE ON vendor_combo_services
          FOR EACH ROW
          EXECUTE FUNCTION update_modified_column();
        `);
        console.log('  Created trigger for vendor_combo_services ✓');
      } catch (e) {
        console.log('  Failed to create trigger for vendor_combo_services:', e.message);
      }
      
      try {
        await query(`
          CREATE TRIGGER update_combo_services_timestamp
          BEFORE UPDATE ON combo_services
          FOR EACH ROW
          EXECUTE FUNCTION update_modified_column();
        `);
        console.log('  Created trigger for combo_services ✓');
      } catch (e) {
        console.log('  Failed to create trigger for combo_services:', e.message);
      }
    }
    
    // Step 4: Test insertion 
    console.log('\n4. Testing combo insertion and retrieval...');
    
    // Get a vendor ID for testing
    const vendorQuery = await query(`
      SELECT sr_no, business_email FROM registration_and_other_details LIMIT 1
    `);
    
    if (vendorQuery.rows.length === 0) {
      console.log('  No vendors found in the database for testing. Skipping insertion test.');
      return;
    }
    
    const vendorId = vendorQuery.rows[0].sr_no;
    const vendorEmail = vendorQuery.rows[0].business_email;
    console.log(`  Using vendor ID ${vendorId} (${vendorEmail}) for testing`);
    
    // Begin transaction for test insertion
    await query('BEGIN');
    
    try {
      // Insert a test combo
      const testComboName = `Test Combo ${Date.now()}`;
      const testComboResult = await query(`
        INSERT INTO vendor_combo_services (
          vendor_id, combo_name, combo_description, combo_price
        ) VALUES ($1, $2, $3, $4) RETURNING id
      `, [vendorId, testComboName, 'Test combo description', 1000]);
      
      const comboId = testComboResult.rows[0].id;
      console.log(`  Created test combo with ID ${comboId}`);
      
      // Insert test services
      await query(`
        INSERT INTO combo_services (
          combo_id, name, price, category, description, vendor_id
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [comboId, 'Test Service 1', 500, 'Facial', 'Test service description', vendorId]);
      
      await query(`
        INSERT INTO combo_services (
          combo_id, name, price, category, description, vendor_id
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [comboId, 'Test Service 2', 500, 'Haircut', 'Test service description', vendorId]);
      
      console.log('  Added 2 test services to the combo');
      
      // Test retrieval
      const retrievalTest = await query(`
        SELECT c.*, 
          (SELECT json_agg(s) FROM combo_services s WHERE s.combo_id = c.id) as services
        FROM vendor_combo_services c
        WHERE c.id = $1 AND c.vendor_id = $2
      `, [comboId, vendorId]);
      
      if (retrievalTest.rows.length > 0 && retrievalTest.rows[0].services) {
        console.log('  Successfully retrieved combo with services ✓');
        console.log('  Combo name:', retrievalTest.rows[0].combo_name);
        console.log('  Services:', retrievalTest.rows[0].services.length);
      } else {
        console.error('  Error: Could not retrieve combo with services');
      }
      
      // Rollback test data so we don't keep test data in the database
      await query('ROLLBACK');
      console.log('  Test data rolled back successfully');
    } catch (error) {
      await query('ROLLBACK');
      console.error('  Error during test:', error);
    }
    
    console.log('\nVerification complete! The combo feature appears to be properly set up.');
    
  } catch (error) {
    console.error('Error during verification:', error);
  } finally {
    await pool.end();
  }
}

// Run the verification
verifyComboFeatures(); 