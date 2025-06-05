// Simple script to check if columns exist
const { query } = require('./db');

async function checkColumns() {
  try {
    // Check vendor_status column
    const vendorResult = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'registration_and_other_details' AND column_name = 'vendor_status'
      ) as exists;
    `);
    
    console.log(`vendor_status column exists in Registration_And_Other_Details: ${vendorResult.rows[0].exists}`);
    
    // Check user_status column
    const userResult = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'customer_table_details' AND column_name = 'user_status'
      ) as exists;
    `);
    
    console.log(`user_status column exists in Customer_Table_Details: ${userResult.rows[0].exists}`);
    
  } catch (error) {
    console.error('Error checking columns:', error);
  }
}

// Run check
checkColumns().then(() => process.exit(0)); 