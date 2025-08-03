const fs = require('fs');
const path = require('path');
const { pool, query } = require('./src/config/database');

async function executeSalonMigration() {
  console.log('🚀 Executing Salon Packages and Combos Migration');
  console.log('='.repeat(60));

  try {
    // Test database connection first
    console.log('🔍 Testing database connection...');
    const testResult = await query('SELECT NOW()');
    console.log('✅ Database connection successful:', testResult.rows[0].now);

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'migrations', 'add_salon_packages_and_combos.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration SQL file loaded successfully');
    console.log(`📁 File: ${migrationPath}`);
    
    // Execute the migration
    console.log('\n🔄 Executing migration...');
    console.log('-'.repeat(40));
    
    await query(migrationSQL);
    
    console.log('\n✅ Migration executed successfully!');
    
    // Verify the migration by checking the inserted data
    console.log('\n🔍 Verifying migration results...');
    
    // Count services by type
    const typeCountResult = await query(`
      SELECT service_type, COUNT(*) as count 
      FROM dashboard_salon_services 
      WHERE service_type IN ('Package', 'Combo') 
      GROUP BY service_type
      ORDER BY service_type
    `);
    
    console.log('\n📊 Service Type Counts:');
    typeCountResult.rows.forEach(row => {
      console.log(`   ${row.service_type}: ${row.count} services`);
    });
    
    // Show packages
    const packagesResult = await query(`
      SELECT package_name, service_price, service_duration 
      FROM dashboard_salon_services 
      WHERE service_type = 'Package' 
      ORDER BY service_price DESC
    `);
    
    console.log('\n🎁 PACKAGES CREATED:');
    packagesResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.package_name} - ₹${row.service_price} (${row.service_duration} min)`);
    });
    
    // Show combos
    const combosResult = await query(`
      SELECT package_name, service_price, service_duration 
      FROM dashboard_salon_services 
      WHERE service_type = 'Combo' 
      ORDER BY service_price DESC
    `);
    
    console.log('\n🔗 COMBOS CREATED:');
    combosResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.package_name} - ₹${row.service_price} (${row.service_duration} min)`);
    });
    
    // Calculate totals
    const totalServicesResult = await query(`
      SELECT COUNT(*) as total_count 
      FROM dashboard_salon_services
    `);
    
    const newServicesResult = await query(`
      SELECT COUNT(*) as new_count 
      FROM dashboard_salon_services 
      WHERE service_type IN ('Single', 'Package', 'Combo')
    `);
    
    console.log('\n📈 SUMMARY:');
    console.log(`   Total services in database: ${totalServicesResult.rows[0].total_count}`);
    console.log(`   Services with types: ${newServicesResult.rows[0].new_count}`);
    console.log(`   Packages added: ${packagesResult.rows.length}`);
    console.log(`   Combos added: ${combosResult.rows.length}`);
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('✨ Your salon now has comprehensive packages and combos ready for customers!');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('💡 Error details:', {
      code: error.code,
      detail: error.detail,
      hint: error.hint
    });
    
    if (error.message.includes('relation') && error.message.includes('does not exist')) {
      console.error('\n🔧 Possible fix: Make sure the dashboard_salon_services table exists');
      console.error('   Run the table creation migration first if needed');
    }
    
    throw error;
  } finally {
    // Close the database connection
    if (pool) {
      await pool.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Execute if called directly
if (require.main === module) {
  executeSalonMigration()
    .then(() => {
      console.log('\n🎉 Migration execution completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Migration execution failed:', error);
      process.exit(1);
    });
}

module.exports = executeSalonMigration;