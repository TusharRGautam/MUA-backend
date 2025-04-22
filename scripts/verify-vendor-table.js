require('dotenv').config();
const { Pool } = require('pg');

// Disable SSL certificate validation for development
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Create PostgreSQL client
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
});

async function verifyTable() {
  try {
    console.log('Verifying Registration_And_Other_Details table...');
    
    // Check if table exists
    const tableResult = await pool.query(`
      SELECT * FROM information_schema.tables 
      WHERE table_name = 'registration_and_other_details'
    `);
    
    if (tableResult.rowCount > 0) {
      console.log('✅ Table exists!');
      
      // Check table structure
      const columnsResult = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'registration_and_other_details'
        ORDER BY ordinal_position
      `);
      
      console.log('\nTable Structure:');
      console.table(columnsResult.rows);
      
      // Check if indexes exist
      const indexResult = await pool.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'registration_and_other_details'
      `);
      
      console.log('\nIndexes:');
      console.table(indexResult.rows);
      
      // Check if RLS is enabled
      const rlsResult = await pool.query(`
        SELECT relname, relrowsecurity
        FROM pg_class
        WHERE relname = 'registration_and_other_details'
      `);
      
      console.log('\nRow Level Security:');
      console.table(rlsResult.rows);
      
      console.log('\nMigration verification complete!');
    } else {
      console.error('❌ Table does not exist!');
    }
  } catch (error) {
    console.error('Error verifying table:', error);
  } finally {
    pool.end();
  }
}

verifyTable(); 