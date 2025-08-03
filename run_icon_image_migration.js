/**
 * Migration runner to add icon_image column to dashboard_prp_services table
 * This script adds the missing icon_image column to store ImageKit URLs for PRP service icons
 */

const { Client } = require('pg');
require('dotenv').config();

async function runIconImageMigration() {
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

    // Check if dashboard_prp_services table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = current_schema() 
        AND table_name = 'dashboard_prp_services'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('❌ dashboard_prp_services table does not exist. Please run the main migrations first.');
      return;
    }

    // Check if icon_image column already exists
    const columnCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = current_schema() 
        AND table_name = 'dashboard_prp_services' 
        AND column_name = 'icon_image'
      );
    `);

    if (columnCheck.rows[0].exists) {
      console.log('✅ icon_image column already exists in dashboard_prp_services table.');
      return;
    }

    console.log('🔧 Adding icon_image column to dashboard_prp_services table...');

    // Begin transaction
    await client.query('BEGIN');

    try {
      // Add icon_image column
      await client.query(`
        ALTER TABLE dashboard_prp_services 
        ADD COLUMN icon_image TEXT
      `);

      // Add comment for the new column
      await client.query(`
        COMMENT ON COLUMN dashboard_prp_services.icon_image IS 'ImageKit URL for PRP service icon image'
      `);

      // Commit transaction
      await client.query('COMMIT');

      console.log('✅ Successfully added icon_image column to dashboard_prp_services table');
      console.log('✅ Added column comment');

      // Verify the column was added
      const verifyColumn = await client.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_schema = current_schema() 
        AND table_name = 'dashboard_prp_services' 
        AND column_name = 'icon_image'
      `);

      if (verifyColumn.rows.length > 0) {
        console.log('✅ Column verification successful:');
        console.log(`   - Column Name: ${verifyColumn.rows[0].column_name}`);
        console.log(`   - Data Type: ${verifyColumn.rows[0].data_type}`);
        console.log(`   - Nullable: ${verifyColumn.rows[0].is_nullable}`);
      }

    } catch (error) {
      // Rollback on error
      await client.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('❌ Error running icon_image migration:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the migration
console.log('🚀 Starting icon_image column migration...');
runIconImageMigration(); 