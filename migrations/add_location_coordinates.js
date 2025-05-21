// Migration script to add location coordinates to Customer_Table_Details table
const { pool } = require('../db');

async function addLocationCoordinates() {
  const client = await pool.connect();
  
  try {
    console.log('Adding location coordinates to Customer_Table_Details table...');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Add location coordinate columns
    await client.query(`
      ALTER TABLE Customer_Table_Details
      ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7),
      ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7),
      ADD COLUMN IF NOT EXISTS distance DECIMAL(10, 2);
    `);
    
    // Add comments to describe each column
    await client.query(`
      COMMENT ON COLUMN Customer_Table_Details.latitude IS 'Latitude coordinate for customer location';
      COMMENT ON COLUMN Customer_Table_Details.longitude IS 'Longitude coordinate for customer location';
      COMMENT ON COLUMN Customer_Table_Details.distance IS 'Calculated distance from reference point';
    `);
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('Location coordinates added to Customer_Table_Details table successfully.');
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('Error adding location coordinates to Customer_Table_Details table:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration
addLocationCoordinates().catch(console.error); 