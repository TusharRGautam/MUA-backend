const { query } = require('./db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('Starting vendor_preferences table migration...');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'migrations', 'create_vendor_preferences_simple.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await query(migrationSQL);
    
    console.log('✅ vendor_preferences table migration completed successfully');
    
    // Verify the table was created
    const verifyQuery = `
      SELECT table_name 
      FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'vendor_preferences'
    `;
    
    const result = await query(verifyQuery);
    
    if (result.rows && result.rows.length > 0) {
      console.log('✅ vendor_preferences table verified successfully');
      
      // Show table structure
      const structureQuery = `
        SELECT column_name, data_type, is_nullable, column_default 
        FROM information_schema.columns 
        WHERE table_name = 'vendor_preferences' 
        ORDER BY ordinal_position
      `;
      
      const structureResult = await query(structureQuery);
      console.log('📋 Table structure:');
      structureResult.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
      });
    } else {
      console.error('❌ Table verification failed');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration(); 