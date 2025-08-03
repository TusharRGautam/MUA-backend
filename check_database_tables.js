const { query } = require('./db');

async function checkDatabaseTables() {
  try {
    console.log('=== Checking Database Tables ===');
    
    // Get all tables in the database
    console.log('\n1. Getting all tables in the database:');
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log(`Found ${tablesResult.rows.length} tables:`);
    tablesResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.table_name}`);
    });
    
    // Check for booking-related tables
    console.log('\n2. Checking for booking-related tables:');
    const bookingTablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%booking%'
      ORDER BY table_name;
    `);
    
    console.log(`Found ${bookingTablesResult.rows.length} booking-related tables:`);
    bookingTablesResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.table_name}`);
    });
    
    // Check for user-vendor relationship tables
    console.log('\n3. Checking for user-vendor relationship tables:');
    const userVendorTablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name LIKE '%user%vendor%' OR table_name LIKE '%vendor%user%')
      ORDER BY table_name;
    `);
    
    console.log(`Found ${userVendorTablesResult.rows.length} user-vendor relationship tables:`);
    userVendorTablesResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.table_name}`);
    });
    
    // Check for customer tables
    console.log('\n4. Checking customer tables:');
    const customerTablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%customer%'
      ORDER BY table_name;
    `);
    
    console.log(`Found ${customerTablesResult.rows.length} customer tables:`);
    customerTablesResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.table_name}`);
    });
    
    // Check for vendor tables
    console.log('\n5. Checking vendor tables:');
    const vendorTablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%vendor%'
      ORDER BY table_name;
    `);
    
    console.log(`Found ${vendorTablesResult.rows.length} vendor tables:`);
    vendorTablesResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.table_name}`);
    });
    
    // Check if the specific table exists
    console.log('\n6. Checking for booking_all_details_of_user_to_vendor table:');
    const specificTableResult = await query(`
      SELECT table_name, 
             (SELECT count(*) FROM booking_all_details_of_user_to_vendor) as row_count
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'booking_all_details_of_user_to_vendor';
    `);
    
    if (specificTableResult.rows.length > 0) {
      console.log('✅ Table "booking_all_details_of_user_to_vendor" exists!');
      console.log(`📊 Row count: ${specificTableResult.rows[0].row_count}`);
      
      // Get table structure
      console.log('\n7. Getting table structure:');
      const tableStructureResult = await query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'booking_all_details_of_user_to_vendor'
        ORDER BY ordinal_position;
      `);
      
      console.log('Table structure:');
      tableStructureResult.rows.forEach((col, index) => {
        console.log(`${index + 1}. ${col.column_name} (${col.data_type}${col.is_nullable === 'NO' ? ', NOT NULL' : ''})`);
      });
      
      // Get sample data if any exists
      if (specificTableResult.rows[0].row_count > 0) {
        console.log('\n8. Getting sample data (first 3 rows):');
        const sampleDataResult = await query(`
          SELECT * FROM booking_all_details_of_user_to_vendor 
          LIMIT 3;
        `);
        
        console.log('Sample data:');
        console.log(JSON.stringify(sampleDataResult.rows, null, 2));
      } else {
        console.log('\n8. Table exists but contains no data.');
      }
    } else {
      console.log('❌ Table "booking_all_details_of_user_to_vendor" does not exist!');
      console.log('\n💡 The table needs to be created. Possible solutions:');
      console.log('   1. Create the table manually');
      console.log('   2. Run database migrations');
      console.log('   3. Import data from another source');
    }
    
  } catch (error) {
    console.error('Error checking database tables:', error);
  }
}

// Run the check
checkDatabaseTables().then(() => {
  console.log('\n=== Database check completed ===');
  process.exit(0);
}).catch(error => {
  console.error('Failed to check database:', error);
  process.exit(1);
});