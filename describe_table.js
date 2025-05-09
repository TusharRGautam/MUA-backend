/**
 * This script describes the structure of a specified table
 */
require('dotenv').config();
const { pool } = require('./db');

// Table name to describe
const tableName = 'profiles';

async function describeTable() {
  const client = await pool.connect();
  
  try {
    console.log(`Describing table structure for: ${tableName}`);
    
    const query = `
      SELECT 
        column_name, 
        data_type, 
        character_maximum_length,
        column_default,
        is_nullable
      FROM 
        information_schema.columns
      WHERE 
        table_name = $1
      ORDER BY 
        ordinal_position;
    `;
    
    const result = await client.query(query, [tableName]);
    
    if (result.rows.length === 0) {
      console.log(`Table '${tableName}' not found in the database.`);
    } else {
      console.log(`Columns in table '${tableName}':`);
      console.log('-'.repeat(100));
      console.log('Column Name'.padEnd(30) + 'Data Type'.padEnd(20) + 'Length'.padEnd(10) + 'Default'.padEnd(20) + 'Nullable');
      console.log('-'.repeat(100));
      
      result.rows.forEach(row => {
        console.log(
          row.column_name.padEnd(30) + 
          row.data_type.padEnd(20) + 
          (row.character_maximum_length || '').toString().padEnd(10) + 
          (row.column_default || '').toString().padEnd(20) + 
          row.is_nullable
        );
      });
    }
    
  } catch (error) {
    console.error('Error describing table:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

describeTable().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Failed to describe table:', err);
  process.exit(1);
}); 