const fs = require('fs');
const path = require('path');
const { query, pool } = require('./db');

async function runComboDurationMigration() {
  try {
    console.log('Starting migration: Adding combo_duration field to vendor_combo_services table...');
    
    // Read the migration SQL file
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', 'add_combo_duration.sql'),
      'utf8'
    );
    
    // Execute the migration SQL
    const result = await query(migrationSQL);
    console.log('Migration SQL executed successfully!');
    
    // Verify the column was added
    const columnCheck = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'vendor_combo_services' 
      AND column_name = 'combo_duration'
    `);
    
    if (columnCheck.rows.length > 0) {
      console.log('Verification successful: combo_duration column exists in vendor_combo_services table');
      console.log('Column details:', columnCheck.rows[0]);
      
      // Check if there are existing combo records
      const comboCount = await query(`
        SELECT COUNT(*) FROM vendor_combo_services
      `);
      
      console.log(`Found ${comboCount.rows[0].count} existing combo records in the database.`);
      
      if (parseInt(comboCount.rows[0].count) > 0) {
        console.log('Ensuring existing records have a duration value...');
        
        // Update any records with null or 0 duration
        const updateResult = await query(`
          UPDATE vendor_combo_services 
          SET combo_duration = 60 
          WHERE combo_duration IS NULL OR combo_duration = 0
        `);
        
        console.log(`Updated ${updateResult.rowCount} records with default duration value.`);
      }
    } else {
      console.error('ERROR: combo_duration column was not added successfully.');
    }
    
    console.log('Migration complete!');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the migration
runComboDurationMigration(); 