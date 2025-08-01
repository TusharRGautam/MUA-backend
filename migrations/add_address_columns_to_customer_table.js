// Migration script to add address columns to Customer_Table_Details table
const { pool } = require('../db');

async function addAddressColumns() {
  const client = await pool.connect();
  
  try {
    console.log('Adding address columns to Customer_Table_Details table...');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Check if columns already exist
    const checkColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'customer_table_details' 
      AND column_name IN ('house_block_no', 'apartment_area', 'additional_notes', 'address_label')
    `);
    
    const existingColumns = checkColumns.rows.map(row => row.column_name);
    
    // Add house_block_no column if it doesn't exist
    if (!existingColumns.includes('house_block_no')) {
      await client.query(`
        ALTER TABLE Customer_Table_Details 
        ADD COLUMN house_block_no VARCHAR(255);
      `);
      console.log('Added house_block_no column');
    }
    
    // Add apartment_area column if it doesn't exist
    if (!existingColumns.includes('apartment_area')) {
      await client.query(`
        ALTER TABLE Customer_Table_Details 
        ADD COLUMN apartment_area TEXT;
      `);
      console.log('Added apartment_area column');
    }
    
    // Add additional_notes column if it doesn't exist
    if (!existingColumns.includes('additional_notes')) {
      await client.query(`
        ALTER TABLE Customer_Table_Details 
        ADD COLUMN additional_notes TEXT;
      `);
      console.log('Added additional_notes column');
    }
    
    // Add address_label column if it doesn't exist
    if (!existingColumns.includes('address_label')) {
      await client.query(`
        ALTER TABLE Customer_Table_Details 
        ADD COLUMN address_label VARCHAR(50) DEFAULT 'home';
      `);
      console.log('Added address_label column');
    }
    
    // Add comments to describe the new columns
    await client.query(`
      COMMENT ON COLUMN Customer_Table_Details.house_block_no IS 'House or block number of the customer address';
      COMMENT ON COLUMN Customer_Table_Details.apartment_area IS 'Apartment, road, or area details of the customer address';
      COMMENT ON COLUMN Customer_Table_Details.additional_notes IS 'Additional delivery instructions or notes for the address';
      COMMENT ON COLUMN Customer_Table_Details.address_label IS 'Label for the address (home, work, friends, family, other)';
    `);
    
    // Create an index on address_label for faster filtering
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_customer_address_label ON Customer_Table_Details(address_label);
    `);
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('Address columns added successfully to Customer_Table_Details table.');
    
    // Log the current table structure
    const tableStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'customer_table_details'
      ORDER BY ordinal_position;
    `);
    
    console.log('Current Customer_Table_Details structure:');
    tableStructure.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`);
    });
    
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('Error adding address columns to Customer_Table_Details table:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration
addAddressColumns().catch(console.error);