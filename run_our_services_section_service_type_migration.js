const fs = require('fs');
const path = require('path');
const { query } = require('./db');

async function runOurServicesSectionServiceTypeMigration() {
  try {
    console.log('🔄 Running service_type migration for our_services_section table...');
    
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', 'add_service_type_to_our_services_section.sql'),
      'utf8'
    );
    
    await query(migrationSQL);
    
    console.log('✅ Service type migration for our_services_section completed successfully!');
    
    // Verify the new column exists
    const result = await query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'our_services_section' 
      AND column_name = 'service_type'
    `);
    
    if (result.rows.length > 0) {
      console.log('📋 New column added:');
      const row = result.rows[0];
      console.log(`- ${row.column_name}: ${row.data_type} (default: ${row.column_default || 'NULL'})`);
    }
    
    // Show current service type distribution
    const distribution = await query(`
      SELECT service_type, COUNT(*) as count
      FROM our_services_section 
      GROUP BY service_type
      ORDER BY service_type
    `);
    
    console.log('📊 Current service type distribution:');
    distribution.rows.forEach(row => {
      console.log(`- ${row.service_type}: ${row.count} services`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runOurServicesSectionServiceTypeMigration();