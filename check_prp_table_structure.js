/**
 * Script to check the current structure of dashboard_prp_services table
 */

const { Client } = require('pg');
require('dotenv').config();

async function checkTableStructure() {
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
        AND table_name = 'dashboard_prp_services'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('❌ dashboard_prp_services table does not exist');
      return;
    }

    console.log('✅ dashboard_prp_services table exists');

    // Get table structure
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = current_schema() 
      AND table_name = 'dashboard_prp_services'
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Current table structure:');
    console.log('===============================');
    columns.rows.forEach(column => {
      console.log(`${column.column_name.padEnd(20)} | ${column.data_type.padEnd(20)} | ${column.is_nullable} | ${column.column_default || 'NULL'}`);
    });

    // Check specifically for icon_image and package_name columns
    console.log('\n🔍 Checking specific columns:');
    const iconImageExists = columns.rows.some(col => col.column_name === 'icon_image');
    const packageNameExists = columns.rows.some(col => col.column_name === 'package_name');
    
    console.log(`icon_image column: ${iconImageExists ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`package_name column: ${packageNameExists ? '✅ EXISTS' : '❌ MISSING'}`);

    if (!iconImageExists) {
      console.log('\n⚠️ icon_image column is missing and needs to be added');
    }

    if (!packageNameExists) {
      console.log('\n⚠️ package_name column is missing and needs to be added');
    }

  } catch (error) {
    console.error('❌ Error checking table structure:', error.message);
  } finally {
    await client.end();
    console.log('\nDatabase connection closed');
  }
}

checkTableStructure(); 