/**
 * Migration script to add identity document columns to registration_and_other_details table
 * Adds aadhaar_card and pan_card columns
 */

const { query, pool } = require('./db');

async function main() {
  console.log('Starting identity documents migration...');
  
  try {
    // Check if the columns already exist to avoid errors
    const checkResult = await query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'registration_and_other_details'
        AND column_name IN ('aadhaar_card', 'pan_card')
    `);
    
    if (checkResult.rows.length > 0) {
      const existingColumns = checkResult.rows.map(row => row.column_name);
      console.log(`The following columns already exist: ${existingColumns.join(', ')}`);
      console.log('Skipping columns that already exist.');
    }

    // Define migration SQL directly in this file
    const migrationSQL = `
      -- Add aadhaar_card and pan_card columns to registration_and_other_details table
      ALTER TABLE registration_and_other_details
      ADD COLUMN IF NOT EXISTS aadhaar_card CHARACTER VARYING(20),
      ADD COLUMN IF NOT EXISTS pan_card CHARACTER VARYING(20);
      
      -- Add comments for documentation
      COMMENT ON COLUMN registration_and_other_details.aadhaar_card IS 'Aadhaar card number for vendor identification';
      COMMENT ON COLUMN registration_and_other_details.pan_card IS 'PAN card number for vendor taxation';
    `;
    
    // Execute SQL migration using a transaction
    console.log('Executing migration SQL...');
    await query('BEGIN');
    await query(migrationSQL);
    await query('COMMIT');
    
    console.log('✅ Migration completed successfully: Added aadhaar_card and pan_card columns');
    
    // Verify the columns exist
    const verifyResult = await query(`
      SELECT 
        column_name, 
        data_type
      FROM 
        information_schema.columns
      WHERE 
        table_name = 'registration_and_other_details'
        AND column_name IN ('aadhaar_card', 'pan_card')
    `);
    
    if (verifyResult.rows.length > 0) {
      console.log('Columns added to registration_and_other_details:');
      verifyResult.rows.forEach(row => {
        console.log(`- ${row.column_name} (${row.data_type})`);
      });
    } else {
      console.warn('⚠️ Verification failed: Columns were not found after migration');
    }
  } catch (err) {
    console.error('❌ Migration failed:', err);
    await query('ROLLBACK').catch(e => console.error('Error during rollback:', e));
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end().catch(e => console.error('Error during pool end:', e));
    }
    console.log('Database connection closed');
  }
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
}); 