/**
 * Script to verify if the prp_services_from_dashboard_and_app table exists
 */

const { pool } = require('./db');

async function verifyTable() {
  const client = await pool.connect();
  
  try {
    console.log('Connecting to PostgreSQL database...');
    
    // Check if the table exists
    const tableCheckResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'prp_services_from_dashboard_and_app'
      );
    `);
    
    const tableExists = tableCheckResult.rows[0].exists;
    
    if (tableExists) {
      console.log('✅ Table prp_services_from_dashboard_and_app exists');
      
      // Count records in the table
      const countResult = await client.query(`
        SELECT COUNT(*) FROM prp_services_from_dashboard_and_app;
      `);
      
      const recordCount = parseInt(countResult.rows[0].count);
      console.log(`✅ Table contains ${recordCount} records`);
      
      // Get table structure
      const structureResult = await client.query(`
        SELECT column_name, data_type, character_maximum_length
        FROM information_schema.columns
        WHERE table_name = 'prp_services_from_dashboard_and_app'
        ORDER BY ordinal_position
      `);
      
      console.log('\nTable structure:');
      structureResult.rows.forEach(column => {
        console.log(`- ${column.column_name}: ${column.data_type}${column.character_maximum_length ? `(${column.character_maximum_length})` : ''}`);
      });
    } else {
      console.log('❌ Table prp_services_from_dashboard_and_app does NOT exist');
    }
    
  } catch (error) {
    console.error('Error verifying table:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the verification
verifyTable();