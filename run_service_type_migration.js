const fs = require('fs');
const path = require('path');
const { query } = require('./db');

async function runServiceTypeMigration() {
  try {
    console.log('🔄 Running service type migration...');
    
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', 'add_service_type_columns.sql'),
      'utf8'
    );
    
    await query(migrationSQL);
    
    console.log('✅ Service type migration completed successfully!');
    
    // Verify the new columns exist
    const result = await query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'dashboard_salon_services' 
      AND column_name IN ('service_type', 'selected_services')
      ORDER BY column_name
    `);
    
    console.log('📋 New columns added:');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (default: ${row.column_default || 'NULL'})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runServiceTypeMigration();