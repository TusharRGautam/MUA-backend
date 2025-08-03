const fs = require('fs');
const path = require('path');
const { query } = require('./db');

async function runServiceImagesMigration() {
  try {
    console.log('🔄 Running service images migration...');
    
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', 'add_service_images_column.sql'),
      'utf8'
    );
    
    await query(migrationSQL);
    
    console.log('✅ Service images migration completed successfully!');
    
    // Verify the new column exists
    const result = await query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'dashboard_salon_services' 
      AND column_name = 'service_images'
    `);
    
    if (result.rows.length > 0) {
      console.log('📋 New column added:');
      result.rows.forEach(row => {
        console.log(`- ${row.column_name}: ${row.data_type} (default: ${row.column_default || 'NULL'})`);
      });
    } else {
      console.log('⚠️  Column may already exist or migration failed');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runServiceImagesMigration();