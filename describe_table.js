/**
 * This script describes the structure of a specified table
 */
require('dotenv').config();
const { pool, query } = require('./db');

// Table name to describe
const tableName = process.argv[2] || 'customer_table_details';

async function describeTable() {
  try {
    console.log(`Describing table: ${tableName}`);
    
    // Query to get column details
    const columnQuery = `
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
    
    const result = await query(columnQuery, [tableName]);
    
    if (result.rows.length === 0) {
      console.log(`\nTable '${tableName}' not found or has no columns.`);
      return;
    }
    
    console.log("\nTable structure:");
    console.log("-".repeat(100));
    console.log(`| ${'Column Name'.padEnd(30)} | ${'Data Type'.padEnd(25)} | ${'Length'.padEnd(10)} | ${'Default'.padEnd(15)} | ${'Nullable'.padEnd(10)} |`);
    console.log("-".repeat(100));
    
    result.rows.forEach(row => {
      console.log(
        `| ${row.column_name.padEnd(30)} | ${row.data_type.padEnd(25)} | ${(row.character_maximum_length?.toString() || 'N/A').padEnd(10)} | ${(row.column_default?.toString() || 'N/A').padEnd(15)} | ${row.is_nullable.padEnd(10)} |`
      );
    });
    
    console.log("-".repeat(100));
    
    // Query to get indexes
    const indexQuery = `
      SELECT
        indexname,
        indexdef
      FROM
        pg_indexes
      WHERE
        tablename = $1;
    `;
    
    // Execute the query for indexes
    const indexResult = await query(indexQuery, [tableName]);
    
    if (indexResult.rows.length > 0) {
      console.log("\nIndexes:");
      console.log("-".repeat(100));
      indexResult.rows.forEach(row => {
        console.log(`${row.indexname}: ${row.indexdef}`);
      });
      console.log("-".repeat(100));
    } else {
      console.log("\nNo indexes found for this table.");
    }
    
  } catch (error) {
    console.error('Error describing table:', error);
  }
}

// Call the function
describeTable()
  .then(() => console.log('Table description complete'))
  .catch(err => console.error('Error:', err)); 