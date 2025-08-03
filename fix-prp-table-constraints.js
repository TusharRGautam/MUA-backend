/**
 * Script to fix PRP table constraints
 * This script will remove NOT NULL constraints from old columns
 */

require('dotenv').config();
const { Pool } = require('pg');

// Create a simple connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000, // 10 seconds timeout
});

async function fixPrpTableConstraints() {
  console.log('Starting PRP table constraints fix...');
  
  let client;
  try {
    client = await pool.connect();
    console.log('Database connection established successfully.');
    
    await client.query('BEGIN');
    console.log('Transaction started.');
    
    // Check current constraints on dashboard_prp_services
    console.log('\n=== CHECKING CURRENT CONSTRAINTS ===');
    
    const constraints = await client.query(`
      SELECT column_name, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'dashboard_prp_services'
      AND is_nullable = 'NO'
      AND column_name NOT IN ('id', 'created_at', 'updated_at')
      ORDER BY ordinal_position;
    `);
    
    console.log('Columns with NOT NULL constraints:');
    constraints.rows.forEach(row => {
      console.log(`  ${row.column_name}: nullable=${row.is_nullable}, default=${row.column_default}`);
    });
    
    // Remove NOT NULL constraints from old columns that might conflict
    const oldColumnsToFix = ['package_name', 'category', 'service_names'];
    
    for (const columnName of oldColumnsToFix) {
      try {
        console.log(`\nRemoving NOT NULL constraint from ${columnName}...`);
        await client.query(`ALTER TABLE dashboard_prp_services ALTER COLUMN ${columnName} DROP NOT NULL;`);
        console.log(`✓ Successfully removed NOT NULL constraint from ${columnName}`);
      } catch (error) {
        if (error.message.includes('does not exist')) {
          console.log(`  Column ${columnName} does not exist - skipping`);
        } else {
          console.log(`  Error modifying ${columnName}: ${error.message}`);
        }
      }
    }
    
    // Also check if we need to set default values for required new columns
    const newRequiredColumns = ['service_name', 'service_category', 'service_price', 'service_duration', 'service_sessions'];
    
    console.log('\n=== CHECKING NEW REQUIRED COLUMNS ===');
    
    for (const columnName of newRequiredColumns) {
      const columnInfo = await client.query(`
        SELECT column_name, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'dashboard_prp_services'
        AND column_name = $1;
      `, [columnName]);
      
      if (columnInfo.rows.length > 0) {
        const col = columnInfo.rows[0];
        console.log(`  ${col.column_name}: nullable=${col.is_nullable}, default=${col.column_default}`);
        
        // If the column exists but is nullable and we have existing records, we might need to set defaults
        if (col.is_nullable === 'YES') {
          const recordCount = await client.query('SELECT COUNT(*) FROM dashboard_prp_services WHERE ' + columnName + ' IS NULL');
          if (parseInt(recordCount.rows[0].count) > 0) {
            console.log(`    Found ${recordCount.rows[0].count} records with NULL ${columnName}`);
            
            // Set appropriate defaults based on column type
            let defaultValue;
            switch (columnName) {
              case 'service_name':
                defaultValue = "'Unnamed Service'";
                break;
              case 'service_category':
                defaultValue = "'General'";
                break;
              case 'service_price':
                defaultValue = '0.00';
                break;
              case 'service_duration':
                defaultValue = '60';
                break;
              case 'service_sessions':
                defaultValue = '1';
                break;
              default:
                defaultValue = null;
            }
            
            if (defaultValue) {
              console.log(`    Setting default value ${defaultValue} for NULL records...`);
              await client.query(`UPDATE dashboard_prp_services SET ${columnName} = ${defaultValue} WHERE ${columnName} IS NULL`);
              console.log(`    ✓ Updated NULL records with default value`);
            }
          }
        }
      } else {
        console.log(`  ${columnName}: COLUMN DOES NOT EXIST`);
      }
    }
    
    await client.query('COMMIT');
    console.log('\nTransaction committed successfully.');
    
    console.log('\n=== PRP TABLE CONSTRAINTS FIX COMPLETED ===');
    console.log('PRP table constraints have been fixed.');
    
  } catch (error) {
    console.error('Error fixing PRP table constraints:', error);
    if (client) {
      try {
        await client.query('ROLLBACK');
        console.log('Transaction rolled back.');
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
    }
    throw error;
  } finally {
    // Release the client back to the pool
    if (client) {
      client.release();
    }
  }
}

// Execute the function
console.log('Starting constraint fix script...');

fixPrpTableConstraints()
  .then(() => {
    console.log('Constraint fix completed successfully.');
  })
  .catch(err => {
    console.error('Constraint fix failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    console.log('Closing database pool...');
    try {
      await pool.end();
      console.log('Database pool closed.');
    } catch (err) {
      console.error('Error closing pool:', err);
    }
  });