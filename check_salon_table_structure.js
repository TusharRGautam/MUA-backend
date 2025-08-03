/**
 * Script to check the current structure of dashboard_salon_services table
 */

const { Client } = require('pg');
require('dotenv').config();

async function checkSalonTableStructure() {
  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: process.env.DB_SSL === 'true' ? {
      rejectUnauthorized: false
    } : false
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check if table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = current_schema() 
        AND table_name = 'dashboard_salon_services'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('❌ dashboard_salon_services table does not exist');
      return;
    }

    console.log('✅ dashboard_salon_services table exists');

    // Get table structure
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = current_schema() 
      AND table_name = 'dashboard_salon_services'
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Current table structure:');
    console.log('===============================');
    columns.rows.forEach(column => {
      console.log(`${column.column_name.padEnd(25)} | ${column.data_type.padEnd(20)} | ${column.is_nullable} | ${column.column_default || 'NULL'}`);
    });

    // Check for specific columns that might be missing
    console.log('\n🔍 Checking for commonly needed columns:');
    const neededColumns = [
      'icon_image',
      'package_includes', 
      'things_to_know',
      'precautions',
      'products_used',
      'package_name'
    ];
    
    neededColumns.forEach(col => {
      const exists = columns.rows.some(dbCol => dbCol.column_name === col);
      console.log(`${col.padEnd(20)} : ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
    });

    // Get sample data if exists
    const sampleData = await client.query('SELECT * FROM dashboard_salon_services LIMIT 3');
    if (sampleData.rows.length > 0) {
      console.log('\n📊 Sample data (first 3 records):');
      console.log('===================================');
      sampleData.rows.forEach((row, index) => {
        console.log(`Record ${index + 1}:`, JSON.stringify(row, null, 2));
      });
    } else {
      console.log('\n📊 No sample data found in table');
    }

  } catch (error) {
    console.error('❌ Error checking table structure:', error.message);
  } finally {
    await client.end();
    console.log('\nDatabase connection closed');
  }
}

checkSalonTableStructure(); 