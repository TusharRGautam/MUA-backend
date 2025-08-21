// Migration script to add Firebase support columns to Customer_Table_Details table
const { pool } = require('../db');

async function addFirebaseSupport() {
  const client = await pool.connect();
  
  try {
    console.log('Adding Firebase support columns to Customer_Table_Details table...');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Check existing columns
    const checkColumns = await client.query(`
      SELECT column_name, is_nullable, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'customer_table_details'
      ORDER BY ordinal_position;
    `);
    
    const existingColumns = checkColumns.rows.map(row => row.column_name);
    console.log('Existing columns:', existingColumns);
    
    // 1. Add firebase_uid column if it doesn't exist
    if (!existingColumns.includes('firebase_uid')) {
      await client.query(`
        ALTER TABLE Customer_Table_Details 
        ADD COLUMN firebase_uid VARCHAR(255) UNIQUE;
      `);
      console.log('Added firebase_uid column');
    }
    
    // 2. Add custom_user_id column if it doesn't exist
    if (!existingColumns.includes('custom_user_id')) {
      await client.query(`
        ALTER TABLE Customer_Table_Details 
        ADD COLUMN custom_user_id VARCHAR(255) UNIQUE DEFAULT ('CU' || nextval('customer_table_details_id_seq'::regclass));
      `);
      console.log('Added custom_user_id column');
      
      // Update existing records with custom_user_id
      await client.query(`
        UPDATE Customer_Table_Details 
        SET custom_user_id = 'CU' || id 
        WHERE custom_user_id IS NULL OR custom_user_id = 'CU' || id;
      `);
      console.log('Updated existing records with custom_user_id');
    }
    
    // 3. Modify email column to allow NULL (for Firebase users who might not have email)
    const emailColumn = checkColumns.rows.find(row => row.column_name === 'email');
    if (emailColumn && emailColumn.is_nullable === 'NO') {
      console.log('Modifying email column to allow NULL values for Firebase users...');
      
      // First, check if there are any duplicate emails
      const duplicateEmails = await client.query(`
        SELECT email, COUNT(*) as count 
        FROM Customer_Table_Details 
        WHERE email IS NOT NULL 
        GROUP BY email 
        HAVING COUNT(*) > 1;
      `);
      
      if (duplicateEmails.rows.length > 0) {
        console.log('Found duplicate emails, cleaning up...');
        for (const duplicate of duplicateEmails.rows) {
          console.log(`Cleaning up duplicate email: ${duplicate.email}`);
          // Keep the first record, add suffix to others
          await client.query(`
            UPDATE Customer_Table_Details 
            SET email = email || '_duplicate_' || id 
            WHERE email = $1 
            AND id NOT IN (
              SELECT MIN(id) 
              FROM Customer_Table_Details 
              WHERE email = $1
            );
          `, [duplicate.email]);
        }
      }
      
      // Now modify the column to allow NULL and remove NOT NULL constraint
      await client.query(`
        ALTER TABLE Customer_Table_Details 
        ALTER COLUMN email DROP NOT NULL;
      `);
      console.log('Email column now allows NULL values');
    }
    
    // 4. Modify phone_number column to allow NULL (for Google Sign-In users)
    const phoneColumn = checkColumns.rows.find(row => row.column_name === 'phone_number');
    if (phoneColumn && phoneColumn.is_nullable === 'NO') {
      console.log('Modifying phone_number column to allow NULL values for Google users...');
      await client.query(`
        ALTER TABLE Customer_Table_Details 
        ALTER COLUMN phone_number DROP NOT NULL;
      `);
      console.log('Phone number column now allows NULL values');
    }
    
    // 5. Add device_info column if it doesn't exist (for enhanced device tracking)
    if (!existingColumns.includes('device_info')) {
      await client.query(`
        ALTER TABLE Customer_Table_Details 
        ADD COLUMN device_info JSONB;
      `);
      console.log('Added device_info column');
    }
    
    // 6. Add indexes for Firebase support
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_customer_firebase_uid ON Customer_Table_Details(firebase_uid);
      CREATE INDEX IF NOT EXISTS idx_customer_custom_user_id ON Customer_Table_Details(custom_user_id);
    `);
    console.log('Added indexes for Firebase support');
    
    // 7. Add comments to describe the new columns
    await client.query(`
      COMMENT ON COLUMN Customer_Table_Details.firebase_uid IS 'Firebase Authentication UID for users who sign in with Firebase';
      COMMENT ON COLUMN Customer_Table_Details.custom_user_id IS 'Custom user ID for internal reference (auto-generated)';
      COMMENT ON COLUMN Customer_Table_Details.device_info IS 'JSON object containing device information and metadata';
    `);
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('Firebase support columns added successfully to Customer_Table_Details table.');
    
    // Log the updated table structure
    const tableStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'customer_table_details'
      ORDER BY ordinal_position;
    `);
    
    console.log('Updated Customer_Table_Details structure:');
    tableStructure.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`);
    });
    
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('Error adding Firebase support to Customer_Table_Details table:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration if called directly
if (require.main === module) {
  addFirebaseSupport().catch(console.error);
}

module.exports = { addFirebaseSupport };