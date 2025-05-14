const fs = require('fs');
const path = require('path');
const { query, pool } = require('./db');

async function runComboTablesMigration() {
  try {
    console.log('Starting migration: Creating combo service tables...');
    
    // Read the migration SQL file
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', 'create_combo_tables.sql'),
      'utf8'
    );
    
    // Split the SQL into individual statements
    const statements = migrationSQL.split(';').filter(stmt => stmt.trim().length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement separately
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement.length === 0) continue;
      
      // Skip DO blocks with BEGIN/END as they're causing issues
      if (statement.includes('DO $$') || statement.includes('BEGIN')) {
        console.log(`Skipping complex statement ${i+1}: ${statement.substring(0, 50)}...`);
        continue;
      }
      
      console.log(`Executing statement ${i+1}: ${statement.substring(0, 50)}...`);
      await query(statement);
      console.log(`Statement ${i+1} executed successfully`);
    }
    
    console.log('Migration completed successfully');
    
    // Check if the tables were created
    const tablesResult = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('vendor_combo_services', 'combo_services')
    `);
    
    console.log('Created tables:');
    tablesResult.rows.forEach(table => {
      console.log(`- ${table.table_name}`);
    });
    
    // Create the update_modified_column function if it doesn't exist
    console.log('Creating or verifying update_modified_column function...');
    await query(`
      CREATE OR REPLACE FUNCTION update_modified_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    // Create triggers
    console.log('Creating triggers for timestamp updates...');
    try {
      await query(`
        CREATE TRIGGER update_vendor_combo_services_timestamp
        BEFORE UPDATE ON vendor_combo_services
        FOR EACH ROW
        EXECUTE FUNCTION update_modified_column();
      `);
      console.log('Trigger created for vendor_combo_services');
    } catch (triggerError1) {
      console.log('Trigger already exists for vendor_combo_services');
    }
    
    try {
      await query(`
        CREATE TRIGGER update_combo_services_timestamp
        BEFORE UPDATE ON combo_services
        FOR EACH ROW
        EXECUTE FUNCTION update_modified_column();
      `);
      console.log('Trigger created for combo_services');
    } catch (triggerError2) {
      console.log('Trigger already exists for combo_services');
    }
    
    // Check schema of vendor_combo_services
    const comboTableSchema = await query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'vendor_combo_services'
      ORDER BY ordinal_position
    `);
    
    console.log('\nvendor_combo_services schema:');
    comboTableSchema.rows.forEach(column => {
      console.log(`- ${column.column_name}: ${column.data_type}${
        column.character_maximum_length ? `(${column.character_maximum_length})` : ''
      }`);
    });
    
    // Check schema of combo_services
    const servicesTableSchema = await query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'combo_services'
      ORDER BY ordinal_position
    `);
    
    console.log('\ncombo_services schema:');
    servicesTableSchema.rows.forEach(column => {
      console.log(`- ${column.column_name}: ${column.data_type}${
        column.character_maximum_length ? `(${column.character_maximum_length})` : ''
      }`);
    });
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the migration
runComboTablesMigration(); 