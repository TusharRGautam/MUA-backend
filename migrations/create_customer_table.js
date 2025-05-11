// Migration script to create Customer_Table_Details table
const { pool } = require('../db');

async function createCustomerTable() {
  const client = await pool.connect();
  
  try {
    console.log('Creating Customer_Table_Details table...');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Create the Customer_Table_Details table
    await client.query(`
      CREATE TABLE IF NOT EXISTS Customer_Table_Details (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone_number VARCHAR(20) NOT NULL,
        password VARCHAR(255) NOT NULL,
        device_id VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Add comments to describe each column
    await client.query(`
      COMMENT ON COLUMN Customer_Table_Details.id IS 'Primary key with auto-increment';
      COMMENT ON COLUMN Customer_Table_Details.full_name IS 'Full name of the customer';
      COMMENT ON COLUMN Customer_Table_Details.email IS 'Email address (must be unique)';
      COMMENT ON COLUMN Customer_Table_Details.phone_number IS 'Contact phone number';
      COMMENT ON COLUMN Customer_Table_Details.password IS 'Hashed password for account security';
      COMMENT ON COLUMN Customer_Table_Details.device_id IS 'Unique device identifier for the installation';
    `);
    
    // Create indexes for faster lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_customer_email ON Customer_Table_Details(email);
      CREATE INDEX IF NOT EXISTS idx_customer_phone ON Customer_Table_Details(phone_number);
    `);
    
    // Create a function and trigger to update the updated_at timestamp
    await client.query(`
      CREATE OR REPLACE FUNCTION update_customer_details_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      
      CREATE TRIGGER update_customer_details_timestamp
      BEFORE UPDATE ON Customer_Table_Details
      FOR EACH ROW
      EXECUTE FUNCTION update_customer_details_timestamp();
    `);
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('Customer_Table_Details table created successfully.');
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('Error creating Customer_Table_Details table:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration
createCustomerTable().catch(console.error); 