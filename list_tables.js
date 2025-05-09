/**
 * This script lists all tables in the database
 */
require('dotenv').config();
const { pool } = require('./db');

async function listTables() {
  const client = await pool.connect();
  
  try {
    console.log('Listing all tables in the database...');
    
    const query = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    const result = await client.query(query);
    
    if (result.rows.length === 0) {
      console.log('No tables found in the database.');
    } else {
      console.log('Tables in the database:');
      result.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.table_name}`);
      });
    }
    
  } catch (error) {
    console.error('Error listing tables:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

listTables().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Failed to list tables:', err);
  process.exit(1);
}); 