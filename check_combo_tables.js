const { query, pool } = require('./db');

async function checkComboTables() {
  try {
    console.log('Checking combo tables...');
    
    // Check if vendor_combo_services exists
    const vendorComboTableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'vendor_combo_services'
      )
    `);
    
    const vendorComboTableExists = vendorComboTableCheck.rows[0].exists;
    console.log(`vendor_combo_services table exists: ${vendorComboTableExists}`);
    
    // Check if combo_services exists
    const comboServicesTableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'combo_services'
      )
    `);
    
    const comboServicesTableExists = comboServicesTableCheck.rows[0].exists;
    console.log(`combo_services table exists: ${comboServicesTableExists}`);
    
    // If both tables exist, check their columns
    if (vendorComboTableExists && comboServicesTableExists) {
      console.log('\nChecking table columns...');
      
      // Get vendor_combo_services columns
      const vendorComboColumnsQuery = await query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'vendor_combo_services'
        ORDER BY ordinal_position
      `);
      
      console.log('\nvendor_combo_services columns:');
      vendorComboColumnsQuery.rows.forEach(column => {
        console.log(`- ${column.column_name}: ${column.data_type}`);
      });
      
      // Get combo_services columns
      const comboServicesColumnsQuery = await query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'combo_services'
        ORDER BY ordinal_position
      `);
      
      console.log('\ncombo_services columns:');
      comboServicesColumnsQuery.rows.forEach(column => {
        console.log(`- ${column.column_name}: ${column.data_type}`);
      });
      
      // Check if triggers exist
      const triggerCheck = await query(`
        SELECT trigger_name
        FROM information_schema.triggers
        WHERE event_object_table IN ('vendor_combo_services', 'combo_services')
      `);
      
      console.log('\nExisting triggers:');
      if (triggerCheck.rows.length === 0) {
        console.log('No triggers found. Creating them...');
        
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
        
        // Create triggers for both tables
        try {
          await query(`
            CREATE TRIGGER update_vendor_combo_services_timestamp
            BEFORE UPDATE ON vendor_combo_services
            FOR EACH ROW
            EXECUTE FUNCTION update_modified_column();
          `);
          console.log('Created trigger for vendor_combo_services');
        } catch (err) {
          console.log('Trigger for vendor_combo_services already exists or failed to create:', err.message);
        }
        
        try {
          await query(`
            CREATE TRIGGER update_combo_services_timestamp
            BEFORE UPDATE ON combo_services
            FOR EACH ROW
            EXECUTE FUNCTION update_modified_column();
          `);
          console.log('Created trigger for combo_services');
        } catch (err) {
          console.log('Trigger for combo_services already exists or failed to create:', err.message);
        }
      } else {
        triggerCheck.rows.forEach(trigger => {
          console.log(`- ${trigger.trigger_name}`);
        });
      }
    } else {
      console.log('\nOne or both tables are missing. Please run the migration script again.');
    }
    
    console.log('\nCombo tables check completed.');
  } catch (error) {
    console.error('Error checking combo tables:', error);
  } finally {
    await pool.end();
  }
}

checkComboTables(); 