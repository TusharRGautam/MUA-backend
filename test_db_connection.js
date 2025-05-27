const { query, testConnection: dbTestConnection } = require('./src/config/database');

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Use the existing test connection function
    const isConnected = await dbTestConnection();
    
    if (!isConnected) {
      console.log('❌ Database connection failed');
      return false;
    }
    
    console.log('✅ Database connection successful');
    
    // Check if tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('our_services_icons', 'our_services_section', 'our_services_product')
      ORDER BY table_name;
    `;
    
    const tablesResult = await query(tablesQuery);
    console.log('\n📋 Checking required tables:');
    
    const requiredTables = ['our_services_icons', 'our_services_section', 'our_services_product'];
    const existingTables = tablesResult.rows.map(row => row.table_name);
    
    requiredTables.forEach(table => {
      if (existingTables.includes(table)) {
        console.log(`  ✅ ${table} - EXISTS`);
      } else {
        console.log(`  ❌ ${table} - MISSING`);
      }
    });
    
    if (existingTables.length === requiredTables.length) {
      console.log('\n🎉 All required tables exist!');
      
      // Check current data counts
      console.log('\n📊 Current data counts:');
      for (const table of existingTables) {
        const countResult = await query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`  ${table}: ${countResult.rows[0].count} records`);
      }
      
      // Show table structures
      console.log('\n🏗️  Table structures:');
      for (const table of existingTables) {
        console.log(`\n  ${table.toUpperCase()}:`);
        const structureResult = await query(`
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_name = $1 
          ORDER BY ordinal_position
        `, [table]);
        
        structureResult.rows.forEach(row => {
          console.log(`    - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
        });
      }
      
    } else {
      console.log('\n❌ Some required tables are missing. Please create them first.');
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    return false;
  }
}

// Run the test
if (require.main === module) {
  testConnection()
    .then((success) => {
      if (success) {
        console.log('\n✅ Database test completed successfully');
        console.log('💡 You can now run: node populate_services_data.js');
      } else {
        console.log('\n❌ Database test failed');
        console.log('💡 Please check your database configuration and table setup');
        console.log('💡 Make sure you have a .env file with proper Supabase credentials');
      }
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Test script failed:', error);
      process.exit(1);
    });
}

module.exports = { testConnection }; 